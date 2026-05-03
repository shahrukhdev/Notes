import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";

import { AuthProvider } from "@/context/AuthContext";
import AuthGate from "@/components/AuthGate";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Notes App",
  description: "Modern SaaS Notes Application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gray-50 text-gray-900 antialiased`}>

        {/* 🔥 AUTH PROVIDER WRAPS EVERYTHING */}
        <AuthProvider>

          <AuthGate>

            {children}

          </AuthGate>

        </AuthProvider>

        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          draggable
          theme="colored"
        />
      </body>
    </html>
  );
}