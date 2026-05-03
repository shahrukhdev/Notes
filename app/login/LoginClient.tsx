"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { loginUser } from "../../lib/authService";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { refreshUser } = useAuth();

  const router = useRouter();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setFieldErrors({});

    try {
      setLoading(true);

      const data = await loginUser({ email, password });
      refreshUser();

      toast.success(data?.message);
      router.replace("/dashboard");

    } catch (error: any) {
      const status = error?.response?.status;

      if (status === 422) {
        const errorsArray = error?.response?.data?.errors || [];

        const formattedErrors: { [key: string]: string } = {};

        errorsArray.forEach((e: any) => {
          formattedErrors[e.field] = e.message;
        });

        setFieldErrors(formattedErrors);
      } else {
        const message = error?.response?.data?.message || "Something went wrong. Please try again!";
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#f8fafc] overflow-hidden">

      {/* Background glow */}
      <div className="absolute w-[600px] h-[600px] bg-green-300/20 blur-3xl rounded-full top-[-200px] left-[-200px]" />
      <div className="absolute w-[500px] h-[500px] bg-emerald-400/10 blur-3xl rounded-full bottom-[-200px] right-[-200px]" />

      {/* Card */}
      <div className="relative w-full max-w-md bg-white border border-gray-200 shadow-2xl rounded-3xl p-10">

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-green-600 flex items-center justify-center shadow-lg shadow-green-500/20">
            <Image
              src="/leaf-green-logo.avif"
              alt="Logo"
              width={28}
              height={28}
            />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-semibold text-gray-900 text-center">
          Notes
        </h1>

        <p className="text-sm text-gray-500 text-center mt-2">
          Sign in to access your workspace
        </p>

        {/* Error message */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Form */}
        <form className="mt-6 space-y-6" onSubmit={handleLogin}>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>

            <input
              type="email"
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200
                         bg-white text-gray-900
                         focus:outline-none focus:ring-2 focus:ring-green-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {fieldErrors.email && (
              <p className="text-sm text-red-500 mt-1">
                {fieldErrors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200
                           bg-white text-gray-900
                           focus:outline-none focus:ring-2 focus:ring-green-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>

            {fieldErrors.password && (
              <p className="text-sm text-red-500 mt-1">
                {fieldErrors.password}
              </p>
            )}

            {/* Forgot Password */}
            <div className="flex justify-end mt-2">
                <Link
                href="/forgot-password"
                className="text-xs text-green-600 hover:underline cursor-pointer"
                >
                Forgot password?
                </Link>
            </div>
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-medium
                       bg-gradient-to-r from-green-600 to-emerald-600
                       shadow-lg shadow-green-500/20
                       hover:shadow-green-500/40 hover:scale-[1.02]
                       active:scale-[0.98]
                       transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
            ) : (
              "Login"
            )}
          </button>

        </form>

        {/* Footer */}
        <div className="mt-6 text-center space-y-2">

          <p className="text-xs text-gray-400">
            Secure login for your personal notes
          </p>

          <p className="text-sm text-gray-600">
            Don’t have an account?{" "}
            <Link
              href="/register"
              className="text-green-600 hover:underline font-medium"
            >
              Create an account
            </Link>
          </p>

        </div>

      </div>
    </div>
  );
}