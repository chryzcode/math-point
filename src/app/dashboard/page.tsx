"use client";

import { useState, useEffect } from "react";
import { useGetAuthUser } from "../lib/useGetAuthUser";
import withAuth from "../context/withAuth";
import Link from "next/link";
import AssignStudents from "../components/AssignStudents";

interface ClassData {
  pastClasses: any[];
  upcomingClasses: any[];
  totalClasses: number;
  remainingClasses: number;
  freeSessions?: number;
  totalStudents?: number;
}

const Dashboard = () => {
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const { authUser } = useGetAuthUser();

  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Unauthorized - No token found");

        const endpoint =
          authUser.role === "instructor"
            ? `/api/bookings/instructor?page=${page}`
            : authUser.role === "admin"
            ? `/api/bookings/admin?page=${page}`
            : `/api/bookings?page=${page}`;

        const res = await fetch(endpoint, {
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
  }, [authUser.role, page]);

  if (loading) return <p className="text-center text-white">Loading...</p>;
  if (error) return <p className="text-red-500 text-center">{error}</p>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-extrabold my-8">
        Welcome, <span className="text-primary">{authUser.name}</span> 👋!
      </h1>

      {/* Subscription info only for students */}
      {authUser.role === "student" && (
        <>
          <p className="text-xl">
            You're on <span className="text-primary font-semibold">{authUser.subscriptionPlan}</span>
          </p>
          <Link href="/#subscriptions" className="text-sm underline text-gray-500">
            Checkout subscription plans
          </Link>
        </>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        <div className="bg-blue-600 text-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold">Total Classes</h2>
          <p className="text-4xl font-extrabold">{classData?.totalClasses ?? 0}</p>
        </div>

        <div className="bg-green-600 text-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold">{authUser.role !== "student" ? "Upcoming Classes" : "Remaining Classes"}</h2>
          <p className="text-4xl font-extrabold">{classData?.remainingClasses ?? 0}</p>
        </div>

        <div className="bg-yellow-600 text-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold">
          {authUser.role !== "student" ? "Total Students" : "Free Sessions"}
        </h2>
        <p className="text-4xl font-extrabold">
          {authUser.role !== "student" ? classData?.totalStudents ?? 0 : classData?.freeSessions ?? 0}
        </p>
      </div>

      </div>

      {authUser.role === "admin" && <AssignStudents />}

      <h2 className="text-3xl font-bold text-gray-800 mt-8">Upcoming Classes</h2>
      <div className="mt-4 space-y-4">
        {classData && classData.upcomingClasses.length > 0 ? (
          classData.upcomingClasses.slice((page - 1) * 5, page * 5).map((cls, index) => (
            <div key={index} className="p-4 bg-white rounded-md shadow-md">
              <p className="text-lg font-semibold pb-4">{cls.studentName}</p>
              <p className="text-gray-600">{new Date(cls.preferredTime).toLocaleString()}</p>
            </div>
          ))
        ) : (
          <div className="p-6 bg-white rounded-md shadow-md text-center">
            <p className="text-gray-500 text-lg">No upcoming classes scheduled</p>
          </div>
        )}
      </div>

      <h2 className="text-3xl font-bold text-gray-800 mt-8">Past Classes</h2>
      <div className="mt-4 space-y-4">
        {classData && classData.pastClasses.length > 0 ? (
          classData.pastClasses.slice((page - 1) * 5, page * 5).map((cls, index) => (
            <div key={index} className="p-4 bg-gray-200 rounded-md shadow-md">
              <p className="text-lg font-semibold">{cls.studentName}</p>
              <p className="text-gray-600">{new Date(cls.preferredTime).toLocaleString()}</p>
            </div>
          ))
        ) : (
          <div className="p-6 bg-gray-100 rounded-md shadow-md text-center">
            <p className="text-gray-500 text-lg">No past classes found</p>
          </div>
        )}
      </div>

      {/* Show pagination only if there are more than 2 items */}
      {classData && (
        (classData.upcomingClasses.length > 5 || classData.pastClasses.length > 5) && (
          <div className="flex justify-between mt-6">
            <button
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <button
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              onClick={() => setPage((prev) => prev + 1)}
              disabled={
                page * 5 >= classData.upcomingClasses.length && 
                page * 5 >= classData.pastClasses.length
              }
            >
              Next
            </button>
          </div>
        )
      )}
    </div>
  );
};

export default withAuth(Dashboard);
