"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useGetAuthUser } from "../lib/useGetAuthUser";

const Header = () => {
  const { state, dispatch } = useAuth();
  const { isAuthenticated, user } = state;
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const router = useRouter();
  const { authUser, loading } = useGetAuthUser();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdownButton = document.getElementById("dropdown-button");
      const dropdownMenu = document.getElementById("dropdown-menu");
      const mobileDropdownButton = document.getElementById("mobile-dropdown-button");
      const mobileDropdownMenu = document.getElementById("mobile-dropdown-menu");

      if (
        dropdownOpen &&
        dropdownButton &&
        dropdownMenu &&
        !dropdownButton.contains(event.target as Node) &&
        !dropdownMenu.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }

      if (
        mobileDropdownOpen &&
        mobileDropdownButton &&
        mobileDropdownMenu &&
        !mobileDropdownButton.contains(event.target as Node) &&
        !mobileDropdownMenu.contains(event.target as Node)
      ) {
        setMobileDropdownOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [dropdownOpen, mobileDropdownOpen]);

  const handleLogout = () => {
    dispatch({ type: "LOGOUT" });
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/auth/login");
  };

  return (
    <header className="relative flex justify-between items-center py-6 px-6 border-b border-primary">
      <div
        className="flex items-center space-x-2 cursor-pointer"
        onClick={() => router.push("/")}
      >
        <img src="/logo.png" alt="Math Point Logo" className="h-12 w-12" />
        <h1 className="text-2xl font-bold text-primary">Math Point</h1>
      </div>

      {/* Desktop Menu */}
      <div className="hidden md:flex flex-1 justify-center space-x-6">
        <NavLinks onClick={() => setIsOpen(false)} />
      </div>

      <div className="flex items-center space-x-4 ml-auto">
        {isAuthenticated && user ? (
          <div className="relative hidden md:block">
            <button
              id="dropdown-button"
              className="flex items-center space-x-2 text-primary font-bold"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <span>{authUser?.name}</span>
              <span className="material-icons">arrow_drop_down</span>
            </button>

            {dropdownOpen && (
              <div
                id="dropdown-menu"
                className="absolute right-0 mt-2 w-48 bg-white shadow-lg py-2 z-50"
              >
                <DropdownMenu handleLogout={handleLogout} />
              </div>
            )}
          </div>
        ) : (
          <button
            className="hidden md:block bg-primary text-white px-4 py-2 rounded-md"
            onClick={() => router.push("/auth/register")}
          >
            Register
          </button>
        )}
      </div>

      {/* Mobile Menu Button */}
      <button
        className="md:hidden text-primary ml-auto pt-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="material-icons text-3xl">
          {isOpen ? "close" : "menu"}
        </span>
      </button>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="absolute top-16 left-0 w-full bg-white mt-6 py-6 flex flex-col items-center space-y-4 md:hidden z-50">
          <NavLinks onClick={() => setIsOpen(false)} />

          {isAuthenticated && user && (
            <div className="relative w-full flex justify-end pr-6">
              <button
                id="mobile-dropdown-button"
                className="flex items-center space-x-2 text-primary font-bold"
                onClick={() => setMobileDropdownOpen(!mobileDropdownOpen)}
              >
                <span>{authUser?.name}</span>
                <span className="material-icons">arrow_drop_down</span>
              </button>

              {mobileDropdownOpen && (
                <div
                  id="mobile-dropdown-menu"
                  className="absolute right-0 mt-6 w-48 bg-white shadow-lg py-2 z-50"
                >
                  <DropdownMenu handleLogout={handleLogout} />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
};

const NavLinks = ({ onClick }: { onClick: () => void }) => (
  <>
    {[
      { name: "Dashboard", route: "/dashboard" },
      { name: "Book Session", route: "/book-session" },
    ].map((item) => (
      <a
        key={item.name}
        href={item.route}
        className=""
        onClick={onClick}
      >
        {item.name}
      </a>
    ))}
  </>
);

const DropdownMenu = ({ handleLogout }: { handleLogout: () => void }) => (
  <>
    <button
      className="block w-full text-left px-4 py-2 hover:cursor-pointer"
      onClick={() => {
        window.location.href = "/auth/settings";
      }}
    >
      Update Profile
    </button>
    <button
      className="block w-full text-left px-4 py-2 text-red-500 hover:cursor-pointer"
      onClick={handleLogout}
    >
      Logout
    </button>
  </>
);

export default Header;
