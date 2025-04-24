import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { connectToDatabase } from "../../../lib/db";
import { ObjectId } from "mongodb";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(req: NextRequest) {
  try {
    const { planId, userId } = await req.json();
    // console.log("🔹 Received planId:", planId);
    // console.log("🔹 Received userId:", userId);

    if (!planId || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== "student") {
      return NextResponse.json({ error: "Only students can subscribe"}, { status: 400 });
    }

    const priceIdArray = process.env.NEXT_PUBLIC_STRIPE_PRICE_IDS?.split(",").map(id => id.trim()) || [];
    if (!priceIdArray.includes(planId)) {
      return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: user.email,
      line_items: [{ price: planId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-status?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-status?status=cancel`,
      metadata: { userId, planId },
    });

    // console.log("✅ Checkout session created:", session.id);

    return NextResponse.json({ sessionUrl: session.url });

  } catch (error) {
    console.error("❌ Subscription error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
