import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { withAuth } from "@/lib/authUtils";
import { Progress } from "@/components/ui/progress";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Geist, Geist_Mono } from "next/font/google";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import Tiptap from "@/components/TipTap";
import QuillEditor from "@/components/QuillEditor";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
function CaseWorks({ user }) {
  const router = useRouter();
  const [cases, setCases] = useState([]);
  const [newCase, setNewCase] = useState({
    name: "",
    description: "",
    content: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(30);

  const [showContent, setShowContent] = useState(false);
  const [activeContent, setActiveContent] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editedCase, setEditedCase] = useState(null);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [coverImage, setCoverImage] = useState(null);
  const [imageUrl, setImageUrl] = useState("");

  const [imagePreview, setImagePreview] = useState(null);

  const isHTML = (str) => {
    const doc = new DOMParser().parseFromString(str, "text/html");
    return Array.from(doc.body.childNodes).some((node) => node.nodeType === 1);
  };

  const MarkdownContent = ({ content }) => (
    <div className="prose prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => (
            <h1
              className="text-white mt-6 mb-4 text-2xl font-bold border-b border-gray-700 pb-2"
              {...props}
            />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-white mt-5 mb-3 text-xl font-bold" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-white mt-4 mb-2 text-lg font-bold" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="text-gray-300 my-3 leading-relaxed" {...props} />
          ),
          ul: ({ node, ordered, ...props }) => (
            <ul className="list-disc list-inside my-3 space-y-1" {...props} />
          ),
          ol: ({ node, ordered, ...props }) => (
            <ol
              className="list-decimal list-inside my-3 space-y-1"
              {...props}
            />
          ),
          li: ({ node, ...props }) => (
            <li className="text-gray-300 ml-4" {...props} />
          ),
          a: ({ node, ...props }) => (
            <a
              className="text-blue-400 hover:text-blue-300 underline transition-colors"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-gray-700 pl-4 my-4 italic text-gray-400"
              {...props}
            />
          ),
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            return inline ? (
              <code
                className="bg-gray-800 px-1.5 py-0.5 rounded text-sm text-gray-200"
                {...props}
              >
                {children}
              </code>
            ) : (
              <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto my-4">
                <code
                  className={`language-${
                    match?.[1] || ""
                  } text-sm text-gray-200`}
                  {...props}
                >
                  {children}
                </code>
              </pre>
            );
          },
          table({ node, ...props }) {
            return (
              <div className="overflow-x-auto my-4">
                <table
                  className="min-w-full divide-y divide-gray-700 border border-gray-700"
                  {...props}
                />
              </div>
            );
          },
          th({ node, ...props }) {
            return (
              <th
                className="px-4 py-2 bg-gray-800 text-left text-sm font-semibold text-white border-b border-gray-700"
                {...props}
              />
            );
          },
          td({ node, ...props }) {
            return (
              <td
                className="px-4 py-2 text-sm text-gray-300 border-t border-gray-700"
                {...props}
              />
            );
          },
          img({ node, ...props }) {
            return (
              <img
                className="max-w-full h-auto rounded-lg my-4"
                {...props}
                loading="lazy"
              />
            );
          },
          hr({ node, ...props }) {
            return <hr className="my-6 border-gray-700" {...props} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );

  const handleImageUpload = async (e, caseId = null) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      // Create preview for immediate display
      setImagePreview(URL.createObjectURL(file));

      if (!caseId) {
        // If no caseId (new case), just store the file for later upload
        setCoverImage(file);
        return;
      }

      // If caseId exists (editing), upload immediately
      await uploadImageToSupabase(file, caseId);
    } catch (error) {
      console.error("Error handling image upload:", error);
      alert("Failed to handle image upload");
    }
  };

  const getFirstImageFromContent = (content) => {
    // Try to parse as HTML first
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "text/html");
    let firstImage = doc.querySelector("img");

    if (firstImage) {
      return firstImage.src;
    }

    // If no image found in HTML, try finding Markdown image syntax
    const markdownImageRegex = /!\[.*?\]\((.*?)\)/;
    const markdownMatch = content.match(markdownImageRegex);

    if (markdownMatch && markdownMatch[1]) {
      return markdownMatch[1];
    }

    return null;
  };

  // Function to upload image to Supabase storage
  const uploadImageToSupabase = async (file, caseId) => {
    try {
      if (!file || !caseId) {
        throw new Error("File and case ID are required");
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${caseId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from("caseworks")
        .upload(`${filePath}`, file, {
          upsert: true,
          onUploadProgress: (progress) => {
            const percent = (progress.loaded / progress.total) * 100;
            setUploadProgress(percent);
          },
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("caseworks")
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error("Failed to get public URL for uploaded file");
      }

      return filePath; // Return the file path instead of public URL
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  // Function to delete image from Supabase storage
  const deleteImageFromSupabase = async (caseId, imagePath) => {
    try {
      const { error } = await supabase.storage
        .from("caseworks")
        .remove([`${caseId}/${imagePath}`]);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting image:", error);
      throw error;
    }
  };

  const renderContent = (content) => {
    if (isHTML(content)) {
      return (
        <div
          dangerouslySetInnerHTML={{ __html: content }}
          className="prose lg:prose-md max-w-none"
        />
      );
    }
    return <MarkdownContent content={content} />;
  };

  useEffect(() => {
    const timer = setTimeout(() => setProgress(100), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetchCases();
  }, [user]);

  const fetchCases = async () => {
    try {
      setError(null);
      const { data, error: supabaseError } = await supabase
        .from("caseworks")
        .select("*")
        .eq("prof_id", user.id)
        .order("created_at", { ascending: false });

      if (supabaseError) throw supabaseError;
      setCases(data || []);
    } catch (error) {
      console.error("Error fetching cases:", error);
      setError("Failed to fetch cases. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);

      // First create the case
      const { data, error: supabaseError } = await supabase
        .from("caseworks")
        .insert([
          {
            title: newCase.name,
            description: newCase.description,
            content: newCase.content,
            prof_id: user.id,
          },
        ])
        .select();

      if (supabaseError) throw supabaseError;

      // Check if we have data and it contains at least one row
      if (!data || data.length === 0) {
        throw new Error("Failed to create case: No data returned");
      }

      const newCaseId = data[0].id;

      // If there's a cover image, upload it
      if (coverImage) {
        try {
          const imageUrl = await uploadImageToSupabase(coverImage, newCaseId);

          // Update the case with the image URL
          const { error: updateError } = await supabase
            .from("caseworks")
            .update({ cover_image_url: imageUrl })
            .eq("id", newCaseId);

          if (updateError) throw updateError;
        } catch (imageError) {
          console.error("Error uploading image:", imageError);
          // Even if image upload fails, the case was created
          setError(
            "Case created but image upload failed. Please try updating the image later."
          );
        }
      }

      // Reset form
      setNewCase({ name: "", description: "", content: "" });
      setCoverImage(null);
      setImagePreview(null);
      setUploadProgress(0);

      // Refresh the cases list
      await fetchCases();
    } catch (error) {
      console.error("Error creating case:", error);
      setError(error.message || "Failed to create case. Please try again.");
    }
  };

  const handleDelete = async (caseId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this case? This action cannot be undone."
      )
    ) {
      try {
        // First delete the image if it exists
        const caseToDelete = cases.find((c) => c.id === caseId);
        if (caseToDelete.cover_image_url) {
          await deleteImageFromSupabase(caseId, caseToDelete.cover_image_url);
        }

        // Then delete the case
        const { error } = await supabase
          .from("caseworks")
          .delete()
          .eq("id", caseId);

        if (error) throw error;

        setCases(cases.filter((c) => c.id !== caseId));
        setShowContent(false);
        setActiveContent(null);
      } catch (error) {
        console.error("Error deleting case:", error);
        alert("Failed to delete case. Please try again.");
      }
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from("caseworks")
        .update({
          title: editedCase.title,
          description: editedCase.description,
          content: editedCase.content,
        })
        .eq("id", editedCase.id);

      if (error) throw error;

      // Update UI
      fetchCases();
      setIsEditing(false);
      setActiveContent(editedCase);
    } catch (error) {
      console.error("Error updating case:", error);
      alert("Failed to update case. Please try again.");
    }
  };

  const startEditing = (case_) => {
    setIsEditing(true);
    setEditedCase({ ...case_ });
  };

  // Helper function to delete cookie
  const deleteCookie = (name) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  };

  const handleLogout = () => {
    // Clear localStorage
    localStorage.clear();

    // Clear auth cookie
    deleteCookie("access_token");

    // Redirect to home
    router.push("/");
  };

  if (loading) {
    return <Progress value={progress} className="w-full mt-10" />;
  }

  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0C0C0C] overflow-hidden`}
      style={{ height: "100vh" }}
    >
      <Navbar user={user} onLogout={handleLogout} />
      <ResizablePanelGroup
        direction="horizontal"
        className="w-full h-[calc(100vh-64px)] pt-16"
      >
        <ResizablePanel defaultSize={25}>
          <div className="h-full flex flex-col overflow-scroll">
            <div className="w-full px-6 py-4 ">
              {error && (
                <div
                  className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
                  role="alert"
                >
                  <span className="block sm:inline">{error}</span>
                </div>
              )}

              {/* Add New Case Form */}
              <div className="bg-[#1d1d1d] p-6 rounded-lg shadow-md mb-6 border border-[#2d2d2d]">
                <h2 className="text-xl font-semibold mb-4 text-white">
                  Add New Case
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-200">
                      Title
                    </label>
                    <input
                      type="text"
                      value={newCase.name}
                      onChange={(e) =>
                        setNewCase({ ...newCase, name: e.target.value })
                      }
                      className="mt-2 block w-full h-10 rounded-md px-3 bg-[#0e0e0e] border-[#3d3d3d] text-white shadow-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-200">
                      Description
                    </label>
                    <textarea
                      value={newCase.description}
                      onChange={(e) =>
                        setNewCase({ ...newCase, description: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md bg-[#0e0e0e] border-[#3d3d3d] text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      rows="3"
                    />
                  </div>
                  <div className="">
                    <label className="block text-sm font-medium text-gray-200">
                      Cover Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="mt-1 block w-full text-sm text-gray-400
          file:mr-4 file:py-2 file:px-4
          file:rounded-md file:border-0
          file:text-sm file:font-semibold
          file:bg-gray-700 file:text-white
          hover:file:bg-gray-600"
                    />
                    {imagePreview && (
                      <div className="mt-2">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full max-h-48 object-cover rounded-md"
                        />
                      </div>
                    )}
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <Progress
                        value={uploadProgress}
                        className="w-full mt-2"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-200">
                      Contents
                    </label>
                    {/* <textarea
                      value={newCase.contents}
                      onChange={(e) =>
                        setNewCase({ ...newCase, contents: e.target.value })
                      }
                      placeholder="Write your content in Markdown or HTML..."
                      className="mt-1 h-[150px] p-2 block w-full rounded-md bg-[#0e0e0e] border-[#3d3d3d] text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    /> */}

                    <QuillEditor
                      newMention={newCase}
                      setNewMention={setNewCase}
                    />
                    {/* <Tiptap /> */}
                  </div>
                  {newCase.content && (
                    <div className="">
                      <label className="text-sm text-gray-400">Preview</label>
                      <div className="w-full min-h-[200px] p-4 border border-gray-700 rounded overflow-auto bg-[#1a1a1a]">
                        {renderContent(newCase.content)}
                      </div>
                    </div>
                  )}
                  <button
                    type="submit"
                    className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Add Case
                  </button>
                  <button
                    type="reset"
                    onClick={() => {
                      setNewCase("");
                    }}
                    className="bg-gray-500 ml-2 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Clear
                  </button>
                </form>
              </div>
            </div>
          </div>
        </ResizablePanel>
        <ResizableHandle className="bg-[#1d1d1d]" />
        <ResizablePanel defaultSize={75}>
          <div className="h-full flex flex-col overflow-scroll">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-white">
                {activeContent === null ? "Your Cases" : activeContent.title}
              </h2>
              {showContent ? (
                <>
                  <div className="mt-2 border border-[#3d3d3d] p-4 rounded-md bg-[#2d2d2d]">
                    <div className="flex items-center gap-4 mb-4">
                      <button
                        onClick={() => {
                          setShowContent(false);
                          setActiveContent(null);
                          setIsEditing(false);
                        }}
                        className="flex justify-center items-center p-3 h-[30px] rounded-lg w-auto bg-[#1c1c1c]"
                      >
                        Back
                      </button>
                      <a
                        target="_blank"
                        href={`/caseworks/${activeContent.id}`}
                        className="border-[#3d3d3d] px-3 py-1 rounded-md bg-[#1c1c1c]"
                      >
                        Share
                      </a>
                      <button
                        onClick={() => startEditing(activeContent)}
                        className="border-[#3d3d3d] px-3 py-1 rounded-md bg-[#1c1c1c]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(activeContent.id)}
                        className="border-[#3d3d3d] px-3 py-1 rounded-md bg-[#1c1c1c] text-red-500"
                      >
                        Delete
                      </button>
                    </div>
                    {activeContent?.cover_image_url && (
                      <div className="w-full h-[300px] relative mb-2">
                        <img
                          src={
                            supabase.storage
                              .from("caseworks")
                              .getPublicUrl(activeContent?.cover_image_url).data
                              .publicUrl
                          }
                          alt={activeContent?.title}
                          className="w-full h-full object-cover rounded-md"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/placeholder-image.jpg"; // Add a placeholder image
                          }}
                        />
                      </div>
                    )}
                    {isEditing ? (
                      <form onSubmit={handleUpdate} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-200">
                            Title
                          </label>
                          <input
                            type="text"
                            value={editedCase.title}
                            onChange={(e) =>
                              setEditedCase({
                                ...editedCase,
                                title: e.target.value,
                              })
                            }
                            className="mt-2 block w-full h-10 rounded-md px-3 bg-[#0e0e0e] border-[#3d3d3d] text-white shadow-sm"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-200">
                            Description
                          </label>
                          <textarea
                            value={editedCase.description}
                            onChange={(e) =>
                              setEditedCase({
                                ...editedCase,
                                description: e.target.value,
                              })
                            }
                            className="mt-1 block w-full rounded-md bg-[#0e0e0e] border-[#3d3d3d] text-white shadow-sm"
                            rows="3"
                          />
                        </div>
                        <div className="">
                          <label className="block text-sm font-medium text-gray-200">
                            Cover Image
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handleImageUpload(e, editedCase.id)
                            }
                            className="mt-1 block w-full text-sm text-gray-400
          file:mr-4 file:py-2 file:px-4
          file:rounded-md file:border-0
          file:text-sm file:font-semibold
          file:bg-gray-700 file:text-white
          hover:file:bg-gray-600"
                          />
                          {(imagePreview || editedCase?.cover_image_url) && (
                            <div className="mt-2">
                              <img
                                src={
                                  imagePreview ||
                                  `https://tvecnfdqakrevzaeifpk.supabase.co/storage/v1/object/public/caseworks/${editedCase.cover_image_url}`
                                }
                                alt="Cover"
                                className="w-1/3 max-h-48 object-cover rounded-md"
                              />
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-200">
                            Contents
                          </label>
                          {/* <textarea
                            value={editedCase.content}
                            onChange={(e) =>
                              setEditedCase({
                                ...editedCase,
                                content: e.target.value,
                              })
                            }
                            className="mt-1 h-[150px] p-2 block w-full rounded-md bg-[#0e0e0e] border-[#3d3d3d] text-white shadow-sm"
                            required
                          /> */}
                          <QuillEditor
                            newMention={editedCase}
                            setNewMention={setEditedCase}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                          >
                            Save Changes
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      renderContent(activeContent.content)
                    )}
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-fr">
  {cases.map((case_) => {
    const coverImageUrl = case_?.cover_image_url
      ? supabase.storage
          .from("caseworks")
          .getPublicUrl(case_.cover_image_url).data.publicUrl
      : getFirstImageFromContent(case_.content);

    return (
      <button
        onClick={() => {
          setShowContent(true);
          setActiveContent(case_);
        }}
        key={case_.id}
        className="flex flex-col border border-[#3d3d3d] rounded-md bg-[#2d2d2d] overflow-hidden h-full"
      >
        <div className="aspect-video w-full relative p-1">
          <img
            src={coverImageUrl || "/placeholder-image.jpg"}
            alt={case_.title}
            className="w-full h-[200px] object-cover rounded-lg"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/placeholder-image.jpg";
            }}
          />
        </div>
        <div className="p-3 flex flex-col flex-grow text-left">
          <h3 className="font-semibold text-white text-lg mb-1">
            {case_.title}
          </h3>
          <p className="text-gray-300 flex-grow">
            {case_.description}
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Created: {new Date(case_.created_at).toLocaleDateString()}
          </p>
        </div>
      </button>
    );
  })}
  {cases.length === 0 && (
    <p className="text-gray-400 col-span-full text-center py-8">
      No cases found. Create your first case above!
    </p>
  )}
</div>
              )}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

export default withAuth(CaseWorks);
