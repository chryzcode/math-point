"use client";

import { useState, useEffect } from "react";
import { useGetAuthUser } from "../lib/useGetAuthUser";
import withAuth from "../context/withAuth";

interface ClassData {
  pastClasses: any[];
  upcomingClasses: any[];
  totalClasses: number;
  remainingClasses: number;
  freeSessions: number;
}

const Dashboard = () => {
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { authUser } = useGetAuthUser();

  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token"); // Get token from localStorage
        if (!token) throw new Error("Unauthorized - No token found");

        const res = await fetch("/api/bookings", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          if (res.status === 401) throw new Error("Unauthorized - Invalid token");
          throw new Error("Failed to fetch classes");
        }

        const data: ClassData = await res.json();
        setClassData(data);
      } catch (err: any) {
        setError(err.message || "Failed to load classes");
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  if (loading) return <p className="text-center text-white">Loading...</p>;
  if (error) return <p className="text-red-500 text-center">{error}</p>;


  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-extrabold my-8">Welcome, <span className="text-primary">{authUser.name}</span>👋!</h1>
      <p className="text-xl">You're on <span className="text-primary font-semibold">{authUser.subscriptionPlan}</span></p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        <div className="bg-blue-600 text-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold">Total Classes</h2>
          <p className="text-4xl font-extrabold">{classData?.totalClasses ?? 0}</p>
        </div>

        <div className="bg-green-600 text-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold">Remaining Classes</h2>
          <p className="text-4xl font-extrabold">{classData?.remainingClasses ?? 0}</p>
        </div>

        <div className="bg-yellow-600 text-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold">Free Sessions</h2>
          <p className="text-4xl font-extrabold">{classData?.freeSessions ?? 0}</p>
        </div>
      </div>

      <h2 className="text-3xl font-bold text-gray-800 mt-8">Upcoming Classes</h2>
      <div className="mt-4 space-y-4">
        {(classData?.upcomingClasses ?? []).length > 0 ? (
          (classData?.upcomingClasses ?? []).map((cls, index) => (
            <div key={index} className="p-4 bg-white rounded-md shadow-md">
              <p className="text-lg font-semibold pb-4">{cls.studentName}</p>
              <p className="text-gray-600">{new Date(cls.preferredTime).toLocaleString()}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No upcoming classes.</p>
        )}
      </div>

      <h2 className="text-3xl font-bold text-gray-800 mt-8">Past Classes</h2>
      <div className="mt-4 space-y-4">
        {(classData?.pastClasses ?? []).length > 0 ? (
          (classData?.pastClasses ?? []).map((cls, index) => (
            <div key={index} className="p-4 bg-gray-200 rounded-md shadow-md">
              <p className="text-lg font-semibold">{cls.studentName}</p>
              <p className="text-gray-600">{new Date(cls.preferredTime).toLocaleString()}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No past classes.</p>
        )}
      </div>
    </div>
  );
};

export default withAuth(Dashboard);
