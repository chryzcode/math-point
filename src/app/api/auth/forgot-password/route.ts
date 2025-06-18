import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import { hash } from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendEmail } from "@/app/lib/mailer"; // Import Brevo email function

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ message: "Email is required" }, { status: 400 });

    const { db } = await connectToDatabase();
    const user = await db.collection("users").findOne({ email });

    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: "1h" });
    await db.collection("users").updateOne({ email }, { $set: { resetToken: token } });

    // ✅ Send password reset email using Brevo
    const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/reset-password?token=${token}`;
    await sendEmail(email, "Password Reset Request", `
      <p>Hello,</p>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${resetLink}" target="_blank">${resetLink}</a>
      <p>If you did not request this, please ignore this email.</p>
      <p>If you don't see this email in your inbox, please check your spam or junk folder.</p>
    `);

    return NextResponse.json({ message: "Password reset link sent to your email" }, { status: 200 });

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
