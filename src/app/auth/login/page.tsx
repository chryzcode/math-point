"use client";

import { useState, useEffect} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { dispatch } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const status = searchParams.get("status");

    if (status) {
      if (status === "success") {
        toast.success("Email verified! You can now log in.");
      } else if (status === "expired") {
        toast.error("The verification link has expired.");
      } else if (status === "invalid") {
        toast.error("Invalid verification token.");
      } else if (status === "error") {
        toast.error("Something went wrong. Please try again later.");
      }

      // Remove the status query from the URL
      router.replace("/auth/login");
    }
  }, [searchParams, router]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();


      if (!response.ok) {
        throw new Error(data.error || "Invalid email or password");
      }

      // Store token securely (Consider using httpOnly cookies)
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify({ id: data.user.id }));

      dispatch({
        type: "LOGIN",
        payload: { token: data.token, user: { id: data.user.id } },
      });

      router.push("/dashboard");
      toast.success("Login successful!");
    } catch (error: any) {
      toast.error(error.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 text-center">Login</h2>
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Register Redirect */}
        <p className="text-center mt-4 text-gray-600">
          Don't have an account? <a href="/auth/register" className="text-primary">Register</a>
        </p>


        <p className="text-center mt-4 text-gray-600">
         <a href="/auth/forgot-password" className="text-primary">Forgot password?</a>
        </p>
      </div>
    </div>
  );
}
