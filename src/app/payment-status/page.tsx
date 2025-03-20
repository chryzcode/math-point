"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

const PaymentStatusPage = () => {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const status = searchParams.get("status"); // 'success' or 'cancel'
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Processing your payment...");

  useEffect(() => {
    if (status === "cancel") {
      setMessage("Your payment was canceled. You can try again anytime.");
      setLoading(false);
      return;
    }

    if (!sessionId) {
      setMessage("Invalid session. Please contact support.");
      setLoading(false);
      return;
    }

    // Verify successful payment using Stripe API
    const verifySubscription = async () => {
      try {
        const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY}`, // Use the public key
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (data.payment_status === "paid") {
          setMessage("Thank you for subscribing! Your plan is now active.");
        } else {
          setMessage("We couldn't confirm your subscription. Please contact support.");
        }
      } catch (error) {
        setMessage("An error occurred. Please try again.");
      }
      setLoading(false);
    };

    verifySubscription();
  }, [sessionId, status]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center">
      <h2 className={`text-3xl font-bold mb-4 ${status === "cancel" ? "text-red-600" : "text-green-600"}`}>
        {loading ? "Loading..." : status === "cancel" ? "Payment Canceled" : "🎉 Success!"}
      </h2>
      <p className="text-lg text-gray-700">{message}</p>
      <button 
        onClick={() => router.push("/")}
        className="mt-6 bg-primary text-white px-6 py-2 rounded-md"
      >
        {status === "cancel" ? "Try Again" : "Go to Dashboard"}
      </button>
    </div>
  );
};

export default PaymentStatusPage;
