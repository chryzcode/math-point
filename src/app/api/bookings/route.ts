import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import authenticate from "@/middleware/authentication";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const user = await authenticate(req);
    if (user instanceof NextResponse) return user;

    const userId = (user as any).userId || (user as any)._id;
    if (!userId || typeof userId !== "string" || !ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid User ID" }, { status: 400 });
    }

    console.log("Fetching classes for user:", userId);

    // Connect to DB
    const { db } = await connectToDatabase();
    const bookingsCollection = db.collection("bookings");
    const usersCollection = db.collection("users");

    // Get current date
    const currentDate = new Date();
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
    endOfWeek.setHours(23, 59, 59, 999);

    // Convert to UTC
    const currentDateUTC = new Date(currentDate.toISOString());
    const startOfWeekUTC = new Date(startOfWeek.toISOString());
    const endOfWeekUTC = new Date(endOfWeek.toISOString());

    // Fetch bookings in a single query
    const userBookings = await bookingsCollection
      .find({ userId: new ObjectId(userId) })
      .toArray();

    // Classify bookings
    const pastClasses = [];
    const classesThisWeek = [];
    const upcomingClasses = [];

    for (const cls of userBookings) {
      if (cls.preferredTime < currentDateUTC) {
        pastClasses.push(cls);
      } else if (cls.preferredTime >= startOfWeekUTC && cls.preferredTime <= endOfWeekUTC) {
        classesThisWeek.push(cls);
      } else {
        upcomingClasses.push(cls);
      }
    }

    // Fetch user profile
    const userProfile = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    const totalClasses = userProfile.weeklyClassLimit || 0;
    const freeSessions = userProfile.freeClassSessions || 0;
    const remainingClasses = Math.max(0, totalClasses - classesThisWeek.length);

    // Format dates
    const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "UTC",
      });
    };

    // Format class data
    const formatClasses = (classes: any[]) =>
      classes.map(cls => ({
        ...cls,
        preferredTime: formatDate(cls.preferredTime),
        createdAt: formatDate(cls.createdAt),
      }));

    return NextResponse.json(
      {
        pastClasses: formatClasses(pastClasses),
        upcomingClasses: formatClasses(upcomingClasses),
        totalClasses,
        remainingClasses,
        freeSessions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
