"use client";

import { createCategory, deleteCategory, getCategories, updateCategory } from "@/lib/categoryService";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function CategoryPage() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);

  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState<any>(null);

  const [open, setOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [formData, setFormData] = useState({ title: "" });
  const [modalLoading, setModalLoading] = useState(false);

  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchCategories = async (searchValue: string, pageNumber: number) => {
    try {
      setLoading(true);

      const response = await getCategories(searchValue, pageNumber, limit);

      setTimeout(() => {
        setCategories(response.data);
        setPagination(response.pagination);
        setLoading(false);
      }, 350);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Something went wrong. Please try again!"
      );
      setLoading(false); 
    } 
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchCategories(search, page);
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [search, page]);

  const handleCreate = async () => {
    try {
        setFieldErrors({});
        setModalLoading(true);

        const response = await createCategory(formData);

        toast.success(response?.message || "Category created successfully");

        setOpen(false);
        setFormData(() => ({ title: "" }));

        fetchCategories(search, page);

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
        setModalLoading(false);
    }
  };

  const handleEdit = async (category: any) => {
    try {
        setIsEditMode(true);
        setEditingId(category._id);

        setFormData(() => ({ title: category.title }));

        setOpen(true);
    } catch (error: any) {
        toast.error("Something went wrong. Please try again!");
    }
  };

  const handleUpdate = async () => {
    const categoryId = editingId;

    if (!categoryId) {
        return false;
    }

    try {
        setFieldErrors({});
        setModalLoading(true);

        const response = await updateCategory(categoryId, formData);

        toast.success(response.message || "Category updated successfully");

        setOpen(false);
        setFormData(() => ({ title: "" }));

        fetchCategories(search, page);

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
        setModalLoading(false)
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
        setDeleteLoading(true);

        const response = await deleteCategory(deletingId);

        toast.success(response.message || "Category deleted successfully");

        if (categories.length === 1 && page > 1) {
            setPage((prev) => prev - 1);
        } else {
            fetchCategories(search, page);
        }

        resetDeleteModal();
    } catch (error: any) {
        toast.error(error?.response?.data?.message || "Something went wrong. Please try again!");
    } finally {
        setDeleteLoading(false);
    }
  };

  const resetDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingId(null);
  };

  return (
    <div className="space-y-8">

      {/* ================= HEADER ================= */}
      <div className="flex items-end justify-between">

        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Categories
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Organize your notes with categories
          </p>

          <div className="mt-2 text-xs text-gray-400">
            {loading
              ? "Loading..."
              : `${pagination?.total || 0} categories`}
          </div>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600
                     text-white text-sm font-medium shadow-sm hover:shadow-md
                     hover:scale-[1.02] transition"
        >
          + Add Category
        </button>
      </div>

      {/* ================= SEARCH ================= */}
      <div className="relative max-w-sm">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search categories..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200
                     focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
        />

        <svg
          className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M21 21l-4.3-4.3M10 18a8 8 0 100-16 8 8 0 000 16z" />
        </svg>
      </div>

      {/* ================= LOADING ================= */}
      {loading && (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex justify-between items-center px-5 py-4 border-b animate-pulse"
            >
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
              <div className="h-4 w-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      )}

      {/* ================= EMPTY ================= */}
      {!loading && categories.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
          <p className="text-gray-500 font-medium">
            No categories found
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Try adjusting your search or create a new one
          </p>
        </div>
      )}

      {/* ================= TABLE ================= */}
      {!loading && categories.length > 0 && (
        <>
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">

            {/* header */}
            <div className="grid grid-cols-3 px-5 py-3 text-xs font-medium text-gray-500 border-b bg-gray-50">
              <span>Title</span>
              <span>Created</span>
              <span className="text-right">Actions</span>
            </div>

            {/* rows */}
            {categories.map((category) => (
              <div
                key={category._id}
                className="grid grid-cols-3 items-center px-5 py-4 border-b
                           hover:bg-gray-50 transition"
              >
                <span className="text-sm font-medium text-gray-800">
                  {category.title}
                </span>

                <span className="text-xs text-gray-400">
                  {new Date(category.createdAt).toLocaleDateString()}
                </span>

                <div className="flex justify-end gap-4 text-xs">
                  <button onClick={() => handleEdit(category)} className="text-gray-500 hover:text-gray-800 transition">
                    Edit
                  </button>
                  <button onClick={() => { setDeletingId(category._id); setShowDeleteModal(true); }} className="text-red-400 hover:text-red-500 transition">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ================= PAGINATION ================= */}
          {pagination?.totalPages > 1 && (
            <div className="flex items-center justify-between">

              <p className="text-sm text-gray-500">
                Page {pagination.page} of {pagination.totalPages}
              </p>

              <div className="flex gap-2">

                <button
                  onClick={() => setPage((prev) => prev - 1)}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-200
                             hover:bg-gray-50 disabled:opacity-50"
                >
                  Prev
                </button>

                {[...Array(pagination.totalPages)].map((_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition
                        ${
                          page === p
                            ? "bg-emerald-500 text-white border-emerald-500"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                    >
                      {p}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPage((prev) => prev + 1)}
                  disabled={page === pagination.totalPages}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-200
                             hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>

              </div>
            </div>
          )}
        </>
      )}

    {/* ================= MODAL ================= */}
    {open && (
    <div className="fixed inset-0 z-50 flex items-center justify-center">

        {/* backdrop */}
        <div
        onClick={() => {setOpen(false); setFormData({ title: "" }); setFieldErrors({}); setIsEditMode(false); setEditingId(null);}}
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        />

        <div className="relative w-full max-w-md">

        <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl p-6">

            <h2 className="text-lg font-semibold text-gray-900">
            {isEditMode ? 'Update Category' : 'Create Category'}
            </h2>

            <p className="text-sm text-gray-500 mt-1">
            {isEditMode ? 'Update a category to group your notes' : 'Add a category to group your notes'}
            </p>

            {/* INPUT */}
            <div className="mt-6">
            <input
                value={formData.title}
                onChange={(e) =>
                setFormData({ title: e.target.value })
                }
                placeholder="Category title"
                className={`w-full px-4 py-3 rounded-xl border ${
                fieldErrors.title
                    ? "border-red-400"
                    : "border-gray-200"
                } focus:ring-2 focus:ring-emerald-500 focus:outline-none`}
            />

            {/* FIELD ERROR */}
            {fieldErrors.title && (
                <p className="text-xs text-red-500 mt-1">
                {fieldErrors.title}
                </p>
            )}
            </div>

            {/* ACTIONS */}
            <div className="mt-6 flex gap-3">

            <button
                onClick={() => {
                setOpen(false);
                setFormData({ title: "" });
                setIsEditMode(false); 
                setEditingId(null);
                setFieldErrors({});
                }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200
                        text-gray-600 hover:bg-gray-50 transition"
            >
                Cancel
            </button>

            <button
                onClick={isEditMode ? handleUpdate : handleCreate}
                disabled={!formData.title.trim() || modalLoading}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r
                        from-emerald-500 to-emerald-600 text-white
                        font-medium flex items-center justify-center gap-2
                        disabled:opacity-50 transition"
            >
                {modalLoading && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                )}

                {
                    modalLoading
                    ? (isEditMode ? "Updating..." : "Creating...")
                    : (isEditMode ? "Update" : "Create")
                }
            </button>

            </div>

        </div>

        </div>

    </div>
    )}

    {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">

            {/* backdrop */}
            <div
            onClick={() => {
                setShowDeleteModal(false);
                setDeletingId(null);
            }}
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
            />

            <div className="relative w-full max-w-md">

            <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl p-6">

                {/* Icon + Title */}
                <div className="flex items-start gap-4">

                <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-red-50">
                    <svg
                    className="w-5 h-5 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    >
                    <path d="M12 9v4m0 4h.01M5.07 19A10 10 0 1119 5.07 10 10 0 015.07 19z" />
                    </svg>
                </div>

                <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                    Delete Category
                    </h2>

                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                    This action cannot be undone. This will permanently delete the category
                    and remove it from your notes.
                    </p>
                </div>

                </div>

                {/* subtle divider */}
                <div className="mt-5 border-t border-gray-100" />

                {/* Actions */}
                <div className="mt-5 flex gap-3">

                <button
                    onClick={() => {
                    setShowDeleteModal(false);
                    setDeletingId(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200
                            text-gray-600 hover:bg-gray-50 transition"
                >
                    Cancel
                </button>

                <button
                    onClick={handleDelete}
                    disabled={deleteLoading}
                    className="flex-1 py-2.5 rounded-xl bg-red-500 text-white
                            font-medium flex items-center justify-center gap-2
                            hover:bg-red-600 shadow-sm hover:shadow-md
                            disabled:opacity-50 transition"
                >
                    {deleteLoading && (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    )}

                    {deleteLoading ? "Deleting..." : "Delete"}
                </button>

                </div>

            </div>

            </div>

        </div>
        )}

    </div>
  );
}