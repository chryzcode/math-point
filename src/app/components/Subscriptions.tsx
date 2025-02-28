"use client";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

// Mock data simulating Stripe's API response
const mockStripePlans = [
  {
    id: "price_1ABC",
    name: "Basic Plan",
    amount: 999, // in cents ($9.99)
    currency: "usd",
    interval: "month",
    features: ["1 class a week", "Basic Support"],
  },
  {
    id: "price_2XYZ",
    name: "Pro Plan",
    amount: 1999, // in cents ($19.99)
    currency: "usd",
    interval: "month",
    features: ["3 classes a week", "Priority Support"],
  },
  {
    id: "price_3LMN",
    name: "Enterprise Plan",
    amount: 4999, // in cents ($49.99)
    currency: "usd",
    interval: "month",
    features: ["5 classes a week", "Dedicated Support"],
  },
];

const SubscriptionCard = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { state } = useAuth();
  const { isAuthenticated } = state;
  const userId = localStorage.getItem("userId");



  const handleSubscription = async (planId: string) => {

    if (!isAuthenticated) {
      toast.error("Login to subscribe to a plan");
    }
    setLoading(true);
    setSelectedPlan(planId);

    try {
      const response = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, userId }),
      });

      const data = await response.json();
      if (data.sessionUrl) {
        window.location.href = data.sessionUrl; // Redirect to Stripe Checkout
      }
    } catch (error) {
      console.error("Subscription error:", error);
      toast.error("Subscription failed. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto py-16">
      <h2 className="text-2xl font-bold mb-6 text-center">Our Plans</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mockStripePlans.map((plan) => (
          <div key={plan.id} className="p-6 bg-white rounded-xl shadow-lg border border-gray-200">
            <h3 className="text-xl font-semibold">{plan.name}</h3>
            <p className="text-gray-600 py-4">
              ${(plan.amount / 100).toFixed(2)} / {plan.interval}
            </p>
            <ul className="mt-4 space-y-2">
              {plan.features.map((feature, index) => (
                <li key={index} className="text-gray-500 flex items-center">✅ {feature}</li>
              ))}
            </ul>
            <button
              onClick={() => handleSubscription(plan.id)}
              className="mt-10 w-full bg-primary text-white py-2 rounded-md"
              disabled={loading && selectedPlan === plan.id}
            >
              {loading && selectedPlan === plan.id ? "Processing..." : "Choose Plan"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionCard;
