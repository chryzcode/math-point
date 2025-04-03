import { connectToDatabase } from "@/app/lib/db";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url); // Extract token from URL query
    const token = searchParams.get("token");
    const { newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json({ message: "Invalid request" }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Find user by reset token
    const user = await db.collection("users").findOne({ resetToken: token });

    if (!user) {
      return NextResponse.json({ message: "Invalid or expired token" }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await hash(newPassword, 10);

    // Update user password and remove reset token
    await db.collection("users").updateOne(
      { _id: user._id },
      { $set: { password: hashedPassword }, $unset: { resetToken: "" } }
    );

    return NextResponse.json({ message: "Password reset successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
