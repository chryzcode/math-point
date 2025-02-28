import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import authenticate from "@/middleware/authentication";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  const user = await authenticate(req);
  if (user instanceof NextResponse) return user; // Return error if authentication fails

  const userId = (user as any).userId || (user as any)._id;

  if (!userId || typeof userId !== "string" || !ObjectId.isValid(userId)) {
    return NextResponse.json({ error: "Invalid User ID" }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();
    const bookingsCollection = db.collection("bookings");

    const currentDate = new Date(); // Get the current date

    // Get start and end of the current week
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); // Set to Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Set to Saturday
    endOfWeek.setHours(23, 59, 59, 999);

    // Fetch past classes within this week
    const pastClasses = await bookingsCollection
      .find({ userId: new ObjectId(userId), preferredTime: { $lt: currentDate } })
      .toArray();

    // Fetch past classes for the current week
    const classesThisWeek = await bookingsCollection
      .find({
        userId: new ObjectId(userId),
        preferredTime: { $gte: startOfWeek, $lte: endOfWeek },
      })
      .toArray();

    // Fetch upcoming classes
    const upcomingClasses = await bookingsCollection
      .find({ userId: new ObjectId(userId), preferredTime: { $gte: currentDate } })
      .toArray();

    // Fetch user profile
    const userProfile = await db.collection("users").findOne({ _id: new ObjectId(userId) });
    const totalClasses = userProfile?.weeklyClassLimit || 0;
    const freeSessions = userProfile?.freeClassSessions || 0;

    // Calculate remaining classes dynamically
    const remainingClasses = Math.max(0, totalClasses - classesThisWeek.length);

    return NextResponse.json(
      { pastClasses, upcomingClasses, totalClasses, remainingClasses, freeSessions },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
