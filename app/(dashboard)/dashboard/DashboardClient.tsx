"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getDashboardSummary } from "@/lib/dashboardService";
import { getTags } from "@/lib/tagService";
import { useRouter } from "next/navigation";
import { getTimeAgo } from "@/utils/time";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  const [tagsList, setTagsList] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const start = Date.now();

        const res = await getDashboardSummary();
        const elapsed = Date.now() - start;

        const delay = Math.max(500 - elapsed, 0);

        setTimeout(() => {
          setData(res.data);
          setLoading(false);
          setTimeout(() => setVisible(true), 50);
        }, delay);

      } catch (error) {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await getTags();
        setTagsList(res?.data || []);
      } catch (error) {
        // toast.error("Failed to load tags");
        }
    };
  
    fetchTags();
  }, []);

  return (
    <div className="space-y-8">

      {/* Greeting */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-6 w-64 bg-gray-200 rounded"></div>
          <div className="h-4 w-80 bg-gray-200 rounded"></div>
        </div>
      ) : (
        <div
          className={`transition-all duration-500 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
        >
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            Good afternoon, {user?.name} 👋
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            You created {data?.stats?.notesThisWeek || 0} notes this week. Keep writing ✨
          </p>
        </div>
      )}

      {/* Quick Actions */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse bg-white border border-gray-100 rounded-2xl p-5 space-y-3"
            >
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
              <div className="h-3 w-40 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className={`grid grid-cols-1 sm:grid-cols-3 gap-5 transition-all duration-500 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
        >
          {["New Note", "Pinned", "Tags"].map((item) => (
            <button
              key={item}
              onClick={() => {
                if (item === "New Note") {
                  router.push("/notes?create=true");
                } else if (item === "Pinned") {
                  router.push("/notes?isPinned=true");
                } else if (item === "Tags") {
                  router.push("/tags");
                }
              }}
              className="group p-5 bg-white border border-gray-100 rounded-2xl text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
            >
              <p className="font-semibold text-gray-900 group-hover:text-emerald-600 transition">
                {item}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {item === "New Note"
                  ? "Create a fresh note instantly"
                  : item === "Pinned"
                  ? "Access important notes"
                  : "Organize everything easily"}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Recent Notes */}
      <div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Notes
          </h2>

          <button
            onClick={() => router.push("/notes")}
            className="text-sm text-gray-400 hover:text-gray-600 transition"
          >
            View all
          </button>
        </div>

        {/* Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="animate-pulse bg-white border border-gray-100 rounded-2xl p-5 space-y-3"
              >
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && data?.recentNotes?.length === 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center">
            <p className="text-gray-500">No notes yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Start by creating your first note ✨
            </p>
          </div>
        )}

        {/* Notes */}
        {!loading && data?.recentNotes?.length > 0 && (
          <div
            className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5
            transition-all duration-500 ease-out
            ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
          >
            {data.recentNotes.map((note: any) => (
              <Link
                key={note._id}
                href={`/notes?noteId=${note._id}`}
                className="group bg-white border border-gray-100 rounded-2xl p-5 
                          hover:shadow-md hover:-translate-y-0.5 transition-all 
                          duration-200 cursor-pointer block"
              >

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

                <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600 transition">
                  {note.title}
                </h3>

                <p className="text-sm text-gray-500 mt-2 line-clamp-3 leading-relaxed">
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

                    {note.tagIds?.map((id: string) => {
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

              </Link>
            ))}
          </div>
        )}

      </div>

      {/* Tags */}
      <div>

        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Tags
        </h2>

        {loading && (
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
            ))}
          </div>
        )}

        {!loading && data?.tags?.length === 0 && (
          <p className="text-sm text-gray-400">
            No tags yet. Start organizing your notes.
          </p>
        )}

        {!loading && data?.tags?.length > 0 && (
          <div
            className={`flex flex-wrap gap-2 transition-all duration-500 ease-out
            ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
          >
            {data.tags.map((tag: any) => (
              <span
                key={tag._id}
                className="px-3 py-1.5 text-sm rounded-full cursor-pointer
                           bg-emerald-50 text-emerald-700
                           hover:bg-emerald-100 hover:text-emerald-800
                           transition"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

      </div>

    </div>
  );
}