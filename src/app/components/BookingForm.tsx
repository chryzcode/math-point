// BookingForm.jsx
"use client";

import React, { useState,useEffect } from 'react';
import emailjs from 'emailjs-com';

import {createZoomMeeting} from '../lib/createZoomMeeting';
import { useGetAuthUser } from "../lib/useGetAuthUser";
import { toast } from "react-toastify";
import { useRouter } from 'next/navigation';




//get the serviceId, templateId, userId from .env file

const serviceId= process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID as string;
const templateId= process.env.NEXT_PUBLIC_EMAILJS_BOOKING_SESSION_TEMPLATE_ID as string;
const publicKey= process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY as string;
const calendlyURL= process.env.NEXT_PUBLIC_CALENDLY_URL as string;


const BookingForm = () => {
  const [formStep, setFormStep] = useState(1); // 1: Form, 2: Calendly, 3: Confirmation
  const [formData, setFormData] = useState({
    parentName: '',
    studentName: '',
    email: '',
    phone: '',
    grade: '',
    concerns: '',
    preferredTime: ''
  });

  const { authUser } = useGetAuthUser();
  const router = useRouter();

  useEffect(() => {
    if (formStep === 2) {
      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.type = 'text/javascript';
      script.async = true;
      document.body.appendChild(script);
  
      script.onload = () => {
        console.log('Calendly widget loaded');
      };
  
      return () => {
        document.body.removeChild(script);
      };
    }
  }, [formStep]);  // Only run when formStep changes to 2
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
  if (!authUser) {
    // Redirect if authUser is null or undefined
    router.push('/dashboard');
  } else if (authUser.freeClassSessions === 0 && authUser.weeklyClassLimit === 0) {
    // Show error and redirect if both are 0
    toast.error('You have no free classes or have reached your weekly limit.');
    router.push('/dashboard');
  }
}, [authUser]);



  const grades = [
    'Pre-K', 'K', '1st', '2nd', '3rd', '4th', '5th', '6th', 
    '7th', '8th', '9th', '10th', '11th', '12th', 'College Freshman', 
    'College Sophomore', 'College Junior', 'College Senior'
  ];

  const validateForm = () => {
    if (!formData.parentName || !formData.studentName || !formData.email || !formData.phone || !formData.grade) {
      setError('Please fill in all required fields');
      return false;
    }
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;
  
    setLoading(true);
    setError('');
  
    try {
        console.log(formData);
        const zoomLink = await createZoomMeeting();


      // Send email using EmailJS
      
    const emailData = {
      ...formData,
      zoomLink, // Attach the Zoom link to the email
    };
// Send email using EmailJS
    const result = await emailjs.send(serviceId, templateId, emailData, publicKey)
     
      if (result.status === 200) {
        // Move to Calendly step
        setFormStep(2);
      } else {
        throw new Error('Failed to submit form');
      }
    } catch (err) {
        console.log(err);
      setError('Failed to submit form. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  const moveToNextStep = () => {
    setFormStep(3); // Move to next step when the user clicks "Next Step"
  };

  const handleFinalSubmit = async ({ token }: { token: string }) => {
    setLoading(true);
    setError('');
  
    try {
      const response = await fetch('/api/bookings/book-class', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit form');
      }
  
      setFormStep(3); // Move to confirmation step
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to submit form. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  

  useEffect(() => {
    const handleEvent = (e: MessageEvent) => {
      if (e.data?.event === "calendly.event_scheduled") {
        const token = localStorage.getItem("token") || ""; // Ensure it's always a string
        handleFinalSubmit({ token }); // Submit form after successful booking
      }
    };
    
    window.addEventListener("message", handleEvent);
    return () => window.removeEventListener("message", handleEvent);
  }, []);
  

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
              <p className="text-gray-600 mt-2">Fill out the form below to schedule your personalized demo class</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Parent Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parent's Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.parentName}
                    onChange={(e) => setFormData({...formData, parentName: e.target.value})}
                  />
                </div>
    
    
                {/* Student Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Student's Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.studentName}
                    onChange={(e) => setFormData({...formData, studentName: e.target.value})}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>

              {/* Grade */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student's Grade *
                </label>
                <select
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  value={formData.grade}
                  onChange={(e) => setFormData({...formData, grade: e.target.value})}
                >
                  <option value="">Select Grade</option>
                  {grades.map((grade) => (
                    <option key={grade} value={grade}>{grade}</option>
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
                  rows={3} // ✅ Change from "3" to {3}
                  value={formData.concerns}
                  onChange={(e) => setFormData({...formData, concerns: e.target.value})}
                />

              </div>

              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-3 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300"
              >
                {loading ? 'Submitting...' : 'Continue to Schedule'}
              </button>
            </form>
          </>
        )}

        {formStep === 2 && (
           <div className="text-center">
           <h2 className="text-2xl font-bold text-gray-800 mb-6">Schedule Your Session</h2>
           {/* Calendly inline widget */}
           <div
              className="calendly-inline-widget"
              data-url={calendlyURL}
              style={{ minWidth: '320px', height: '600px' }}
            ></div>
             <button
            onClick={moveToNextStep}
            className="mt-4 px-4 py-2 bg-primary  text-white rounded-md hover:bg-blue-700 transition-colors"
          >
             Next 
          </button>
         </div>
        )}

        {formStep === 3 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Booking Confirmed!</h2>
            <p className="text-gray-600">
              We've sent you an email with all the details.<br />
              Looking forward to meeting you!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingForm;
