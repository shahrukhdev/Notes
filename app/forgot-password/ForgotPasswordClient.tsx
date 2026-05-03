"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { forgotPassword } from "../../lib/authService";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setFieldErrors({});

    if (!email) {
      setFieldErrors({ email: "Email is required" });
      return;
    }

    try {
      setLoading(true);

      const response = await forgotPassword({ email });

      toast.success(response?.message || "Reset link sent successfully");

      setEmail("");
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

        {/* Title */}
        <h1 className="text-3xl font-semibold text-gray-900 text-center">
          Forgot Password
        </h1>

        <p className="text-sm text-gray-500 text-center mt-2">
          Enter your email to reset your password
        </p>

        {/* Error */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Form */}
        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>

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
              "Send Reset Link"
            )}
          </button>

        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600">
          Remember your password?{" "}
          <Link
            href="/login"
            className="text-green-600 hover:underline font-medium"
          >
            Sign in
          </Link>
        </div>

      </div>
    </div>
  );
}