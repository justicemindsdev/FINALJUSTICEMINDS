"use client";

import React, { useEffect, useRef } from "react";
import "quill/dist/quill.snow.css";

const TOOLBAR_OPTIONS = [
  ["bold", "italic", "underline", "strike"],
  ["blockquote", "code-block"],
  [{ header: 1 }, { header: 2 }],
  [{ list: "ordered" }, { list: "bullet" }],
  [{ script: "sub" }, { script: "super" }],
  [{ indent: "-1" }, { indent: "+1" }],
  [{ direction: "rtl" }],
  [{ size: ["small", false, "large", "huge"] }],
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ color: [] }, { background: [] }],
  [{ font: [] }],
  [{ align: [] }],
  ["image"],
  ["clean"],
];

const QuillEditor = ({ newMention, setNewMention }) => {
  const editorRef = useRef(null);
  const quillInstanceRef = useRef(null);
  const isInitializedRef = useRef(false);

  // Watch for newMention changes to reset editor
  useEffect(() => {
    if (quillInstanceRef.current && !newMention?.content) {
      quillInstanceRef.current.root.innerHTML = "";
    }
  }, [newMention]);

  useEffect(() => {
    if (!editorRef.current || isInitializedRef.current) return;

    const initializeQuill = async () => {
      try {
        const Quill = (await import("quill")).default;

        if (!editorRef.current.querySelector(".ql-editor")) {
          const editorContainer = document.createElement("div");
          editorRef.current.appendChild(editorContainer);

          quillInstanceRef.current = new Quill(editorContainer, {
            theme: "snow",
            modules: {
              toolbar: TOOLBAR_OPTIONS,
            },
          });

          if (newMention?.content) {
            quillInstanceRef.current.root.innerHTML = newMention.content;
          }

          quillInstanceRef.current.on("text-change", () => {
            const content = quillInstanceRef.current.root.innerHTML;
            setNewMention((prev) => ({
              ...prev,
              content,
            }));
          });

          isInitializedRef.current = true;
        }
      } catch (error) {
        console.error("Error initializing Quill:", error);
      }
    };

    initializeQuill();

    return () => {
      if (quillInstanceRef.current) {
        quillInstanceRef.current.off("text-change");
        const toolbar = editorRef.current?.querySelector(".ql-toolbar");
        const editor = editorRef.current?.querySelector(".ql-container");
        toolbar?.remove();
        editor?.remove();
        quillInstanceRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div
        ref={editorRef}
        className="min-h-[200px] border border-[#383838] rounded-lg"
      />
    </div>
  );
};

export default QuillEditor;
