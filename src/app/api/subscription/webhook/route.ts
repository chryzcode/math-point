import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { connectToDatabase } from "../../../lib/db";
import { ObjectId } from "mongodb";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const sig = req.headers.get("stripe-signature") as string;

  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );

    const { db } = await connectToDatabase();

    // Handle subscription success
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      const planName = session.metadata?.planName;

      if (!userId || !planName) {
        return NextResponse.json({ error: "Invalid metadata" }, { status: 400 });
      }

      console.log(`User ${userId} subscribed to the ${planName} plan`);

      const userObjectId = new ObjectId(userId);

      // Define class limits based on the subscription plan
      const classLimits: any = {
        Free: 1,
        Premium: 3,
        Unlimited: 5,
      };

      const weeklyClassLimit = classLimits[planName] ?? 0;

      // Update user's subscription info
      await db.collection("users").updateOne(
        { _id: userObjectId },
        {
          $set: {
            subscriptionPlan: planName,
            subscriptionActive: true,
            weeklyClassLimit,
          },
        }
      );
    }

    // Handle subscription failure (e.g., payment failed)
    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object;
      const userId = invoice.metadata?.userId;

      if (userId) {
        const userObjectId = new ObjectId(userId);

        await db.collection("users").updateOne(
          { _id: userObjectId },
          {
            $set: {
              subscriptionPlan: null,
              subscriptionActive: false,
              weeklyClassLimit: 0,
            },
          }
        );

        console.log(`Payment failed for user ${userId}, subscription deactivated.`);
      }
    }

    // Handle subscription expiration or cancellation
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      const userId = subscription.metadata?.userId;

      if (userId) {
        const userObjectId = new ObjectId(userId);

        await db.collection("users").updateOne(
          { _id: userObjectId },
          {
            $set: {
              subscriptionPlan: null,
              subscriptionActive: false,
              weeklyClassLimit: 0,
            },
          }
        );

        console.log(`Subscription expired or canceled for user ${userId}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }
}
