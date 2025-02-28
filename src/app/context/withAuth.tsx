"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";

/**
 * Authentication wrapper HOC that redirects unauthenticated users to login
 */
const withAuth = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
  const AuthWrapper: React.FC<P> = (props) => {
    const router = useRouter();
    const { state } = useAuth(); // Get authentication state
    const { isAuthenticated } = state; // Access isAuthenticated from state

    useEffect(() => {
      if (!isAuthenticated) {
        router.push("/auth/login");
      }
    }, [isAuthenticated, router]);

    if (!isAuthenticated) {
      return null; // Prevent rendering before redirect
    }

    return <WrappedComponent {...props} />;
  };

  return AuthWrapper;
};

export default withAuth;
