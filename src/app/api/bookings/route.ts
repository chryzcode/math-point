import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import authenticate from "@/middleware/authentication";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  try {
    // Authenticate the user
    const user = await authenticate(req);
    if (user instanceof NextResponse) return user;

    const userId = (user as any).userId || (user as any)._id;
    if (!userId || typeof userId !== "string" || !ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid User ID" }, { status: 400 });
    }

    console.log("Fetching classes for user:", userId);

    // Connect to the database
    const { db } = await connectToDatabase();
    const bookingsCollection = db.collection("bookings");
    const usersCollection = db.collection("users");

    // Get the current date and time in UTC
    const currentDateUTC = new Date();
    console.log("Current UTC Date:", currentDateUTC.toISOString());

    // Calculate the start of the current week (Sunday) in UTC
    const startOfWeekUTC = new Date(currentDateUTC);
    startOfWeekUTC.setUTCDate(currentDateUTC.getUTCDate() - currentDateUTC.getUTCDay()); // Start of the week (Sunday)
    startOfWeekUTC.setUTCHours(0, 0, 0, 0);

    const endOfWeekUTC = new Date(startOfWeekUTC);
    endOfWeekUTC.setUTCDate(startOfWeekUTC.getUTCDate() + 6); // End of the week (Saturday)
    endOfWeekUTC.setUTCHours(23, 59, 59, 999);

    console.log("Start of Week (UTC):", startOfWeekUTC.toISOString());
    console.log("End of Week (UTC):", endOfWeekUTC.toISOString());

    // Fetch all bookings for the user
    const userBookings = await bookingsCollection
      .find({ userId: new ObjectId(userId) })
      .toArray();

    console.log("Total bookings found:", userBookings.length);

    // Classify bookings into categories
    const pastClasses = [];
    const upcomingClasses = [];
    const classesThisWeek = [];

    for (const cls of userBookings) {
      if (!cls.preferredTime) {
        console.warn("Skipping booking with missing preferredTime:", cls._id);
        continue; // Skip bookings without a valid preferredTime
      }

      const classDateUTC = new Date(cls.preferredTime);
      console.log("Processing class:", cls._id, "Date:", classDateUTC.toISOString());

      if (classDateUTC < currentDateUTC) {
        // If the class is in the past (its preferredTime is earlier than current UTC time)
        pastClasses.push(cls);
      } else {
        // If the class is in the future or the same day but hasn't occurred yet
        upcomingClasses.push(cls);

        // Additionally, check if it's happening within this week
        if (classDateUTC >= startOfWeekUTC && classDateUTC <= endOfWeekUTC) {
          classesThisWeek.push(cls);
        }
      }
    }

    console.log("Past Classes:", pastClasses.length);
    console.log("This Week Classes:", classesThisWeek.length);
    console.log("Upcoming Classes:", upcomingClasses.length);

    // Fetch the user's profile
    const userProfile = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    const totalClasses = userProfile.weeklyClassLimit || 0;
    const freeSessions = userProfile.freeClassSessions || 0;

    // Check if the week has changed
    const lastWeekStart = userProfile.lastWeekStart ? new Date(userProfile.lastWeekStart) : null;

    if (!lastWeekStart || lastWeekStart.toISOString() !== startOfWeekUTC.toISOString()) {
      // If the week has changed, reset remaining classes to total classes
      console.log("New week detected, resetting remaining classes.");
      await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: {
            remainingClasses: totalClasses,
            lastWeekStart: startOfWeekUTC.toISOString(),
          },
        }
      );
    }

    // Fetch the updated profile to get the latest remaining classes
    const updatedUserProfile = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!updatedUserProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }
    
    console.log( classesThisWeek.length)
    let remainingClasses = totalClasses - classesThisWeek.length;
    if (remainingClasses < 0) remainingClasses = 0;

    // Helper function to format class data
    const formatClasses = (classes: any[]) =>
      classes.map(cls => ({
        ...cls,
        preferredTime: cls.preferredTime ? new Date(cls.preferredTime).toISOString() : null,
        createdAt: cls.createdAt ? new Date(cls.createdAt).toISOString() : null,
      }));

    // Return the response
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