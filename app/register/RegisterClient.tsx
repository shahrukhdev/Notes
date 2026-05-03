"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { registerUser } from "../../lib/authService";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setFieldErrors({});

    if (password !== confirmPassword) {
      setFieldErrors({
        confirmPassword: "Passwords do not match",
      });
      return;
    }

    try {
      setLoading(true);

      const data = await registerUser({
        name,
        email,
        password,
        confirmPassword,
      });

      toast.success(data?.message);
      router.push("/login");

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
    <div className="relative min-h-screen w-full bg-[#f8fafc] overflow-hidden">

      {/* Background glow */}
      <div className="fixed w-[600px] h-[600px] bg-green-300/20 blur-3xl rounded-full -top-40 -left-40 pointer-events-none" />
      <div className="fixed w-[500px] h-[500px] bg-emerald-400/10 blur-3xl rounded-full -bottom-40 -right-40 pointer-events-none" />

      {/* Center wrapper */}
      <div className="flex items-center justify-center min-h-screen px-4 py-10">

        {/* Card */}
        <div className="w-full max-w-md bg-white border border-gray-200 shadow-2xl rounded-3xl p-8">

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
            Create Account
          </h1>

          <p className="text-sm text-gray-500 text-center mt-2">
            Start organizing your notes
          </p>

          {/* Error */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Form */}
          <form className="mt-6 space-y-5" onSubmit={handleRegister}>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>

              <input
                type="text"
                placeholder="Your full name"
                className="w-full px-4 py-3 rounded-xl border border-gray-200
                           bg-white text-gray-900
                           focus:outline-none focus:ring-2 focus:ring-green-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              {fieldErrors.name && (
                <p className="text-sm text-red-500 mt-1">
                  {fieldErrors.name}
                </p>
              )}
            </div>

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
                  placeholder="Enter password"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>

              {fieldErrors.password && (
                <p className="text-sm text-red-500 mt-1">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>

              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200
                             bg-white text-gray-900
                             focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword((prev) => !prev)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showConfirmPassword ? "🙈" : "👁️"}
                </button>
              </div>

              {fieldErrors.confirmPassword && (
                <p className="text-sm text-red-500 mt-1">
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-medium
                         bg-gradient-to-r from-green-600 to-emerald-600
                         shadow-lg shadow-green-500/20
                         hover:scale-[1.02] active:scale-[0.98]
                         transition
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              ) : (
                "Create Account"
              )}
            </button>

          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-green-600 hover:underline font-medium"
            >
              Sign in
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}