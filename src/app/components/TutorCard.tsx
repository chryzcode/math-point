import React from "react";
import Image from "next/image";
import { Tutor } from "../const/tutor";

export function TutorCard({ tutor }: { tutor: Tutor }) {
  return (
    <div className="max-w-sm mx-auto p-6 bg-white rounded-lg shadow-md border border-gray-200">
      {/* Profile Image */}
      <div className="flex justify-center mt-4">
        <div className="w-28 h-28 relative">
          <Image
            src={tutor.imagePath}
            alt="Tutor"
            fill
            className="rounded-full border-4 border-background shadow-md object-cover"
          />
        </div>
      </div>

      {/* Tutor Info */}
      <div className="text-center mt-4">
        <h2 className="text-xl font-semibold text-gray-800">{tutor.name}</h2>
        <p className="text-gray-600 mt-1">
          <span className="font-semibold">Experience:</span> {tutor.experience}
        </p>
        <p className="text-gray-600">
          <span className="font-semibold">Grades:</span> {tutor.grades}
        </p>
      </div>

      {/* Bio */}
      <div className="mt-6 text-gray-700 text-sm">
        <p>{tutor.bio}</p>
        <blockquote className="italic text-gray-500 mt-2">
          {tutor.quote}
        </blockquote>
      </div>
    </div>
  );
}

export default TutorCard;
