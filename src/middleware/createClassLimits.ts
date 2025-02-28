import cron from "node-cron";
import { connectToDatabase } from "../app/lib/db";

type SubscriptionPlan = "Free" | "Premium" | "Enterprise";

const classLimits: Record<SubscriptionPlan, number> = {
  Free: 1,
  Premium: 3,
  Enterprise: 5,
};


export function startWeeklyResetJob() {
  cron.schedule("0 0 * * 1", async () => {
    console.log("🔄 Resetting class limits for all users...");

    const { db } = await connectToDatabase();
    const users = await db.collection("users").find({}).toArray();

    for (const user of users) {
        const plan = user.subscriptionPlan as SubscriptionPlan;
        const limit = classLimits[plan] || 0;

      await db.collection("users").updateOne(
        { _id: user._id },
        { $set: { weeklyClassLimit: limit } }
      );
    }

    console.log("✅ Weekly class limits reset successfully.");
  });
}
