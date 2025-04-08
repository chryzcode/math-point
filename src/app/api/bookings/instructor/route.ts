import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import authenticate from "@/middleware/authentication";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  try {
    // Authenticate instructor
    const user = await authenticate(req);
    if (user instanceof NextResponse) return user;

    const { db } = await connectToDatabase();
    const usersCollection = db.collection("users");
    const bookingsCollection = db.collection("bookings");

    const instructorId = new ObjectId((user as any).userId);

    // Find the instructor
    const instructor = await usersCollection.findOne({ _id: instructorId });

    if (!instructor) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (instructor.role !== "instructor") {
      return NextResponse.json(
        { error: "Access denied. Only instructors can access this data." },
        { status: 403 }
      );
    }

    // Get all students assigned to this instructor
    const students = await usersCollection
      .find({ role: "student", instructorId })
      .toArray();

    const studentIds = students.map((s) => s._id);

    if (studentIds.length === 0) {
      return NextResponse.json({
        totalClasses: 0,
        remainingClasses: 0,
        pastClasses: [],
        upcomingClasses: [],
        totalStudents: 0,
      });
    }

    // Fetch bookings for all students assigned to this instructor
    const bookings = await bookingsCollection
      .find({ userId: { $in: studentIds } })
      .toArray();

    // Get current UTC time
    const now = new Date();

    const pastClasses = [];
    const upcomingClasses = [];

    for (const booking of bookings) {
      const bookingTime = new Date(booking.preferredTime);
      if (isNaN(bookingTime.getTime())) continue;

      if (bookingTime < now) {
        pastClasses.push(booking);
      } else {
        upcomingClasses.push(booking);
      }
    }

    return NextResponse.json(
      {
        totalClasses: bookings.length,
        remainingClasses: upcomingClasses.length,
        pastClasses,
        upcomingClasses,
        totalStudents: students.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching instructor's classes:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
