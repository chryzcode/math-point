import React from "react";
import { testimonials } from "../const/testimonial";

function TestimonialsSection() {
  return (
    <section className="bg-[#FDF4EE] py-16 px-6">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-gray-800">
          Testimonials from my students
        </h2>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-lg shadow-md border border-gray-200 h-full flex flex-col"
            >
              {/* Quote Image */}
              <div className="flex justify-start text-primary">
                <img src="/qoute.png" alt="Quote" className="w-8 h-8 mr-2" />
              </div>

              {/* Testimonial Content */}
              <p className="mt-4 text-gray-700 font-serif italic flex-grow">
                {testimonial.quote}
              </p>

              {/* Author & Class (Always at the Bottom) */}
              <div className="mt-4">
                <p className="text-gray-800 font-semibold">{testimonial.author}</p>
                <p className="text-gray-600">{testimonial.class}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TestimonialsSection;
