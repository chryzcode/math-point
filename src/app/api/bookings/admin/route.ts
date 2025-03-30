import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import authenticate from "@/middleware/authentication";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const user = await authenticate(req);
    if (user instanceof NextResponse) return user;

    // Connect to DB
    const { db } = await connectToDatabase();
    const usersCollection = db.collection("users");
    const bookingsCollection = db.collection("bookings");

    // Fetch the admin from the database
    const admin = await usersCollection.findOne({ _id: new ObjectId((user as any).userId) });

    if (!admin) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Ensure user is an admin
    if (admin.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Only admins can access this data." }, { status: 403 });
    }

    // Get current UTC time
    const currentDateUTC = new Date();

    // Fetch all bookings
    const allBookings = await bookingsCollection.find({}).toArray();

    // Separate past and upcoming classes
    const pastClasses = [];
    const upcomingClasses = [];

    for (const cls of allBookings) {
      if (!cls.preferredTime) continue;

      const classDateUTC = new Date(cls.preferredTime);

      if (classDateUTC < currentDateUTC) {
        pastClasses.push(cls);
      } else {
        upcomingClasses.push(cls);
      }
    }

    // Get total number of students
    const totalStudents = await usersCollection.countDocuments({ role: "student" });

    // Get total number of instructors
    const totalInstructors = await usersCollection.countDocuments({ role: "instructor" });

    return NextResponse.json(
      {
        pastClasses,
        upcomingClasses,
        totalClasses: allBookings.length,
        remainingClasses: upcomingClasses.length,
        totalStudents,
        totalInstructors,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching admin data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
