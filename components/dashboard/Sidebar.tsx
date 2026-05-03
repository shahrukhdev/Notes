"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Tags,
  FolderOpen,
  User,
  Users,
} from "lucide-react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { logout } from "@/lib/authService";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser } = useAuth();

  const handleLogout = async () => {
    try {
      const data = await logout();

      setUser(null);

      toast.success(data?.message);
      router.replace("/login");

    } catch (error:any) {
      const message = error?.response?.data?.message || "Something went wrong. Please try again!";
      toast.error(message);
    }
  };

  const menu = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Notes", href: "/notes", icon: FileText },
    { name: "Categories", href: "/categories", icon: FolderOpen },
    { name: "Tags", href: "/tags", icon: Tags },
    { name: "Profile", href: "/profile", icon: User },
    // { name: "Users", href: "/users", icon: Users },
  ];

  return (
    <aside className="w-64 flex flex-col bg-gray-50 border-r border-gray-200">

      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-4 bg-white border-b border-gray-100">

        <Image
          src="/leaf-green-logo.avif"
          alt="Logo"
          width={24}
          height={24}
        />

        <span className="text-[16px] font-semibold tracking-tight text-gray-900">
          Notes
        </span>

      </div>

      {/* Menu */}
      <nav className="flex-1 p-3 space-y-1">

        {menu.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200

              ${
                isActive
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 hover:translate-x-0.5"
              }
              `}
            >

              <item.icon size={18} />

              <span className="text-[13.5px] font-medium tracking-tight">
                {item.name}
              </span>

            </Link>
          );
        })}

      </nav>

      {/* Profile */}
      <div className="p-3 border-t border-gray-100 bg-white">

        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition">

          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center text-white text-sm font-semibold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>

          <div className="flex flex-col leading-tight">
            <span className="text-sm font-medium tracking-tight text-gray-900">
              {user?.name}
            </span>

            <button
              onClick={handleLogout}
              className="text-xs text-gray-400 hover:text-red-500 cursor-pointer text-left p-0 bg-transparent border-none"
            >
              Logout
            </button>
          </div>

        </div>

      </div>

    </aside>
  );
}