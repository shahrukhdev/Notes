"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";
import { updateUser } from "@/lib/userService";

export default function ProfilePage() {
  const { user, setUser, loading } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [formLoading, setFormLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        password: "",
        confirmPassword: "",
      });
    }
  }, [user]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setFieldErrors({});

    if (formData.password && formData.password !== formData.confirmPassword) {
      setFieldErrors({
        confirmPassword: "Passwords do not match",
      });
      return;
    }

    try {
      setFormLoading(true);

      const form: any = new FormData();

      form.append("name", formData.name);
      form.append("email", formData.email);

      if (formData.password) {
        form.append("password", formData.password);
        form.append("confirmPassword", formData.confirmPassword);
      }

      if (selectedImage) {
        form.append("profileImage", selectedImage);
      }

      const response = await updateUser(form);

      toast.success(response.message || "User updated successfully");

      if (response.data) {
        setUser({
          id: response.data.id,
          name: response.data.name,
          email: response.data.email,
          profileImage: response.data?.profileImage
        });

        setFormData((prev) => ({
          ...prev,
          name: response.data.name,
          email: response.data.email,
          password: "",
          confirmPassword: "",
        }));
      }

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
        toast.error(
          error?.response?.data?.message ||
            "Something went wrong. Please try again!"
        );
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setSelectedImage(file);

    // preview
    const imageUrl = URL.createObjectURL(file);
    setPreview(imageUrl);
  };

  return (
    <div className="w-full space-y-8">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Profile
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your personal information and account security
        </p>
      </div>

      {/* ================= SKELETON ================= */}
      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">

          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-20 h-20 bg-gray-200 rounded-full" />
              <div className="h-4 w-32 bg-gray-200 rounded" />
              <div className="h-3 w-40 bg-gray-200 rounded" />
            </div>
          </div>

          <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 space-y-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-24 bg-gray-200 rounded" />
                <div className="h-10 w-full bg-gray-200 rounded-xl" />
              </div>
            ))}
            <div className="h-10 w-32 bg-gray-200 rounded-xl ml-auto" />
          </div>

        </div>
      )}

      {/* ================= ACTUAL CONTENT ================= */}
      {!loading && (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">

            <div className="flex flex-col items-center text-center">

              {/* IMAGE UPLOAD */}
              <div className="relative group">

                <Image
                  src={preview || user?.profileImage || "/avatar-placeholder.webp"}
                  alt="Profile"
                  width={96}
                  height={96}
                  priority
                  className="rounded-full object-cover border-2 border-gray-200 shadow-sm"
                />

                {/* ICON BUTTON */}
                <label className="absolute bottom-0 right-0 bg-white border border-gray-200 p-2 rounded-full shadow cursor-pointer 
                                  hover:bg-emerald-50 transition group-hover:scale-105">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 text-emerald-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.232 5.232l3.536 3.536M9 11l6-6a2.121 2.121 0 113 3L12 14l-4 1 1-4z"
                    />
                  </svg>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>

              </div>

              <h2 className="mt-4 text-lg font-semibold text-gray-900">
                {user?.name}
              </h2>

              <p className="text-sm text-gray-500">
                {user?.email}
              </p>

              {/* Divider */}
              <div className="w-full mt-6 border-t border-gray-100" />

              {/* INFO */}
              <div className="w-full mt-4 space-y-3 text-left">

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Status</span>
                  <span className="text-green-600 font-medium">Active</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Role</span>
                  <span className="text-gray-800 font-medium">User</span>
                </div>

              </div>

            </div>
          </div>

          {/* RIGHT */}
          <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-6">

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Account Details
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* NAME */}
              <div>
                <label className="text-xs text-gray-500">Name</label>
                <input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className={`w-full mt-1 px-4 py-3 rounded-xl border ${
                    fieldErrors.name ? "border-red-400" : "border-gray-200"
                  } focus:ring-2 focus:ring-emerald-500 outline-none`}
                  required
                />
                {fieldErrors.name && (
                  <p className="text-xs text-red-500 mt-1">
                    {fieldErrors.name}
                  </p>
                )}
              </div>

              {/* EMAIL */}
              <div>
                <label className="text-xs text-gray-500">Email</label>
                <input
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className={`w-full mt-1 px-4 py-3 rounded-xl border ${
                    fieldErrors.email ? "border-red-400" : "border-gray-200"
                  } focus:ring-2 focus:ring-emerald-500 outline-none`}
                  required
                />
                {fieldErrors.email && (
                  <p className="text-xs text-red-500 mt-1">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              {/* PASSWORD */}
              <div>
                <label className="text-xs text-gray-500">Password</label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-gray-500"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {/* CONFIRM PASSWORD */}
              <div>
                <label className="text-xs text-gray-500">
                  Confirm Password
                </label>
                <div className="relative mt-1">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className={`w-full px-4 py-3 rounded-xl border pr-10 ${
                      fieldErrors.confirmPassword
                        ? "border-red-400"
                        : "border-gray-200"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-3.5 text-gray-500"
                  >
                    {showConfirm ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">
                    {fieldErrors.confirmPassword}
                  </p>
                )}
              </div>

            </div>

            {/* ACTION */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={formLoading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r
                           from-emerald-500 to-emerald-600 text-white
                           font-medium flex items-center gap-2
                           disabled:opacity-50 transition cursor-pointer"
              >
                {formLoading && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                )}
                {formLoading ? "Updating..." : "Update Profile"}
              </button>
            </div>

          </div>

        </form>
      )}

    </div>
  );
}