import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import authenticate from "@/middleware/authentication";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  try {
    const user = await authenticate(req);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { studentId, instructorId } = await req.json();
    if (!studentId || !instructorId) {
      return NextResponse.json({ message: "Student and instructor are required" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    
    // First verify both student and instructor exist
    const student = await db.collection("users").findOne({ 
      _id: new ObjectId(studentId),
      role: "student",
      verified: true
    });
    
    if (!student) {
      return NextResponse.json({ message: "Student not found or not verified" }, { status: 404 });
    }

    const instructor = await db.collection("users").findOne({ 
      _id: new ObjectId(instructorId),
      role: "instructor"
    });
    
    if (!instructor) {
      return NextResponse.json({ message: "Instructor not found" }, { status: 404 });
    }

    // Update the student with the instructor ID
    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(studentId) },
      { $set: { instructorId: new ObjectId(instructorId) } }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ message: "Failed to assign student" }, { status: 500 });
    }

    return NextResponse.json({ message: "Student assigned successfully" }, { status: 200 });
  } catch (error: any) {
    console.error('Error in assign-student route:', error);
    return NextResponse.json({ 
      message: "Failed to assign student",
      error: error.message 
    }, { status: 500 });
  }
}
