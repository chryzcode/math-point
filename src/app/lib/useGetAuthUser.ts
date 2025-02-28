import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";

export const useGetAuthUser = () => {
  const { state, dispatch } = useAuth();
  const [authUser, setAuthUser] = useState<any | null>(state.user || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Decode token to check expiry
        const decoded: any = jwtDecode(token);
        if (decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          dispatch({ type: "LOGOUT" });
          router.push("/auth/login");
          return;
        }

        // Fetch user details from API
        const response = await fetch(`/api/user/detail`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setAuthUser(userData.user);
          dispatch({
            type: "LOGIN",
            payload: { token, user: userData.user },
          });
          localStorage.setItem("user", JSON.stringify(userData.user));
        } else {
          console.error("Failed to fetch user data");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          dispatch({ type: "LOGOUT" });
          router.push("/auth/login");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError("Failed to fetch user data");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        dispatch({ type: "LOGOUT" });
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [dispatch, router]);

  return { authUser, loading, error };
};
