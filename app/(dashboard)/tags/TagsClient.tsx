"use client";

import { useEffect, useState } from "react";
import { createTag, deleteTag, getTags, updateTag } from "@/lib/tagService";
import { toast } from "react-toastify";

export default function TagsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setTags] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    isActive: true,
  });

  const [open, setOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [modalLoading, setModalLoading] = useState(false);

  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState<any>(null);

    const fetchTags = async (searchValue: string, pageNumber: number) => {
        try {
            setLoading(true);
                
            const response = await getTags(searchValue, pageNumber, limit);

            setTimeout(() => {
            setTags(response.data);
            setLoading(false);
            setPagination(response.pagination);
            }, 350);

        } catch (error: any) {
            toast.error(error.response?.data?.message || "Something went wrong. Please try again!");
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            fetchTags(search, page);
        }, 400);

        return () => clearTimeout(delayDebounce);
        }, [search, page]);

  const tags = data || [];

  const handleCreate = async () => {
    try {
      setFieldErrors({});
      setModalLoading(true);

      const response = await createTag(formData);

      toast.success(response?.message || "Tag created successfully");

      setOpen(false);
      setFormData(() => ({ name: "", isActive: true }));

      const updated = await getTags();
      setTags(updated.data);
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

  const handleEdit = async (tag: any) => {
    try {
        setIsEditMode(true);
        setEditingId(tag._id);
        
        setFormData(() => ({ name: tag.name, isActive: tag.isActive }));

        setOpen(true);
    } catch (error: any) {
        toast.error("Something went wrong. Please try again!");
    }
  };

  const handleUpdate = async () => {
    const tagId = editingId;

    if(!tagId) {
        return false;
    }
    
    try {
        setFieldErrors({});
        setModalLoading(true);

        const response = await updateTag(tagId, formData);

        toast.success(response.message || "Tag updated successfully");

        setOpen(false);
        setFormData(() => ({ name: "", isActive: true }));

        const updated = await getTags();
        setTags(updated.data);

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

  const handleDelete = async () => {

    if(!deletingId) return;

    try {
        setDeleteLoading(true);

        const response = await deleteTag(deletingId);

        toast.success(response.message || "Tag deleted successfully");

        const updated = await getTags();
        setTags(updated.data);

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
    <div className="space-y-10">

      {/* ================= HEADER ================= */}
      <div className="flex items-end justify-between">

        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            Tags
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Organize and filter your notes with smart labels
          </p>

          <div className="mt-3 text-xs text-gray-400">
            {loading ? "Loading tags..." : `${tags.length} tags available`}
          </div>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600
                     text-white text-sm font-medium shadow-sm hover:shadow-md
                     hover:scale-[1.02] transition"
        >
          + New Tag
        </button>

      </div>

      {/* ================= SEARCH BAR ================= */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search tags..."
          className="w-full px-4 py-3 rounded-xl border border-gray-200
                     focus:ring-2 focus:ring-emerald-500 outline-none"
        />
      </div>

      {/* ================= LOADING ================= */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4 animate-pulse"
            >
              <div className="flex justify-between">
                <div className="h-5 w-20 bg-gray-200 rounded-full"></div>
                <div className="h-3 w-10 bg-gray-200 rounded"></div>
              </div>
              <div className="h-3 w-16 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      )}

      {/* ================= EMPTY ================= */}
      {!loading && tags.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
          <p className="text-gray-500 font-medium">No tags created yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Create your first tag to organize notes better
          </p>

          <button
            onClick={() => setOpen(true)}
            className="mt-5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm hover:bg-emerald-700 transition"
          >
            Create Tag
          </button>
        </div>
      )}

      {/* ================= TAG GRID ================= */}
      {!loading && tags.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">

            {tags.map((tag: any) => (
            <div
                key={tag._id}
                className="group relative bg-white border border-gray-100 rounded-2xl p-5
                        hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
            >

                {/* glow */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100
                                bg-emerald-50 blur-2xl -z-10 transition" />

                {/* TOP */}
                <div className="flex items-center justify-between">

                <div className="flex items-center gap-2">

                    {/* Tag name */}
                    <span className="px-3 py-1 text-xs font-medium rounded-full
                                    bg-emerald-50 text-emerald-700">
                    {tag.name}
                    </span>

                    <span
                    className={`flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-full
                    ${
                        tag.isActive
                        ? "bg-green-50 text-green-600"
                        : "bg-gray-100 text-gray-500"
                    }`}
                    >
                    <span
                        className={`w-1.5 h-1.5 rounded-full
                        ${tag.isActive ? "bg-green-500" : "bg-gray-400"}`}
                    />
                    {tag.isActive ? "Active" : "Inactive"}
                    </span>

                </div>

                <span className="text-xs text-gray-400">
                    {tag.noteCount || 0} notes
                </span>

                </div>

                {/* FOOTER */}
                <div className="mt-5 flex justify-between text-xs text-gray-400">

                <button onClick={() => handleEdit(tag)} className="hover:text-gray-700 transition">
                    Edit
                </button>

                <button
                onClick={() => {
                    setDeletingId(tag._id);
                    setShowDeleteModal(true);
                }}
                className="text-red-400 hover:text-red-500 transition"
                >
                Delete
                </button>

                </div>

            </div>
            ))}

        </div>
      )}

    {/* ================= PAGINATION ================= */}
      {!loading && pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">

          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 rounded-lg border"
          >
            Prev
          </button>

          {Array.from({ length: pagination.totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`px-3 py-1 rounded-lg border ${
                page === i + 1 ? "bg-emerald-500 text-white" : ""
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            disabled={page === pagination.totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 rounded-lg border"
          >
            Next
          </button>

        </div>
      )}

      {/* ================= MODAL ================= */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">

          <div
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
          />

          <div className="relative w-full max-w-md">

            <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl p-6">

              <h2 className="text-lg font-semibold text-gray-900">
                {isEditMode ? 'Update Tag' : 'Create Tag'}
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Add a label to organize your notes
              </p>

              {/* INPUT */}
              <div className="mt-6">
                <input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Tag name"
                  className={`w-full px-4 py-3 rounded-xl border ${
                    fieldErrors.name
                      ? "border-red-400"
                      : "border-gray-200"
                  } focus:ring-2 focus:ring-emerald-500 focus:outline-none`}
                />

                {/* FIELD ERROR */}
                {fieldErrors.name && (
                  <p className="text-xs text-red-500 mt-1">
                    {fieldErrors.name}
                  </p>
                )}
              </div>

              {/* TOGGLE */}
              <div className="mt-5 flex items-center justify-between p-4 rounded-xl bg-gray-50">

                <div>
                  <p className="text-sm font-medium text-gray-800">
                    Active
                  </p>
                  <p className="text-xs text-gray-500">
                    Enable this tag
                  </p>
                </div>

                <button
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      isActive: !prev.isActive,
                    }))
                  }
                  className={`relative w-14 h-7 rounded-full transition ${
                    formData.isActive
                      ? "bg-emerald-500"
                      : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transform transition ${
                      formData.isActive
                        ? "translate-x-7"
                        : "translate-x-0"
                    }`}
                  />
                </button>

              </div>

              {/* ACTIONS */}
              <div className="mt-6 flex gap-3">

                <button
                  onClick={() => { setOpen(false); setIsEditMode(false); setEditingId(null); setFormData(() => ({ name: "", isActive: true })); }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200
                             text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>

                <button
                onClick={isEditMode ? handleUpdate : handleCreate}
                disabled={!formData.name.trim() || modalLoading}
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
                    Delete Tag
                    </h2>

                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                    This action cannot be undone. This will permanently delete the tag
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