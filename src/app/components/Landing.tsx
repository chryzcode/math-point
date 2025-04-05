"use client"

import React from "react";
import { FaCheckCircle, FaClock, FaUserAlt, FaChartLine } from "react-icons/fa";
import TestimonialsSection from "./Testimonial";
import HeroSection from "./TopPart";
import SubscriptionCard from "./Subscriptions";
import { tutors } from "../const/tutor";
import TutorCard from "./TutorCard";

function MathTutorScreen() {
  const benefits = [
    {
      title: "Personalized Learning",
      description: "One-on-one attention tailored to your child's unique learning style and pace",
      icon: <FaUserAlt className="text-4xl text-blue-600" />
    },
    {
      title: "Proven Experience",
      description: "9+ years of teaching experience with proven success in improving grades",
      icon: <FaChartLine className="text-4xl text-blue-600" />
    },
    {
      title: "Flexible Scheduling",
      description: "Convenient online sessions that fit your family's busy schedule",
      icon: <FaClock className="text-4xl text-blue-600" />
    },
    {
      title: "Regular Progress Updates",
      description: "Detailed feedback and progress reports after each session",
      icon: <FaCheckCircle className="text-4xl text-blue-600" />
    }
  ];

  const BackgroundPattern = () => (
    <svg 
      className="absolute inset-0 w-full h-full opacity-10 pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ zIndex: 0 }}
    >
      <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="10" cy="10" r="2" fill="currentColor" />
      </pattern>
      <rect width="100%" height="100%" fill="url(#dots)" fillOpacity="0.3" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-background text-text font-sans">
      {/* Hero Section */}
      <HeroSection />

      {/* Tutors Section */}
      <section className="relative py-10 bg-slate-50 text-slate-800 overflow-hidden">
        <BackgroundPattern />
        <div className="relative max-w-7xl mx-auto px-4 z-10">
          <h2 className="text-4xl font-bold mb-12 text-center">
            Meet Our Expert Math Tutors
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {tutors.map((tutor, index) => (
              <TutorCard key={index} tutor={tutor} />
            ))}
          </div>
        </div>
        <div className="text-center mt-16 text-gray-700 relative z-20">
          <p className="text-3xl font-bold">
            Want to join our team of expert tutors?{" "}
          </p>
          <a
            href="mailto:test@gmail.com"
            className="text-primary font-semibold transition duration-200 my-5 text-xl inline-flex items-center justify-center"
            target="_blank"
            rel="noopener noreferrer"
          >
            <p>Send us a mail</p>
            <span className="material-icons pl-1">arrow_forward</span>
          </a>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-10 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-gray-800 mb-12 text-center">
            Why Choose Our Math Tutoring?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div 
                key={index} 
                className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition duration-300 ease-in-out transform hover:-translate-y-1 z-10"
              >
                <div className="flex justify-center mb-6">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-semibold text-center mb-4">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 text-center">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-12 shadow-lg z-10">
            <h2 className="text-4xl font-bold text-gray-800 mb-8 text-center">
              What We Offer
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <ul className="space-y-4">
                <li className="flex items-center gap-4">
                  <span className="w-3 h-3 bg-blue-600 rounded-full"></span>
                  <span className="text-lg text-gray-700">Pre-K to university math tutoring</span>
                </li>
                <li className="flex items-center gap-4">
                  <span className="w-3 h-3 bg-blue-600 rounded-full"></span>
                  <span className="text-lg text-gray-700">Common Core curriculum alignment</span>
                </li>
              </ul>
              <ul className="space-y-4">
                <li className="flex items-center gap-4">
                  <span className="w-3 h-3 bg-blue-600 rounded-full"></span>
                  <span className="text-lg text-gray-700">Homework help and exam preparation</span>
                </li>
                <li className="flex items-center gap-4">
                  <span className="w-3 h-3 bg-blue-600 rounded-full"></span>
                  <span className="text-lg text-gray-700">Interactive online learning tools</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Subscription Section */}
      <SubscriptionCard />
    </div>
  );
}

export default MathTutorScreen;