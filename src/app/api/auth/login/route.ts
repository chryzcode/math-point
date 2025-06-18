import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendEmail } from "@/app/lib/mailer"; // Importing Brevo email function

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const user = await db.collection("users").findOne({ email });

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // If user is not verified, resend verification email
    if (!user.verified) {
      const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET!, { expiresIn: "1h" });

      // Update verification token in DB
      await db.collection("users").updateOne(
        { email },
        { $set: { verificationToken } }
      );

      const verificationLink = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/verify?token=${verificationToken}`;
      const emailContent = `<p>Hello ${user.name},</p><p>Please verify your account by clicking the link below:</p><a href="${verificationLink}">Verify Account</a><p>If you don't see this email in your inbox, please check your spam or junk folder.</p>`;
      
      await sendEmail(email, "Verify Your Account", emailContent);

      return NextResponse.json(
        { error: "Your account is not verified. A new verification email has been sent." },
        { status: 403 }
      );
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    return NextResponse.json({ message: "Login successful", token, user }, { status: 200 });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
