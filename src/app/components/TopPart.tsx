import React from 'react';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

const HeroSection = () => {
  const { state, dispatch } = useAuth();
  const { isAuthenticated, user } = state;

  return (
    <section className="relative py-12 bg-gradient-to-b from-[#F8F9FF] to-white overflow-hidden z-0">
      <div 
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 39px, #E5E7F0 39px, #E5E7F0 40px),
                         repeating-linear-gradient(90deg, transparent, transparent 39px, #E5E7F0 39px, #E5E7F0 40px)`
        }}
      />
      
      <div className="absolute top-10 left-10 w-24 h-24 bg-blue-100 rounded-full blur-2xl opacity-40 pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-28 h-28 bg-purple-100 rounded-full blur-2xl opacity-40 pointer-events-none" />
      
      <div className="relative max-w-5xl mx-auto px-4 z-10">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="text-blue-600 w-5 h-5" />
            <span className="text-blue-600 font-semibold text-sm">Expert Mathematics Tutoring</span>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
            Math Tutoring That Improves
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {" "}Grades and Confidence
            </span>
          </h1>
          
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Transform your child's math journey with personalized, expert tutoring 
            designed to boost understanding and achievement.
          </p>
        </div>
        
        <div className="flex justify-center mt-6 md:mt-0">
          <Link
            href={user && isAuthenticated ? "/dashboard" : "/auth/register"}
            className="bg-primary rounded-lg px-6 py-4 text-white font-bold flex items-center z-20"
          >
            <p>{user && isAuthenticated ? "Go to Dashboard" : "Get Started"}</p>
            <span className="material-icons pl-1">arrow_forward</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
