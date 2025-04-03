import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import authenticate from "@/middleware/authentication";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticate(req);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { db } = await connectToDatabase();
    const instructors = await db.collection("users")
      .find({ role: "instructor" })
      .project({ name: 1, email: 1, _id: 1 })
      .toArray();

    return NextResponse.json(instructors, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch instructors" }, { status: 500 });
  }
}
