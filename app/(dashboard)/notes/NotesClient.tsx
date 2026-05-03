"use client";

import { addNote, deleteNote, getNotes, updateNote } from "@/lib/noteService";
import { getCategories } from "@/lib/categoryService";
import { getTags } from "@/lib/tagService";
import { useRef, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import NoteEditor from "@/components/editor/NoteEditor";
import Tagify from "@yaireo/tagify";
import { getTimeAgo } from "@/utils/time";
import { deleteAttachment, downloadAttachment, fetchAttachments, uploadAttachment } from "@/lib/attachmentService";

type Category = {
  _id: string;
  title: string;
};

type Note = {
  _id: string;
  title: string;
  content: string;
  category?:  Category | string;
  tagIds?: string[];
  isPinned: boolean;
  isArchived: boolean;
  createdAt: string;
};

export default function NotesPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [loading, setLoading] = useState(true);
    const [notes, setNotes] = useState<Note[]>([]);

    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [pagination, setPagination] = useState<any>(null);

    const [hydrated, setHydrated] = useState(false);
    const isSyncingFromUrl = useRef(false);

    const [openCreate, setOpenCreate] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [tagsList, setTagsList] = useState<any[]>([]);
    
    const titleRef = useRef<HTMLInputElement>(null);
    const tagInputRef = useRef<HTMLInputElement | null>(null);
    const tagifyRef = useRef<any>(null);

    const [editorLoading, setEditorLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

    const [filters, setFilters] = useState({
      isPinned: false,
      isArchived: false,
    });

    const filtersRef = useRef(filters);

    const [attachments, setAttachments] = useState<File[]>([]);
    const [existingAttachments, setExistingAttachments] = useState<any[]>([]);
    const [newFiles, setNewFiles] = useState<File[]>([]);
    const [attachmentsLoading, setAttachmentsLoading] = useState(false);

    useEffect(() => {
      filtersRef.current = filters;
    }, [filters]);

    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [openEdit, setOpenEdit] = useState(false);

    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [openDelete, setOpenDelete] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const pendingNoteIdRef = useRef<string | null>(null);

    /* ================= FORM STATE ================= */
    const [formData, setFormData] = useState({
      title: "",
      content: "",
      category: "" as string,
      tagIds: [] as string[],
      isPinned: false,
      isArchived: false,
    });

    /* =========================================================
      1. URL → STATE SYNC
    ========================================================= */
    useEffect(() => {
      isSyncingFromUrl.current = true;

      const searchValue = searchParams.get("search") || "";
      const createRequest = searchParams.get("create") === "true";
      const isPinned = searchParams.get("isPinned") === "true";
      const isArchived = searchParams.get("isArchived") === "true";
      const pageParam = Number(searchParams.get("page") || 1);
      const noteId = searchParams.get("noteId") || null;

      setSearch(searchValue);
      setOpenCreate(createRequest);
      setFilters({ isPinned, isArchived });
      setPage(pageParam);

      if (noteId) {
        pendingNoteIdRef.current = noteId;;
      }

      // Use queueMicrotask instead of setTimeout(0) — runs before next render
      queueMicrotask(() => {
        isSyncingFromUrl.current = false;
      });
    }, [searchParams]);

    /* =========================================================
      2. STATE → URL SYNC (FIXED LOOP SAFE)
    ========================================================= */
    useEffect(() => {
      if (isSyncingFromUrl.current) return;

      const params = new URLSearchParams();

      if (search.trim()) params.set("search", search);
      if (filters.isPinned) params.set("isPinned", "true");
      if (filters.isArchived) params.set("isArchived", "true");
      if (page > 1) params.set("page", String(page));

      const nextSearch = params.toString() ? `?${params.toString()}` : "";

      // Compare against current URL search params, not full URL
      if (nextSearch === window.location.search) return;

      router.replace(nextSearch || "/notes", { scroll: false });
    }, [search, filters.isPinned, filters.isArchived, page]);

    /* =========================================================
      3. FETCH NOTES (FIXED — NO OBJECT DEPENDENCY ISSUE)
    ========================================================= */
    const fetchNotes = async (searchValue: string, pageNumber: number) => {
      try {
        setLoading(true);

        const response = await getNotes(
          searchValue,
          pageNumber,
          limit,
          filtersRef.current
        );
        const fetchedNotes = response?.data || [];

        setNotes(fetchedNotes);
        setPagination(response?.pagination || null);

        if (pendingNoteIdRef.current) {
            const target = fetchedNotes.find((n: Note) => n._id === pendingNoteIdRef.current);

            if (target) {
                await handleEdit(target);
                pendingNoteIdRef.current = null; 

                // Clean noteId from URL
                const params = new URLSearchParams(window.location.search);
                params.delete("noteId");
                const clean = params.toString() ? `?${params.toString()}` : "/notes";
                router.replace(clean, { scroll: false });
            }
        }

      } catch (error: any) {
        toast.error(
          error.response?.data?.message ||
            "Something went wrong. Please try again!"
        );
      } finally {
        setLoading(false);
      }
    };

    /* =========================================================
      4. DEBOUNCED FETCH (STABLE)
    ========================================================= */
    useEffect(() => {
      const delay = setTimeout(() => {
        fetchNotes(search, page);
      }, 400);

      return () => clearTimeout(delay);
    }, [search, page, filters.isPinned, filters.isArchived]);

    /* =========================================================
      5. HYDRATION
    ========================================================= */
    useEffect(() => {
      setHydrated(true);
    }, []);

    /* =========================================================
      6. CATEGORY + TAGS
    ========================================================= */
    useEffect(() => {
      const fetchCategories = async () => {
        try {
          const res = await getCategories();
          setCategories(res?.data || []);
        } catch {
          toast.error("Failed to load categories");
        }
      };

      fetchCategories();
    }, []);

    useEffect(() => {
      const fetchTags = async () => {
        try {
          const res = await getTags();
          setTagsList(res?.data || []);
        } catch {
          toast.error("Failed to load tags");
        }
      };

      fetchTags();
    }, []);

    useEffect(() => {
      if (!openEdit && !openCreate) return;
      if (!tagInputRef.current) return;

      const tagify = new Tagify(tagInputRef.current, {
        whitelist: tagsList.map((t) => t.name),
        dropdown: {
          enabled: 1,
          fuzzySearch: true,
        },
        enforceWhitelist: false,
      });

      tagifyRef.current = tagify;

      // PREFILL TAGS (THIS IS WHAT YOU WERE MISSING)
      if (isEditMode && formData.tagIds.length > 0) {
        const selectedTags = formData.tagIds
          .map((id: string) => {
            const tag = tagsList.find((t) => t._id === id);
            return tag ? { value: tag.name } : null;
          })
          .filter(Boolean);

        tagify.addTags(selectedTags);
      }

      // ✅ Sync back to state
      tagify.on("change", (e: any) => {
        const values = e.detail.value
          ? JSON.parse(e.detail.value).map((t: any) => t.value)
          : [];

        const ids = values
          .map((name: string) => {
            const tag = tagsList.find((t) => t.name === name);
            return tag ? tag._id : null;
          })
          .filter(Boolean);

        setFormData((prev) => ({
          ...prev,
          tagIds: ids,
        }));
      });

      return () => {
        tagify.destroy();
      };
    }, [openEdit, openCreate, tagsList]);

    const createNote = async () => {

      if (!formData.title.trim()) {
        setFieldErrors({ title: "Title is required" });
        return;
      }

      if (!formData.content || formData.content === "<p></p>") {
        setFieldErrors((prev) => ({
          ...prev,
          content: "Content is required",
        }));
        return;
      }

      try {
        setEditorLoading(true);
        setFieldErrors({});

        const response = await addNote(formData);
        const noteId = response?.data?._id;

        if (attachments.length > 0 && noteId) {
          try {
            const formDataFiles = new FormData();
            attachments.forEach((file) => formDataFiles.append("files", file));
            await uploadAttachment(noteId, formDataFiles);
          } catch {
            // Note saved successfully, attachments failed
            toast.warning("Note saved but attachments failed to upload. Try adding them from edit.");
          }
        }

        toast.success(response?.message || "Note added successfully");

        setOpenCreate(false);
        setAttachments([]);
        setFormData({    
          title: "",
          content: "",
          category: "" as string,   
          tagIds: [] as string[],  
          isPinned: false,
          isArchived: false
        });

        fetchNotes(search, page);

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
        setEditorLoading(false);
      }
    };

    const handleEdit = async (note: any) => {
      try {
        setIsEditMode(true);
        setEditingId(note._id);

        setFormData({
          title: note?.title,
          content: note?.content?.replace(/<[^>]+>/g, ""),
          category: note?.category?._id,
          tagIds: note.tagIds || [],
          isPinned: note?.isPinned,
          isArchived: note?.isArchived,
        });

        setAttachmentsLoading(true);
        setOpenEdit(true);

        const res = await fetchAttachments(note._id);
        setExistingAttachments(res?.data || []); 

      } catch (error: any) {
        toast.error("Something went wrong. Please try again!");
      } finally {
        setAttachmentsLoading(false);
      }
    };

    const handleUpdate = async () => {
      const noteId = editingId;

      if (!noteId) {
        return;
      }

      if (!formData.title.trim()) {
        setFieldErrors({ title: "Title is required" });
        return;
      }

      if (!formData.content || formData.content === "<p></p>") {
        setFieldErrors((prev) => ({
          ...prev,
          content: "Content is required",
        }));
        return;
      }

      try {
        setEditorLoading(true);
        setFieldErrors({});

        const response = await updateNote(noteId, formData);

        if (newFiles.length > 0) {
            try {
                const formDataFiles = new FormData();
                newFiles.forEach((file) => formDataFiles.append("files", file));
                await uploadAttachment(noteId, formDataFiles);
            } catch {
                toast.warning("Note updated but attachments failed to upload. Try again from edit.");
            }
        }

        toast.success(response?.message || "Note updated successfully");

        setOpenEdit(false);
        setFormData({    
          title: "",
          content: "",
          category: "" as string,   
          tagIds: [] as string[],  
          isPinned: false,
          isArchived: false
        });
        setExistingAttachments([]);
        setNewFiles([]);

        fetchNotes(search, page);

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
        setEditorLoading(false);
      }
    };

    const handleDelete = async () => {
      
      if(!deletingId) return;

      try {
          setDeleteLoading(true);
        
          const response = await deleteNote(deletingId);
        
          toast.success(response.message || "Note deleted successfully");
        
          fetchNotes(search, page);
        
          resetDeleteModal();
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "Something went wrong. Please try again!");
      } finally {
        setDeleteLoading(false);
      }
    };

    const resetDeleteModal = () => {
      setOpenDelete(false);
      setDeletingId(null);
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files || []);
      
      // Max 5 files total
      const combined = [...attachments, ...selected].slice(0, 5);
      setAttachments(combined);

      // Reset input so same file can be re-selected if removed
      e.target.value = "";
    };

    const removeAttachment = (index: number) => {
      setAttachments((prev) => prev.filter((_, i) => i !== index));
    };

    const handleDownload = async (attachmentId: string, fileName: string) => {
      try {
        await downloadAttachment(attachmentId, fileName);
        toast.success("Download started");
      } catch (error: any) {
        toast.error("Failed to download attachment");
      }
    };

    const handleDeleteAttachment = async (attachmentId: string) => {
      if (!editingId) return;

      try {
        await deleteAttachment(editingId, attachmentId);
        
        // Remove from UI without refetching
        setExistingAttachments((prev) => prev.filter((a) => a._id !== attachmentId));
        
        toast.success("Attachment deleted successfully");
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "Failed to delete attachment");
      }
    };

  return (
    <div className="space-y-8">

      {/* ================= HEADER ================= */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Notes</h1>

          <p className="text-sm text-gray-500 mt-1">
            Capture ideas, thoughts and everything in between
          </p>

          <div className="mt-2 text-xs text-gray-400">
            {loading ? "Loading..." : `${notes?.length || 0} notes`}
          </div>
        </div>

        <button
          onClick={() => setOpenCreate(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600
                     text-white text-sm font-medium shadow-sm hover:shadow-md transition cursor-pointer"
        >
          + New Note
        </button>
      </div>

      {/* ================= FILTERS ================= */}
      <div className="flex items-center gap-3">

        {/* PINNED FILTER */}
        <button
          onClick={() => {
            setFilters((prev) => ({
              ...prev,
              isPinned: !prev.isPinned,
            }));
            setPage(1);
          }}
          className={`px-4 py-2 rounded-xl text-sm font-medium border transition cursor-pointer
            ${
              filters.isPinned
                ? "bg-emerald-500 text-white border-emerald-500"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
        >
          📌 Pinned
        </button>

        {/* ARCHIVED FILTER */}
        <button
          onClick={() => {
            setFilters((prev) => ({
              ...prev,
              isArchived: !prev.isArchived,
            }));
            setPage(1);
          }}
          className={`px-4 py-2 rounded-xl text-sm font-medium border transition cursor-pointer
            ${
              filters.isArchived
                ? "bg-emerald-500 text-white border-emerald-500"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
        >
          🗄 Archived
        </button>

        {/* CLEAR FILTERS */}
        {(filters.isPinned || filters.isArchived) && (
          <button
            onClick={() => {
              setFilters({ isPinned: false, isArchived: false });
              setPage(1);
            }}
            className="text-xs text-gray-400 hover:text-gray-600 transition"
          >
            Clear
          </button>
        )}

      </div>

      {/* ================= LOADING ================= */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white border border-gray-100 rounded-2xl p-5 animate-pulse"
            >
              <div className="h-4 w-40 bg-gray-200 rounded mb-4" />
              <div className="space-y-2">
                <div className="h-3 w-full bg-gray-200 rounded" />
                <div className="h-3 w-full bg-gray-200 rounded" />
                <div className="h-3 w-2/3 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= EMPTY ================= */}
      {!loading && (notes?.length || 0) === 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900">
            No notes yet
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Start by creating your first note ✨
          </p>
        </div>
      )}

      {/* ================= NOTES GRID ================= */}
      {!loading && (notes?.length || 0) > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">

          {notes.map((note) => (
            <div
              key={note._id}
              onClick={() => {
                handleEdit(note);
              }}
              className="group bg-white border border-gray-100 rounded-2xl p-5
                         hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer"
            >

            {/* ACTIONS (TOP RIGHT) */}
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition flex gap-2">

              {/* DELETE */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeletingId(note._id);
                  setOpenDelete(true); 
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                title="Delete"
              >
                🗑
              </button>

            </div>

            {/* STATUS (PIN + ARCHIVE) */}
            <div className="flex gap-2 mb-2 h-5">

              {note.isPinned && (
                <span title="Pinned" className="text-amber-500 text-sm">
                  📌
                </span>
              )}

              {note.isArchived && (
                <span title="Archived" className="text-gray-400 text-sm">
                  🗄
                </span>
              )}

            </div>
              
              <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">
                {note.title}
              </h3>

              <p className="mt-2 text-sm text-gray-500 line-clamp-3">
                {note.content.replace(/<[^>]+>/g, "")}
              </p>

              <div className="mt-4 flex items-center justify-between">

                {/* LEFT SIDE: CATEGORY + TAGS */}
                <div className="flex flex-wrap gap-2">

                  {typeof note.category === "object" && note.category?.title && (
                    <span className="px-2 py-1 text-xs rounded-lg bg-emerald-50 text-emerald-600">
                      {note?.category?.title}
                    </span>
                  )}

                  {note.tagIds?.map((id) => {
                    const tag = tagsList.find((t) => t._id === id);

                    if (!tag) return null;

                    return (
                      <span
                        key={id}
                        className="px-2 py-1 text-xs rounded-lg bg-gray-100 text-gray-600"
                      >
                        #{tag.name}
                      </span>
                    );
                  })}

                </div>

                {/* RIGHT SIDE: TIME */}
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {getTimeAgo(note.createdAt)}
                </span>

              </div>
            </div>
          ))}

        </div>
      )}

      {/* ================= PAGINATION ================= */}
      {!loading && pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">

          {/* LEFT INFO */}
          <div className="text-xs text-gray-500">
            Page {pagination.page} of {pagination.totalPages}
          </div>

          {/* CONTROLS */}
          <div className="flex items-center gap-2">

            {/* PREVIOUS */}
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className={`px-3 py-1.5 text-sm rounded-lg border transition
                ${page === 1
                  ? "text-gray-300 border-gray-200 cursor-not-allowed"
                  : "text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
            >
              Prev
            </button>

            {/* PAGE NUMBERS */}
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .slice(
                Math.max(0, page - 2),
                Math.min(pagination.totalPages, page + 1)
              )
              .map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition
                    ${
                      page === p
                        ? "bg-emerald-500 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                >
                  {p}
                </button>
              ))}

            {/* NEXT */}
            <button
              onClick={() =>
                setPage((prev) =>
                  Math.min(prev + 1, pagination.totalPages)
                )
              }
              disabled={page === pagination.totalPages}
              className={`px-3 py-1.5 text-sm rounded-lg border transition
                ${page === pagination.totalPages
                  ? "text-gray-300 border-gray-200 cursor-not-allowed"
                  : "text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
            >
              Next
            </button>

          </div>
        </div>
      )}

      {/* ================= CREATE DRAWER ================= */}
      {openCreate && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#f9fafb]">

          {/* TOP BAR */}
          <div className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6">

            <h2 className="font-semibold text-gray-900">
              Create Note
            </h2>

            <div className="flex items-center gap-3">

              <button
                onClick={() => {setOpenCreate(false); setFieldErrors({}); setAttachments([]); setFormData({ title: "", content: "", category: "" as string, tagIds: [] as string[], isPinned: false, isArchived: false}); }}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={createNote}
                disabled={editorLoading}
                className={`px-5 py-2 rounded-xl text-white text-sm font-medium transition shadow-sm cursor-pointer
                  ${editorLoading
                    ? "bg-emerald-400 cursor-not-allowed"
                    : "bg-emerald-500 hover:bg-emerald-600"
                  }`}
              >
                {editorLoading ? "Saving..." : "Save Note"}
              </button>

            </div>

          </div>

          {/* BODY */}
          <div className="flex-1 flex overflow-hidden">

          {/* LEFT - WRITING AREA */}
          <div className="flex-1 p-10 overflow-y-auto space-y-6">

            {/* TITLE */}
            <div>
              <input
                ref={titleRef}
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });

                  // clear error on typing
                  if (fieldErrors.title) {
                    setFieldErrors((prev) => {
                      const updated = { ...prev };
                      delete updated.title;
                      return updated;
                    });
                  }
                }}
                placeholder="Untitled note..."
                className={`w-full text-3xl font-semibold bg-transparent outline-none
                            pb-2 border-b transition
                            ${
                              fieldErrors.title
                                ? "border-red-400 focus:border-red-500"
                                : "border-transparent focus:border-emerald-500"
                            }`}
              />

              {fieldErrors.title && (
                <p className="mt-1 text-xs text-red-500">
                  {fieldErrors.title}
                </p>
              )}
            </div>

            {/* EDITOR */}
            <div>
              <div
                className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition
                  ${
                    fieldErrors.content
                      ? "border-red-400 focus-within:border-red-500"
                      : "border-gray-100 focus-within:border-emerald-500"
                  }`}
              >
                <NoteEditor
                  content={formData.content}
                  setContent={(value: string) => {
                    setFormData({ ...formData, content: value });

                    // clear error on typing
                    if (fieldErrors.content) {
                      setFieldErrors((prev) => {
                        const updated = { ...prev };
                        delete updated.content;
                        return updated;
                      });
                    }
                  }}
                />
              </div>

              {fieldErrors.content && (
                <p className="mt-2 text-xs text-red-500">
                  {fieldErrors.content}
                </p>
              )}
            </div>

          </div>

            {/* RIGHT PANEL */}
            <div className="w-[380px] bg-white border-l border-gray-100 p-6 space-y-5">

              {/* CARD: CATEGORY */}
              <div className="rounded-xl border border-gray-100 p-4 space-y-2">

                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Category
                </h3>

                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200
                            focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500
                            outline-none text-sm transition"
                >
                  <option value="">No category</option>
                  {categories.map((cat: any) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.title}
                    </option>
                  ))}
                </select>

              </div>

              {/* CARD: TAGS */}
              <div className="rounded-xl border border-gray-100 p-4 space-y-2">

                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Tags
                </h3>

                <input
                  ref={tagInputRef}
                  placeholder="Type and press enter..."
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200
                            focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500
                            outline-none text-sm transition"
                />

              </div>

              {/* CARD: ATTACHMENTS */}
              <div className="rounded-xl border border-gray-100 p-4 space-y-3">

                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Attachments
                </h3>

                {/* Only show input if under 5 files */}
                {attachments.length < 5 && (
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full text-sm text-gray-500
                              file:mr-3 file:py-1.5 file:px-3
                              file:rounded-lg file:border-0
                              file:text-xs file:font-medium
                              file:bg-emerald-50 file:text-emerald-600
                              hover:file:bg-emerald-100 cursor-pointer"
                  />
                )}

                <p className="text-xs text-gray-400">
                  {attachments.length}/5 images selected
                </p>

                {/* Preview */}
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200"
                      >
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />

                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="absolute top-1 right-1 text-xs bg-black/60 text-white rounded-full w-4 h-4 flex items-center justify-center hover:bg-black/80 transition"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

              </div>

              {/* CARD: OPTIONS */}
              <div className="rounded-xl border border-gray-100 p-4 space-y-4">

                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Options
                </h3>

                <label className="flex items-center justify-between text-sm text-gray-700">
                  <span>Pin note</span>
                  <input
                    type="checkbox"
                    checked={formData.isPinned}
                    onChange={(e) =>
                      setFormData({ ...formData, isPinned: e.target.checked })
                    }
                    className="accent-emerald-500"
                  />
                </label>

                <label className="flex items-center justify-between text-sm text-gray-700">
                  <span>Archive</span>
                  <input
                    type="checkbox"
                    checked={formData.isArchived}
                    onChange={(e) =>
                      setFormData({ ...formData, isArchived: e.target.checked })
                    }
                    className="accent-emerald-500"
                  />
                </label>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* ================= EDIT DRAWER ================= */}
      {openEdit && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#f9fafb]">

          {/* TOP BAR */}
          <div className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6">

            <h2 className="font-semibold text-gray-900">
              Edit Note
            </h2>

            <div className="flex items-center gap-3">

              <button
                onClick={() => {setOpenEdit(false); setFieldErrors({}); setExistingAttachments([]); setNewFiles([]); setFormData({ title: "", content: "", category: "" as string, tagIds: [] as string[], isPinned: false, isArchived: false}); }}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleUpdate}
                disabled={editorLoading}
                className={`px-5 py-2 rounded-xl text-white text-sm font-medium transition shadow-sm cursor-pointer
                  ${editorLoading
                    ? "bg-emerald-400 cursor-not-allowed"
                    : "bg-emerald-500 hover:bg-emerald-600"
                  }`}
              >
                {editorLoading ? "Updating..." : "Update Note"}
              </button>

            </div>

          </div>

          {/* BODY */}
          <div className="flex-1 flex overflow-hidden">

          {/* LEFT - WRITING AREA */}
          <div className="flex-1 p-10 overflow-y-auto space-y-6">

            {/* TITLE */}
            <div>
              <input
                ref={titleRef}
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });

                  // clear error on typing
                  if (fieldErrors.title) {
                    setFieldErrors((prev) => {
                      const updated = { ...prev };
                      delete updated.title;
                      return updated;
                    });
                  }
                }}
                placeholder="Untitled note..."
                className={`w-full text-3xl font-semibold bg-transparent outline-none
                            pb-2 border-b transition
                            ${
                              fieldErrors.title
                                ? "border-red-400 focus:border-red-500"
                                : "border-transparent focus:border-emerald-500"
                            }`}
              />

              {fieldErrors.title && (
                <p className="mt-1 text-xs text-red-500">
                  {fieldErrors.title}
                </p>
              )}
            </div>

            {/* EDITOR */}
            <div>
              <div
                className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition
                  ${
                    fieldErrors.content
                      ? "border-red-400 focus-within:border-red-500"
                      : "border-gray-100 focus-within:border-emerald-500"
                  }`}
              >
                <NoteEditor
                  content={formData.content}
                  setContent={(value: string) => {
                    setFormData({ ...formData, content: value });

                    // clear error on typing
                    if (fieldErrors.content) {
                      setFieldErrors((prev) => {
                        const updated = { ...prev };
                        delete updated.content;
                        return updated;
                      });
                    }
                  }}
                />
              </div>

              {fieldErrors.content && (
                <p className="mt-2 text-xs text-red-500">
                  {fieldErrors.content}
                </p>
              )}
            </div>

          </div>

            {/* RIGHT PANEL */}
            <div className="w-[380px] bg-white border-l border-gray-100 p-6 space-y-5">

              {/* CARD: CATEGORY */}
              <div className="rounded-xl border border-gray-100 p-4 space-y-2">

                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Category
                </h3>

                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200
                            focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500
                            outline-none text-sm transition"
                >
                  <option value="">No category</option>
                  {categories.map((cat: any) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.title}
                    </option>
                  ))}
                </select>

              </div>

              {/* CARD: TAGS */}
              <div className="rounded-xl border border-gray-100 p-4 space-y-2">

                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Tags
                </h3>

                <input
                  ref={tagInputRef}
                  placeholder="Type and press enter..."
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200
                            focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500
                            outline-none text-sm transition"
                />

              </div>

              {/* CARD: ATTACHMENTS */}
              <div className="rounded-xl border border-gray-100 p-4 space-y-3">

                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Attachments
                </h3>

                {/* LOADING */}
                {attachmentsLoading && (
                  <p className="text-xs text-gray-400">Loading attachments...</p>
                )}

                {/* EXISTING ATTACHMENTS */}
                {!attachmentsLoading && existingAttachments.length > 0 && (
                  <div className="space-y-2">
                  {existingAttachments.map((attachment: any) => (
                    <div
                      key={attachment._id}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 border border-gray-100"
                    >

                      {/* FILE INFO */}
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-gray-400 text-sm">📎</span>
                        <span className="text-xs text-gray-700 truncate">
                          {attachment.fileName}
                        </span>
                      </div>

                      {/* ACTIONS */}
                      <div className="flex items-center gap-2 shrink-0">

                        {/* SIZE */}
                        <span className="text-xs text-gray-400">
                          {(attachment.size / 1024).toFixed(1)}KB
                        </span>

                        {/* DOWNLOAD */}
                        <button
                          type="button"
                          onClick={() => handleDownload(attachment._id, attachment.fileName)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 transition"
                          title="Download"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M12 3v12m0 0l-4-4m4 4l4-4M3 17v2a2 2 0 002 2h14a2 2 0 002-2v-2" />
                          </svg>
                        </button>

                        {/* DELETE */}
                        <button
                          type="button"
                          onClick={() => handleDeleteAttachment(attachment._id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                          </svg>
                        </button>

                      </div>

                    </div>
                  ))}
                  </div>
                )}

                {/* EMPTY */}
                {!attachmentsLoading && existingAttachments.length === 0 && (
                  <p className="text-xs text-gray-400">No attachments yet</p>
                )}

                {/* ADD NEW FILES */}
                {(existingAttachments.length + newFiles.length) < 5 && (
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                    onChange={(e) => {
                      const selected = Array.from(e.target.files || []);
                      const combined = [...newFiles, ...selected].slice(0, 5 - existingAttachments.length);
                      setNewFiles(combined);
                      e.target.value = "";
                    }}
                    className="w-full text-sm text-gray-500
                              file:mr-3 file:py-1.5 file:px-3
                              file:rounded-lg file:border-0
                              file:text-xs file:font-medium
                              file:bg-emerald-50 file:text-emerald-600
                              hover:file:bg-emerald-100 cursor-pointer"
                  />
                )}

                {/* NEW FILE PREVIEWS */}
                {newFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {newFiles.map((file, index) => (
                      <div
                        key={index}
                        className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200"
                      >
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setNewFiles((prev) => prev.filter((_, i) => i !== index))}
                          className="absolute top-1 right-1 text-xs bg-black/60 text-white rounded-full w-4 h-4 flex items-center justify-center hover:bg-black/80 transition"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs text-gray-400">
                  {existingAttachments.length + newFiles.length}/5 attachments
                </p>

              </div>

              {/* CARD: OPTIONS */}
              <div className="rounded-xl border border-gray-100 p-4 space-y-4">

                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Options
                </h3>

                <label className="flex items-center justify-between text-sm text-gray-700">
                  <span>Pin note</span>
                  <input
                    type="checkbox"
                    checked={formData.isPinned}
                    onChange={(e) =>
                      setFormData({ ...formData, isPinned: e.target.checked })
                    }
                    className="accent-emerald-500"
                  />
                </label>

                <label className="flex items-center justify-between text-sm text-gray-700">
                  <span>Archive</span>
                  <input
                    type="checkbox"
                    checked={formData.isArchived}
                    onChange={(e) =>
                      setFormData({ ...formData, isArchived: e.target.checked })
                    }
                    className="accent-emerald-500"
                  />
                </label>

              </div>

            </div>

          </div>

        </div>
      )}

      {openDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">

            {/* backdrop */}
            <div
            onClick={() => {
                setOpenDelete(false);
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
                    Delete Note
                    </h2>

                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                    This action cannot be undone. This will permanently delete the note
                    and remove all its contents.
                    </p>
                </div>

                </div>

                {/* subtle divider */}
                <div className="mt-5 border-t border-gray-100" />

                {/* Actions */}
                <div className="mt-5 flex gap-3">

                <button
                    onClick={() => {
                    setOpenDelete(false);
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