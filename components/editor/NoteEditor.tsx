"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useState } from "react";

import {
  FaBold,
  FaItalic,
  FaListUl,
  FaHeading,
  FaUndo,
  FaRedo,
} from "react-icons/fa";

export default function NoteEditor({
  content,
  setContent,
}: {
  content: string;
  setContent: (value: string) => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const editor = useEditor({
    extensions: [StarterKit],
    content,
    immediatelyRender: false,

    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },

    editorProps: {
      attributes: {
        class:
          "min-h-[250px] p-4 focus:outline-none text-sm text-gray-700",
      },
    },
  });

  if (!mounted || !editor) {
    return (
      <div className="border border-gray-200 rounded-xl p-4 min-h-[250px] animate-pulse bg-gray-50" />
    );
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">

      {/* ================= TOOLBAR ================= */}
<div className="flex items-center gap-1 px-3 py-2 border-b bg-gray-50">

  {/* GROUP 1: TEXT STYLE */}
  <div className="flex items-center gap-1 pr-2 border-r border-gray-200">

    <button
      type="button"
      onClick={() => editor.chain().focus().toggleBold().run()}
      className={`p-2 rounded-lg hover:bg-gray-200 transition ${
        editor.isActive("bold") ? "bg-gray-200 text-emerald-600" : ""
      }`}
      title="Bold"
    >
      <FaBold size={14} />
    </button>

    <button
      type="button"
      onClick={() => editor.chain().focus().toggleItalic().run()}
      className={`p-2 rounded-lg hover:bg-gray-200 transition ${
        editor.isActive("italic") ? "bg-gray-200 text-emerald-600" : ""
      }`}
      title="Italic"
    >
      <FaItalic size={14} />
    </button>

  </div>

  {/* GROUP 2: STRUCTURE */}
  <div className="flex items-center gap-1 px-2 border-r border-gray-200">

    <button
      type="button"
      onClick={() =>
        editor.chain().focus().toggleHeading({ level: 2 }).run()
      }
      className={`p-2 rounded-lg hover:bg-gray-200 transition ${
        editor.isActive("heading", { level: 2 })
          ? "bg-gray-200 text-emerald-600"
          : ""
      }`}
      title="Heading"
    >
      <FaHeading size={14} />
    </button>

    <button
      type="button"
      onClick={() =>
        editor.chain().focus().toggleBulletList().run()
      }
      className={`p-2 rounded-lg hover:bg-gray-200 transition ${
        editor.isActive("bulletList")
          ? "bg-gray-200 text-emerald-600"
          : ""
      }`}
      title="Bullet List"
    >
      <FaListUl size={14} />
    </button>

  </div>

  {/* GROUP 3: HISTORY */}
  <div className="flex items-center gap-1 pl-2">

    <button
      type="button"
      onClick={() => editor.chain().focus().undo().run()}
      className="p-2 rounded-lg hover:bg-gray-200 transition"
      title="Undo"
    >
      <FaUndo size={14} />
    </button>

    <button
      type="button"
      onClick={() => editor.chain().focus().redo().run()}
      className="p-2 rounded-lg hover:bg-gray-200 transition"
      title="Redo"
    >
      <FaRedo size={14} />
    </button>

  </div>

</div>

      {/* ================= EDITOR ================= */}
      <EditorContent editor={editor} />
    </div>
  );
}