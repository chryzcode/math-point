"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const PaymentStatusPage = () => {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const status = searchParams.get("status"); // 'success' or 'cancel'
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Processing your payment...");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (status === "cancel") {
      setMessage("Your payment was canceled. You can try again anytime.");
      setLoading(false);
      setIsSuccess(false);
      return;
    }

    if (!sessionId) {
      setMessage("Invalid session. Please contact support.");
      setLoading(false);
      setIsSuccess(false);
      return;
    }

    // Verify payment using our backend API
    const verifySubscription = async () => {
      try {
        const response = await fetch(`/api/subscription/verify-subscription?session_id=${sessionId}`);
        const data = await response.json();

        if (response.ok && data.payment_status === "paid") {
          setMessage("🎉 Thank you for subscribing! Your plan is now active.");
          setIsSuccess(true);
        } else {
          setMessage("We couldn't confirm your subscription. Please contact support.");
          setIsSuccess(false);
        }
      } catch (error) {
        setMessage("An error occurred. Please try again.");
        setIsSuccess(false);
      }
      setLoading(false);
    };

    verifySubscription();
  }, [sessionId, status]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center">
      <h2 className={`text-3xl font-bold mb-4 ${loading ? "text-gray-500" : isSuccess ? "text-green-600" : "text-red-600"}`}>
        {loading ? "Loading..." : isSuccess ? "🎉 Success!" : "❌ Payment Failed"}
      </h2>
      <p className="text-lg text-gray-700">{message}</p>
      <button 
        onClick={() => router.push(isSuccess ? "/dashboard" : "/")}
        className="mt-6 bg-primary text-white px-6 py-2 rounded-md"
      >
        {isSuccess ? "Go to Dashboard" : "Try Again"}
      </button>
    </div>
  );
};

export default PaymentStatusPage;
