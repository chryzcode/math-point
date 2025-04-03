"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "../context/AuthContext";
import { useGetAuthUser } from "../lib/useGetAuthUser";

const Header = () => {
  const router = useRouter();

  const { state, dispatch } = useAuth();
  const { isAuthenticated, user } = state;
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const { authUser } = useGetAuthUser();
  const [currentUser, setCurrentUser] = useState(user || authUser);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentUser(state.user || authUser);
  }, [state.user, authUser]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (mobileDropdownRef.current && !mobileDropdownRef.current.contains(event.target as Node)) {
        setMobileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside, true);
    return () => document.removeEventListener("mousedown", handleClickOutside, true);
  }, []);

  const handleLogout = () => {
    dispatch({ type: "LOGOUT" });
    setDropdownOpen(false);
    setMobileDropdownOpen(false);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/auth/login");
  };

  return (
    <nav ref={navRef} className="relative flex justify-between items-center py-4 px-4 border-b border-primary z-[1000]">
      <div className="flex items-center space-x-2">
        <Link href="/">
          <div className="flex items-center space-x-2">
            <Image src="/logo.png" alt="Math Point Logo" width={64} height={64} className="object-contain" />
            <p className="text-xl font-bold text-primary">Math Point</p>
          </div>
        </Link>
      </div>

      {/* Desktop Menu */}
      <div className="hidden md:flex flex-1 justify-center space-x-6">
        <NavLinks router={router} onClick={() => setIsOpen(false)} isAuthenticated={isAuthenticated} user={currentUser} />
      </div>

      <div className="flex items-center space-x-4 ml-auto">
        {isAuthenticated && currentUser ? (
          <div ref={dropdownRef} className="relative hidden md:block">
            <button
              className="flex items-center space-x-2 text-primary font-bold"
              onClick={(e) => {
                e.stopPropagation();
                setDropdownOpen(!dropdownOpen);
              }}
            >
              <span>{currentUser?.name}</span>
              <span className="material-icons">arrow_drop_down</span>
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-background shadow-lg py-2 z-[1001]">
                <DropdownMenu handleLogout={handleLogout} />
              </div>
            )}
          </div>
        ) : (
          <button
            className="hidden md:block bg-primary px-4 py-2 text-white font-bold"
            onClick={() => router.push("/auth/register")}
          >
            Register
          </button>
        )}
      </div>

      {/* Mobile Menu Button */}
      <button
        className="md:hidden text-primary ml-auto pt-2"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        <span className="material-icons text-primary text-3xl">{isOpen ? "close" : "menu"}</span>
      </button>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="absolute top-16 my-8 left-0 w-full bg-white shadow-lg py-6 flex flex-col items-center space-y-4 md:hidden z-[1001] rounded-md border-t border-primary">
          <div className="relative w-full px-4">
            <div className="flex flex-col w-full space-y-2">
              <NavLinks router={router} onClick={() => setIsOpen(false)} isAuthenticated={isAuthenticated} user={currentUser} />
            </div>
          </div>

          {isAuthenticated && currentUser && (
            <div ref={mobileDropdownRef} className="relative w-full flex justify-end pr-6">
              <button
                className="flex items-center space-x-2 text-primary font-bold"
                onClick={(e) => {
                  e.stopPropagation();
                  setMobileDropdownOpen(!mobileDropdownOpen);
                }}
              >
                <span>{currentUser?.name}</span>
                <span className="material-icons">arrow_drop_down</span>
              </button>
              {mobileDropdownOpen && (
                <div className="absolute right-0 mt-6 w-48 bg-background shadow-lg py-2 z-[1001]">
                  <DropdownMenu handleLogout={handleLogout} />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

// Helper Components
const NavLinks = ({
  router,
  onClick,
  isAuthenticated,
  user,
}: {
  router: any;
  onClick: () => void;
  isAuthenticated: boolean;
  user: any;
}) => {
  return (
    <>
      <button
        className="text-primary text-lg"
        onClick={() => {
          onClick();
          router.push("/dashboard");
        }}
      >
        Dashboard
      </button>

      {user?.role === "student" && (
        <button
          className="text-primary text-lg"
          onClick={() => {
            onClick();
            router.push("/book-session");
          }}
        >
          Book Session
        </button>
      )}
    </>
  );
};

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
