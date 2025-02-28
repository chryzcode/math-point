import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import jwt from "jsonwebtoken";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/login?status=invalid`);
  }

  try {
    const { email } = jwt.verify(token, process.env.JWT_SECRET!) as { email: string };
    const { db } = await connectToDatabase();

    // Find user and verify
    const user = await db.collection("users").findOne({ email, verificationToken: token });

    if (!user) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/login?status=expired`);
    }

    // Update user verification status
    await db.collection("users").updateOne(
      { email },
      { $set: { verified: true }, $unset: { verificationToken: "" } }
    );

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/login?status=success`);
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/login?status=error`);
  }
}
