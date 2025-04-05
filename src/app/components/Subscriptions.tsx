"use client";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { useGetAuthUser } from "../lib/useGetAuthUser";

const SubscriptionCard = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { state } = useAuth();
  const { isAuthenticated } = state;
  const { authUser } = useGetAuthUser();


  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch("/api/subscription/plans");
        const data = await response.json();
        if (response.ok) {
          setPlans(data);
        } else {
          throw new Error(data.error || "Failed to fetch plans");
        }
      } catch (error) {
        toast.error("Failed to load subscription plans.");
      }
    };

    fetchPlans();
  }, []);

  const handleSubscription = async (planId: string) => {
    if (!isAuthenticated) {
      return toast.error("Login to subscribe to a plan");
    }
  
    if (!authUser || !authUser._id) {
      return toast.error("User data is not available. Please try again.");
    }
  
    setLoading(true);
    setSelectedPlan(planId);
  
    try {
      const response = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, userId: authUser._id }),
      });
  
      const data = await response.json();
  
      if (response.ok && data.sessionUrl) {
        window.location.href = data.sessionUrl; // Redirect to Stripe checkout
      } else {
        toast.error(data.error || "Subscription failed. Please try again.");
      }
    } catch (error) {
      console.error("Subscription error:", error);
      toast.error("Subscription failed. Please try again.");
    }
  
    setLoading(false);
  };
  
  

  return (
    <div className="max-w-7xl mx-auto py-16" id="subscriptions">
      <h2 className="text-2xl font-bold mb-6 text-center">Our Plans</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.length > 0 ? (
          plans.map((plan) => (
            <div key={plan.id} className="flex flex-col h-full p-6 bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="flex-grow">
                <h3 className="text-xl font-semibold">{plan.name}</h3>
                <p className="text-gray-600 py-4">
                  ${(plan.amount / 100).toFixed(2)} / {plan.interval}
                </p>
                <ul className="mt-4 space-y-2">
                  {plan.features.length > 0 ? (
                    plan.features.map((feature: string, index: number) => (
                      <li key={index} className="text-gray-500 flex items-center">✅ {feature}</li>
                    ))
                  ) : (
                    <li className="text-gray-500">No listed features</li>
                  )}
                </ul>
              </div>
              <button
                onClick={() => handleSubscription(plan.id)}
                className="mt-6 w-full bg-primary text-white py-2 rounded-md"
                disabled={loading && selectedPlan === plan.id}
              >
                {loading && selectedPlan === plan.id ? "Processing..." : "Choose Plan"}
              </button>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">Loading plans...</p>
        )}
      </div>
    </div>
  );
};

export default SubscriptionCard;
