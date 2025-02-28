import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import authenticate from "@/middleware/authentication";

export async function GET(req: NextRequest) {
  const user = await authenticate(req);
  if (user instanceof NextResponse) return user; // Stop if authentication fails

  const userEmail = (user as any).email; // Extract email from decoded token

  try {
    const { db } = await connectToDatabase();

    // Query the users collection using MongoDB's findOne
    const userDetails = await db.collection("users").findOne({ email: userEmail });

    if (!userDetails) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Remove sensitive fields if necessary
    const { password, ...userData } = userDetails;

    return NextResponse.json({ user: userData }, { status: 200 });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}
