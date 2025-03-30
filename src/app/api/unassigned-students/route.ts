import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import authenticate from "@/middleware/authentication";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticate(req);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { db } = await connectToDatabase();
    
    // First verify the collection exists
    const collections = await db.listCollections().toArray();
    const usersCollection = collections.find(col => col.name === 'users');
    
    if (!usersCollection) {
      console.error('Users collection not found');
      return NextResponse.json({ message: "Database configuration error" }, { status: 500 });
    }

    const unassignedStudents = await db.collection("users")
      .find({ 
        role: "student",
        verified: true,
        $or: [
          { instructorId: null },
          { instructorId: "" },
          { instructorId: { $exists: false } }
        ]
      })
      .project({ _id: 1, name: 1 })
      .toArray();

    return NextResponse.json(unassignedStudents, { status: 200 });
  } catch (error: any) {
    console.error('Error in unassigned-students route:', error);
    return NextResponse.json({ 
      message: "Failed to fetch unassigned students",
      error: error.message 
    }, { status: 500 });
  }
}
