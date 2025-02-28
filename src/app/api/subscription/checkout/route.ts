import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { connectToDatabase } from "../../../lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(req: NextRequest) {
  try {
    const { planId, userId } = await req.json(); // Get the selected plan and user
    //get user from db
    const { db } = await connectToDatabase();
    const user = await db.collection("users").findOne({ _id: userId });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Define your hardcoded price IDs from Stripe
    const priceIds: Record<number, string> = {
      1: "price_12345", // Replace with actual Stripe Price ID for Basic Plan
      2: "price_67890", // Replace with actual Stripe Price ID for Pro Plan
      3: "price_abcdef", // Replace with actual Stripe Price ID for Enterprise Plan
    };

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: user.email, // Use actual user email from database
      line_items: [
        {
          price: priceIds[planId],
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cancel`,
      metadata: { userId, planId }, // Store user ID for later processing
    });

    return NextResponse.json({ sessionUrl: session.url });
  } catch (error) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
