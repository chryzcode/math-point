"use client";

import React, { useState, useEffect } from "react";
import { useGetAuthUser } from "../lib/useGetAuthUser";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const calendlyURL = process.env.NEXT_PUBLIC_CALENDLY_URL as string;

const BookingForm = () => {
  const [formStep, setFormStep] = useState(1); // 1: Form, 2: Calendly, 3: Confirmation
  const [formData, setFormData] = useState({
    parentName: "",
    studentName: "",
    email: "",
    phone: "",
    grade: "",
    concerns: "",
  });
  const [scheduledTime, setScheduledTime] = useState<string | null>(null); // To store scheduled time from Calendly
  const { authUser } = useGetAuthUser();
  const router = useRouter();
  const token = localStorage.getItem("token") || "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authUser) {
      // Redirect if authUser is null or undefined
      router.push("/dashboard");
    } else if (authUser.freeClassSessions === 0 && authUser.weeklyClassLimit === 0) {
      // Show error and redirect if both are 0
      toast.error("You have no free classes or have reached your weekly limit.");
      router.push("/dashboard");
    }
  }, [authUser]);

  const grades = [
    "Pre-K",
    "K",
    "1st",
    "2nd",
    "3rd",
    "4th",
    "5th",
    "6th",
    "7th",
    "8th",
    "9th",
    "10th",
    "11th",
    "12th",
    "College Freshman",
    "College Sophomore",
    "College Junior",
    "College Senior",
  ];

  const validateForm = () => {
    if (!formData.parentName || !formData.studentName || !formData.email || !formData.phone || !formData.grade) {
      setError("Please fill in all required fields");
      return false;
    }
    if (!formData.email.includes("@")) {
      setError("Please enter a valid email address");
      return false;
    }
    return true;
  };

  const fetchEventDetails = async (eventUri: string) => {
    try {
      const response = await fetch(eventUri, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_CALENDLY_API_KEY}`,
        },
      });
  
      if (!response.ok) {
        throw new Error("Failed to fetch Calendly event details");
      }
  
      const eventData = await response.json();
      console.log("Calendly Full Event Data:", eventData);
  
      const scheduledTime = eventData.resource?.start_time;
  
      return { scheduledTime };
    } catch (error) {
      console.error("Error fetching Calendly event details:", error);
      return null;
    }
  };
  

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Move to Calendly step after validation
    setFormStep(2);
  };

  useEffect(() => {
    if (formStep === 2) {
      const script = document.createElement("script");
      script.src = "https://assets.calendly.com/assets/external/widget.js";
      script.type = "text/javascript";
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        console.log("Calendly widget loaded");
      };

      return () => {
        document.body.removeChild(script);
      };
    }
  }, [formStep]); // Only run when formStep changes to 2

  useEffect(() => {
    const handleEvent = async (e: MessageEvent) => {
      console.log("Received message event:", e.data);
  
      if (e.data?.event === "calendly.event_scheduled") {
        const eventDetails = e.data.payload;
        console.log("Calendly Event Payload:", eventDetails);
  
        if (!eventDetails || !eventDetails.event?.uri) {
          console.error("Invalid event data received from Calendly", eventDetails);
          return;
        }
  
        // Fetch event details to get Zoom link and scheduled time
        const eventData = await fetchEventDetails(eventDetails.event.uri);
  
        // Ensure eventData exists before accessing properties
        if (!eventData) {
          console.error("Failed to fetch event details from Calendly");
          return;
        }
  
        const { scheduledTime } = eventData;
  
        if (!scheduledTime) {
          console.error("Missing start time from Calendly event");
          return;
        }
  
        console.log("Scheduled Time:", scheduledTime);
  
        setLoading(true);
  
        // Send to backend for booking
        const bookingResponse = await fetch("/api/bookings/book-class", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...formData,
            preferredTime: scheduledTime,
          }),
        });
  
        const bookingData = await bookingResponse.json();
  
        if (!bookingResponse.ok) {
          throw new Error(bookingData.message || "Failed to book the class.");
        }
  
        setFormStep(3); // Move to confirmation step
      }
    };
  
    window.addEventListener("message", handleEvent);
    return () => window.removeEventListener("message", handleEvent);
  }, [formData, token]);
  

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="w-full bg-gray-100 h-2">
        <div
          className="bg-primary h-full transition-all duration-300"
          style={{ width: `${(formStep / 3) * 100}%` }}
        ></div>
      </div>

      <div className="p-8">
        {formStep === 1 && (
          <>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800">Book Your Free Demo Session</h2>
              <p className="text-gray-600 mt-2">
                Fill out the form below to schedule your personalized demo class.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Parent Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent's Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  />
                </div>

                {/* Student Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student's Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              {/* Grade */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student's Grade *</label>
                <select
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                >
                  <option value="">Select Grade</option>
                  {grades.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
              </div>

              {/* Concerns */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Any specific concerns or topics to focus on?
                </label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  value={formData.concerns}
                  onChange={(e) => setFormData({ ...formData, concerns: e.target.value })}
                />
              </div>

              {error && <div className="text-red-500 text-sm">{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-3 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300"
              >
                {loading ? "Submitting..." : "Continue to Schedule"}
              </button>
            </form>
          </>
        )}

        {formStep === 2 && (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Schedule Your Session</h2>
            <div
              className="calendly-inline-widget"
              data-url={calendlyURL}
              style={{ minWidth: "320px", height: "600px" }}
            ></div>
          </div>
        )}

        {formStep === 3 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Booking Confirmed!</h2>
            <p className="text-gray-600">
              We've sent you an email with all the details.
              <br />
              Looking forward to meeting you!

              <br/> <br/>
              <a href="/dashboard" className="text-primary">Back to dashboard</a>
            </p>

          </div>
        )}
      </div>
    </div>
  );
};

export default BookingForm;