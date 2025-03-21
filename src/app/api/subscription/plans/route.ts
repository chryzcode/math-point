import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function GET() {
  try {
    const priceIds = process.env.NEXT_PUBLIC_STRIPE_PRICE_IDS?.split(",") || [];
    if (priceIds.length === 0) {
      return NextResponse.json({ error: "No price IDs found in environment variables." }, { status: 400 });
    }

    // Fetch plan details from Stripe
    const prices = await Promise.all(
      priceIds.map(async (priceId) => {
        const price = await stripe.prices.retrieve(priceId.trim(), { expand: ["product"] });

        return {
          id: price.id,
          name: (price.product as Stripe.Product).name,
          description: (price.product as Stripe.Product).description || "",
          amount: price.unit_amount || 0,
          interval: price.recurring?.interval || "month",
          features: (price.product as Stripe.Product).metadata.features
            ? (price.product as Stripe.Product).metadata.features.split(",")
            : [],
        };
      })
    );

    return NextResponse.json(prices, { status: 200 });
  } catch (error) {
    console.error("Error fetching plans:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
