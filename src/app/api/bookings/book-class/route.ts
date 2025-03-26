import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import authenticate from "@/middleware/authentication";
import { ObjectId } from "mongodb";
import { sendEmail } from "@/app/lib/mailer"; // Ensure you have a sendEmail function

export async function POST(req: NextRequest) {
  const user = await authenticate(req);
  if (user instanceof NextResponse) return user;

  const userId = (user as any).userId || (user as any)._id;

  if (!userId || typeof userId !== "string" || !ObjectId.isValid(userId)) {
    return NextResponse.json({ error: "Invalid User ID" }, { status: 400 });
  }

  try {
    const { parentName, studentName, email, phone, grade, concerns, preferredTime } = await req.json();

    if (!parentName || !studentName || !email || !phone || !grade || !preferredTime) {
      return NextResponse.json({ error: "All required fields must be filled" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const usersCollection = db.collection("users");
    const bookingsCollection = db.collection("bookings");

    const userRecord = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!userRecord) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { freeClassSessions = 0, weeklyClassLimit = 0, instructor } = userRecord;

    if (freeClassSessions <= 0 && weeklyClassLimit <= 0) {
      return NextResponse.json({ error: "Weekly class limit reached" }, { status: 403 });
    }

    const updateFields: any = {};
    if (freeClassSessions > 0) {
      updateFields.freeClassSessions = freeClassSessions - 1;
    } else if (weeklyClassLimit > 0) {
      updateFields.weeklyClassLimit = weeklyClassLimit - 1;
    }

    // Format preferred time
    const formattedTime = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "UTC",
    }).format(new Date(preferredTime));

    // Check if this is the user's first booking
    const existingBookings = await bookingsCollection.countDocuments({ userId: new ObjectId(userId) });

    // Create new booking
    const newBooking = {
      userId: new ObjectId(userId),
      parentName,
      studentName,
      email,
      phone,
      grade,
      concerns: concerns || "",
      preferredTime: new Date(preferredTime), // Store as Date object
      createdAt: new Date(),
    };

    const result = await bookingsCollection.insertOne(newBooking);

    // Update user record with new limits
    await usersCollection.updateOne({ _id: new ObjectId(userId) }, { $set: updateFields });

    // Send confirmation email to student
    await sendEmail(
      email,
      "Math Point Tutoring Session Confirmation",
      `<p>Dear ${studentName},</p>
       <p>Your tutoring session has been scheduled.</p>
       <p><strong>Preferred Time:</strong> ${formattedTime} (UTC)</p>
       <p>Please check your Calendly invite and add it to your calendar to avoid missing the session.</p>
       <p>Best regards,<br>Math Point Team</p>`
    );

    // Send email only to the assigned instructor
    if (instructor && ObjectId.isValid(instructor)) {
      const instructorRecord = await usersCollection.findOne({ _id: new ObjectId(instructor) });

      if (instructorRecord?.email) {
        await sendEmail(
          instructorRecord.email,
          "New Tutoring Session Scheduled",
          `<p>Hello ${instructorRecord.fullName || "Instructor"},</p>
           <p>A new tutoring session has been scheduled.</p>
           <p><strong>Student:</strong> ${studentName}</p>
           <p><strong>Parent:</strong> ${parentName}</p>
           <p><strong>Grade:</strong> ${grade}</p>
           <p><strong>Preferred Time:</strong> ${formattedTime} (UTC)</p>
           <p>Concerns: ${concerns || "None"}</p>
           <p>Best regards,<br>Math Point Team</p>`
        );
      }
    }

    // If this is the user's first booking, notify the sender email to assign an instructor
    if (existingBookings === 0) {
      const senderEmail = process.env.SENDER_EMAIL as string;
      await sendEmail(
        senderEmail,
        "New Student Booking - Instructor Assignment Needed",
        `<p>A new student has booked their first tutoring session.</p>
         <p><strong>Student Name:</strong> ${studentName}</p>
         <p><strong>Parent Name:</strong> ${parentName}</p>
         <p><strong>Email:</strong> ${email}</p>
         <p><strong>Phone:</strong> ${phone}</p>
         <p><strong>Grade:</strong> ${grade}</p>
         <p><strong>Preferred Time:</strong> ${formattedTime} (UTC)</p>
         <p><strong>Concerns:</strong> ${concerns || "None"}</p>
         <p>Please assign an instructor for this student.</p>
         <p>Best regards,<br>Math Point Team</p>`
      );
    }

    return NextResponse.json(
      { message: "Booking successful, instructor notified", bookingId: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
