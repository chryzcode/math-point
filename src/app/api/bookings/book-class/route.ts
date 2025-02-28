import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import authenticate from "@/middleware/authentication";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  const user = await authenticate(req);
  if (user instanceof NextResponse) return user; // Return error if authentication fails

  const userId = (user as any).userId || (user as any)._id;

  // Ensure userId is valid
  if (!userId || typeof userId !== "string" || !ObjectId.isValid(userId)) {
    return NextResponse.json({ error: "Invalid User ID" }, { status: 400 });
  }

  try {
    const { parentName, studentName, email, phone, grade, concerns, preferredTime } = await req.json();

    // Validate required fields
    if (!parentName || !studentName || !email || !phone || !grade || !preferredTime) {
      return NextResponse.json({ error: "All required fields must be filled" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const usersCollection = db.collection("users");
    const bookingsCollection = db.collection("bookings");

    // Retrieve user's current weekly class limit
    const userRecord = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!userRecord) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!userRecord.weeklyClassLimit || userRecord.weeklyClassLimit <= 0) {
      return NextResponse.json({ error: "Weekly class limit reached" }, { status: 403 });
    }

    // Create new booking
    const newBooking = {
      userId: new ObjectId(userId),
      parentName,
      studentName,
      email,
      phone,
      grade,
      concerns: concerns || "",
      preferredTime,
      createdAt: new Date(),
    };

    // Insert into the database
    const result = await bookingsCollection.insertOne(newBooking);

    // Reduce the weekly class limit by 1
    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $inc: { weeklyClassLimit: -1 } }
    );

    return NextResponse.json(
      { message: "Booking successful", bookingId: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
