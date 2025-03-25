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

    // Fetch the instructor from the database
    const instructor = await usersCollection.findOne({ _id: new ObjectId((user as any).userId) });

    if (!instructor) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Ensure user is an instructor
    if (instructor.role !== "instructor") {
      return NextResponse.json({ error: "Access denied. Only instructors can access this data." }, { status: 403 });
    }

    // Get current UTC time
    const currentDateUTC = new Date();

    // Fetch only bookings assigned to this instructor
    const instructorBookings = await bookingsCollection
      .find({ instructorId: instructor._id })
      .toArray();

    // Separate past and upcoming classes
    const pastClasses = [];
    const upcomingClasses = [];

    for (const cls of instructorBookings) {
      if (!cls.preferredTime) continue;

      const classDateUTC = new Date(cls.preferredTime);

      if (classDateUTC < currentDateUTC) {
        pastClasses.push(cls);
      } else {
        upcomingClasses.push(cls);
      }
    }

    // Get total students assigned to this instructor
    const totalStudents = await usersCollection.countDocuments({ instructorId: instructor._id });

    return NextResponse.json(
      {
        pastClasses,
        upcomingClasses,
        totalClasses: instructorBookings.length,
        remainingClasses: upcomingClasses.length,
        totalStudents,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching instructor's classes:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
