"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation"; 
import { getNotes } from "@/lib/noteService";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import { logout } from "@/lib/authService";
import Image from "next/image";
import Link from "next/link";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [openDropdown, setOpenDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const { user, setUser } = useAuth();

  /* Sync header input with URL when on /notes page */
  useEffect(() => {
    if (pathname === "/notes") {
      const urlSearch = searchParams.get("search") || "";
      setSearch(urlSearch);
    }
  }, [pathname, searchParams]);

  /* ================= CLICK OUTSIDE ================= */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setOpenDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ================= SEARCH (DEBOUNCE) ================= */
  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      setOpenDropdown(false);

      /* If on notes page and search cleared, update notes page URL */
      if (pathname === "/notes") {
        router.replace("/notes", { scroll: false });
      }
      return;
    }

    const delay = setTimeout(async () => {
      try {
        const response = await getNotes(search, 1, 5);
        setResults(response?.data || []);
        setOpenDropdown(true);
      } catch (error) {
        // console.error(error);
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [search]);

  useEffect(() => {
    if (results.length > 0) setActiveIndex(0);
  }, [results]);

  /* Don't clear search, navigate with encoded value */
  const handleSelect = (value: string) => {
    setSearch(value);        // keep value visible in input
    setOpenDropdown(false);
    router.push(`/notes?search=${encodeURIComponent(value)}`);
  };

  /* Typing in header while on /notes updates the notes page URL */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);

    if (pathname === "/notes") {
      // Let notes page Effect #1 handle the fetch via URL sync
      const params = new URLSearchParams();
      if (value.trim()) params.set("search", value);
      router.replace(value.trim() ? `?${params.toString()}` : "/notes", { scroll: false });
    }
  };

  /* ================= LOGOUT ================= */
  const handleLogout = async () => {
    try {
      const data = await logout();
      setUser(null);
      toast.success(data?.message);
      router.replace("/login");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Something went wrong. Please try again!");
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 relative z-40">

      {/* ================= SEARCH ================= */}
      <div ref={searchRef} className="w-full max-w-md">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={handleInputChange} 
            onKeyDown={(e) => {
              if (!openDropdown) return;

              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((prev) => prev < results.length - 1 ? prev + 1 : 0);
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((prev) => prev > 0 ? prev - 1 : results.length - 1);
              }
              if (e.key === "Enter") {
                e.preventDefault();
                const selected = results?.[activeIndex];
                if (selected) {
                  handleSelect(selected.title);
                } else {
                  handleSelect(search);
                }
                setOpenDropdown(false);
              }
            }}
            placeholder="Search notes..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg
                       text-sm text-gray-800 placeholder:text-gray-400
                       focus:outline-none focus:border-emerald-400 transition"
          />

          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
            fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21 21l-4.3-4.3m1.8-5.2a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>

          {openDropdown && (
            <div className="absolute mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden">
              {results.length > 0 ? (
                results.map((note: any, index: number) => (
                  <div
                    key={note._id}
                    onClick={() => handleSelect(note.title)}
                    className={`px-4 py-3 text-sm cursor-pointer transition
                      ${index === activeIndex ? "bg-emerald-50 text-emerald-700" : "text-gray-700 hover:bg-gray-50"}`}
                  >
                    {note.title}
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-gray-400">No results found</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ================= PROFILE ================= */}
      <div ref={dropdownRef} className="relative flex items-center gap-3">

        <span className="hidden sm:block text-[13.5px] font-semibold tracking-tight text-gray-900">
          {user?.name}
        </span>

        <div
          onClick={() => setOpen(!open)}
          className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 cursor-pointer hover:shadow-sm transition"
        >
          <Image
            src={user?.profileImage || "/avatar-placeholder.webp"}
            alt="Profile"
            width={36}
            height={36}
            priority
          />
        </div>

        {/* DROPDOWN */}
        {open && (
          <div className="absolute right-0 top-12 w-44 bg-white border border-gray-100 shadow-lg rounded-xl overflow-hidden z-50">

            <Link href="/profile">
              <button
                onClick={() => setOpen(false)}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition"
              >
                Profile
              </button>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition cursor-pointer"
            >
              Logout
            </button>

          </div>
        )}

      </div>

    </header>
  );
}