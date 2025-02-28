import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import authenticate from "@/middleware/authentication";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";

export async function PUT(req: NextRequest) {
  const user = await authenticate(req);
  if (user instanceof NextResponse) return user; // Stop if authentication fails

  const userId = (user as any).userId || (user as any)._id; // Ensure correct user ID extraction
  const userData = await req.json();

  // Ensure userId is a valid ObjectId
  if (!userId || typeof userId !== "string" || !ObjectId.isValid(userId)) {
    return NextResponse.json({ error: "Invalid User ID" }, { status: 400 });
  }

  if (!userData || Object.keys(userData).length === 0) {
    return NextResponse.json({ error: "No data provided for update" }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection("users");

    // Prevent updating sensitive fields
    delete userData.id;
    delete userData.email;

    // If password is updated, hash it securely
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }

    // Update the user document
    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: userData },
      { returnDocument: "after" } // Ensure updated document is returned
    );

    if (!result?.value) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "User updated successfully", user: result.value },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
