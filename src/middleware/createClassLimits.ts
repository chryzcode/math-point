import cron from "node-cron";
import { connectToDatabase } from "../app/lib/db";

type SubscriptionPlan = "Basic Plan" | "Pro Plan" | "Advanced Plan";

const classLimits: Record<SubscriptionPlan, number> = {
  "Basic Plan": 1,
  "Pro Plan": 3,
  "Advanced Plan": 5,
};

export function startWeeklyResetJob() {
  cron.schedule("0 0 * * 1", async () => {
    // console.log("🔄 Resetting class limits for all users...");

    try {
      const { db } = await connectToDatabase();

      // Iterate through all plan types and update in batches
      for (const [plan, limit] of Object.entries(classLimits)) {
        const result = await db.collection("users").updateMany(
          { subscriptionPlan: plan },
          { $set: { weeklyClassLimit: limit } }
        );

        // console.log(`✅ Updated ${result.modifiedCount} users with plan "${plan}".`);
      }

      // console.log("🎉 Weekly class limits reset successfully.");
    } catch (error) {
      console.error("🚨 Error resetting weekly class limits:", error);
    }
  });
}
