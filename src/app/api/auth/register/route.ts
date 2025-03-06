import { connectToDatabase } from "../../../lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendEmail } from "@/app/lib/mailer"; // Import the Brevo email function

interface User {
  name: string;
  email: string;
  password: string;
  verified: boolean;
  verificationToken: string;
  freeClassSessions: number;
  weeklyClassLimit: number;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    // Input validation
    if (!name || !email || !password) {
      return new Response(JSON.stringify({ error: "All fields are required" }), { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Check if user already exists
    const existingUser = await db.collection<User>("users").findOne({ email });
    if (existingUser) {
      return new Response(JSON.stringify({ error: "User already exists" }), { status: 400 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification token
    const token = jwt.sign({ email }, process.env.JWT_SECRET!, { expiresIn: "1h" });
    const verificationLink = `${process.env.BASE_URL}/api/auth/verify?token=${token}`;

    // Save the unverified user
    await db.collection<User>("users").insertOne({
      name,
      email,
      password: hashedPassword,
      verified: false,
      verificationToken: token,
      freeClassSessions: 1,
      weeklyClassLimit: 0,
    });

    // Send verification email
    await sendEmail(
      email,
      "Verify Your Email",
      `<p>Hi ${name},</p>
      <p>Click the link below to verify your email:</p>
      <a href="${verificationLink}">Verify Email</a>`
    );

    return new Response(
      JSON.stringify({
        message: "User registered successfully. Check your email for verification.",
        verification_link: verificationLink, // Include it for frontend logging if needed
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Error during registration:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}
