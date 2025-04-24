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

    // console.log("🔹 Webhook Event Received:", event.type);

    const { db } = await connectToDatabase();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        // console.log("🔹 Checkout Session Data:", session);

        const userId = session.metadata?.userId;
        const subscriptionId = session.subscription as string;

        if (!userId || !subscriptionId) {
          console.error("❌ Missing userId or subscriptionId in session.");
          return NextResponse.json({ error: "Invalid metadata" }, { status: 400 });
        }

        // console.log(`✅ Checkout completed for user ${userId}, subscription ID: ${subscriptionId}`);

        // Retrieve subscription details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        // console.log("🔹 Subscription Data:", subscription);

        const priceId = subscription.items.data[0]?.price.id;
        if (!priceId) {
          console.error("❌ No price ID found in subscription.");
          return NextResponse.json({ error: "Invalid subscription data" }, { status: 400 });
        }

        const price = await stripe.prices.retrieve(priceId);
        const product = await stripe.products.retrieve(price.product as string);
        const planName = product.name;

        // console.log(`🔹 Plan Name: ${planName}`);

        const classLimits: Record<string, number> = {
          "Basic Plan": 1,
          "Pro Plan": 3,
          "Advanced Plan": 5,
        };

        const weeklyClassLimit = classLimits[planName] ?? 0;
        const userObjectId = new ObjectId(userId);

        // console.log(`🔎 Checking if user exists in DB: ${userId}`);
        const userExists = await db.collection("users").findOne({ _id: userObjectId });

        if (!userExists) {
          console.error(`❌ User with ID ${userId} not found.`);
          return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // console.log("🔄 Updating user subscription in database...");
        const updateResult = await db.collection("users").updateOne(
          { _id: userObjectId },
          {
            $set: {
              subscriptionPlan: planName,
              weeklyClassLimit,
              stripeCustomerId: subscription.customer,
              stripeSubscriptionId: subscriptionId,
            },
          }
        );

        if (updateResult.modifiedCount === 1) {
          // console.log("✅ Subscription updated successfully in database.");
        } else {
          console.warn("⚠️ Subscription update may not have modified any document.");
        }

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        // console.log("🔹 Payment Failed Invoice:", invoice);

        const subscriptionId = invoice.subscription as string;
        if (!subscriptionId) {
          console.warn("❌ Missing subscriptionId in failed invoice.");
          break;
        }

        // console.log(`🔎 Searching for user with subscription ID: ${subscriptionId}`);
        const user = await db.collection("users").findOne({ stripeSubscriptionId: subscriptionId });

        if (!user) {
          console.warn(`❌ No user found for subscription ${subscriptionId}`);
          break;
        }

        // console.log(`🔄 Downgrading subscription for user ${user._id}...`);
        const downgradeResult = await db.collection("users").updateOne(
          { _id: user._id },
          {
            $set: {
              subscriptionPlan: "Free Plan",
              weeklyClassLimit: 0,
            },
          }
        );

        if (downgradeResult.modifiedCount === 1) {
          // console.log(`✅ User ${user._id} downgraded to Free Plan.`);
        } else {
          console.warn(`⚠️ No document modified while downgrading user ${user._id}.`);
        }

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        // console.log("🔹 Subscription Canceled:", subscription);

        const subscriptionId = subscription.id;
        // console.log(`🔎 Searching for user with subscription ID: ${subscriptionId}`);
        const user = await db.collection("users").findOne({ stripeSubscriptionId: subscriptionId });

        if (!user) {
          console.warn(`❌ No user found for subscription ${subscriptionId}`);
          break;
        }

        // console.log(`🔄 Cancelling subscription for user ${user._id}...`);
        const cancelResult = await db.collection("users").updateOne(
          { _id: user._id },
          {
            $set: {
              subscriptionPlan: "Free Plan",
              weeklyClassLimit: 0,
            },
          }
        );

        if (cancelResult.modifiedCount === 1) {
          // console.log(`✅ Subscription canceled for user ${user._id}.`);
        } else {
          console.warn(`⚠️ No document modified while canceling user ${user._id}.`);
        }

        break;
      }

      default:
        // console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("🚨 Webhook Error:", error);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }
}
