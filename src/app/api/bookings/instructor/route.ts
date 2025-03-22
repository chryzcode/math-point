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

    // Fetch the user from the database using their ID
    const dbUser = await usersCollection.findOne({ _id: new ObjectId((user as any).userId) });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Check if user is an instructor
    if (dbUser.role !== "instructor") {
      return NextResponse.json({ error: "Access denied. Only instructors can access this data." }, { status: 403 });
    }

    // Get current UTC time
    const currentDateUTC = new Date();

    // Fetch all classes
    const allBookings = await bookingsCollection.find().toArray();

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

    // Get total instructors count
    const totalInstructors = await usersCollection.countDocuments({ role: "instructor" });

    return NextResponse.json(
      {
        pastClasses,
        upcomingClasses,
        totalClasses: allBookings.length,
        remainingClasses: upcomingClasses.length,
        totalInstructors: totalInstructors, // Show total instructors
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching all classes:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
