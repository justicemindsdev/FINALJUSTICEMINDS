// Previous imports remain the same...
import { useState, useEffect } from "react";
import axios from "axios";
import EmailContent from "./EmailContent";
import ThreadMessage from "./ThreadMessage";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { supabase } from "@/lib/supabase";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import FileUpload from "./FileUpload";
import QuillEditor from "./QuillEditor";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
/**
 * Gets the appropriate icon class based on file type
 * @param {string} mimeType - MIME type of the file
 * @param {string} filename - Name of the file
 * @returns {string} Icon class name
 */
const getFileIcon = (mimeType, filename) => {
  const extension = filename.split(".").pop().toLowerCase();

  if (mimeType.includes("pdf")) return "📄";
  if (mimeType.includes("word") || extension === "doc" || extension === "docx")
    return "📝";
  if (
    mimeType.includes("spreadsheet") ||
    extension === "xls" ||
    extension === "xlsx"
  )
    return "📊";
  if (
    mimeType.includes("presentation") ||
    extension === "ppt" ||
    extension === "pptx"
  )
    return "📑";
  if (mimeType.includes("image")) return "🖼️";
  if (
    mimeType.includes("zip") ||
    mimeType.includes("rar") ||
    mimeType.includes("7z")
  )
    return "📦";
  if (mimeType.includes("audio")) return "🎵";
  if (mimeType.includes("video")) return "🎥";
  return "📎";
};

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 * 1024 * 1024)
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
};

export default function EmailList({
  em,
  title,
  emails,
  receivedemails,
  sentemails,
  rToken,
  sToken,
  lmremails,
  lmsemails,
  isPublic,
}) {
  // Previous state declarations remain the same...
  const [expandedEmails, setExpandedEmails] = useState(new Set());
  const [emailDetails, setEmailDetails] = useState({});
  const [mktoggle, setMktoggle] = useState(false);
  const [loading, setLoading] = useState({});
  const [mentions, setMentions] = useState([]);
  const [activeTab, setActiveTab] = useState("received");
  const [loadingAttachments, setLoadingAttachments] = useState({});
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [attachmentContent, setAttachmentContent] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [allAttachments, setAllAttachments] = useState([]);
  const [allMentions, setAllMentions] = useState([]);
  const [newMention, setNewMention] = useState({
    for: "",
    title: "",
    docs: [],
    content: "",
  });

  // New state for pagination and loading
  const [displayedEmails, setDisplayedEmails] = useState(1000);
  const [displayedAttachments, setDisplayedAttachments] = useState(3); // Initially show 3 attachments
  const [displayedEmailAttachments, setDisplayedEmailAttachments] = useState(
    {}
  ); // Track displayed attachments per email
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingAllAttachments, setLoadingAllAttachments] = useState(false);
  const [hasMoreEmails, setHasMoreEmails] = useState(true);
  const [hasMoreAttachments, setHasMoreAttachments] = useState(true);

  const handleContentChange = (htmlContent) => {
    setNewMention((prev) => ({
      ...prev,
      content: htmlContent, // Update only the content field
    }));
  };

  // Initialize displayed attachments count for each email
  useEffect(() => {
    const initialDisplayed = {};
    emails?.forEach((email) => {
      initialDisplayed[email.id] = 3; // Show 3 attachments initially per email
    });
    setDisplayedEmailAttachments(initialDisplayed);
  }, [emails]);

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

  // Fetch email details and update attachments list
  useEffect(() => {
    if (activeTab === "attachments") {
      const fetchAllAttachments = async () => {
        setLoadingAllAttachments(true);
        const accessToken = localStorage.getItem("access_token");
        const attachmentsList = [];

        try {
          for (const email of emails) {
            try {
              const response = await axios.get(
                `https://gmail.googleapis.com/gmail/v1/users/me/messages/${email.id}`,
                {
                  headers: { Authorization: `Bearer ${accessToken}` },
                  params: { format: "full" },
                }
              );

              const attachments = getAttachments(response.data.payload);
              if (attachments.length > 0) {
                attachmentsList.push({
                  emailId: email.id,
                  subject: email.subject,
                  date: email.date,
                  attachments,
                });
              }
            } catch (error) {
              console.error("Failed to fetch email details:", error);
            }
          }

          setAllAttachments(attachmentsList);
          setHasMoreAttachments(attachmentsList.length > displayedAttachments);
        } catch (error) {
          console.error("Failed to fetch attachments:", error);
        } finally {
          setLoadingAllAttachments(false);
        }
      };

      fetchAllAttachments();
    } else if (activeTab === "mentions") {
      const fetchmentions = async () => {
        try {
          const { data, error } = await supabase
            .from("dashboard_email_content")
            .select("*")
            .eq("for", em);

          if (data) {
            console.log(data);
            setMentions(data);
          } else {
            console.log(error);
          }
        } catch (error) {
          console.log(error);
        }
      };

      fetchmentions();
    }
  }, [activeTab, emails]);

  /**
   * Fetches attachment data from Gmail API
   * @param {string} messageId - Email message ID
   * @param {string} attachmentId - Attachment ID
   * @param {string} accessToken - Gmail API access token
   * @returns {Promise<string>} Base64 encoded attachment data
   */
  const fetchAttachmentData = async (messageId, attachmentId, accessToken) => {
    try {
      const response = await axios.get(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachmentId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          validateStatus: (status) => status < 500,
        }
      );

      if (!response.data || !response.data.data) {
        throw new Error("Invalid attachment data received");
      }

      return response.data.data
        .replace(/-/g, "+")
        .replace(/_/g, "/")
        .replace(/\s/g, "");
    } catch (error) {
      console.error("Failed to fetch attachment:", error);
      throw error;
    }
  };

  const deleteMention = async (mentionId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this case? This action cannot be undone."
      )
    )
      try {
        const { error } = await supabase
          .from("dashboard_email_content")
          .delete()
          .eq("uuid", mentionId);

        if (error) throw error;

        // Remove associated files from storage
        const mention = mentions.find((m) => m.uuid === mentionId);
        if (mention?.docs?.length) {
          for (const doc of mention.docs) {
            const filePath = doc.url.split("/").pop();
            await supabase.storage.from("DashboardData").remove([filePath]);
          }
        }

        // Update local state
        setMentions(mentions.filter((m) => m.uuid !== mentionId));
      } catch (error) {
        console.error("Error deleting mention:", error);
      }
  };

  // Previous functions remain the same...
  const previewAttachment = async (messageId, attachment) => {
    const attachmentKey = `${messageId}-${attachment.attachmentId}`;
    setLoadingAttachments((prev) => ({ ...prev, [attachmentKey]: true }));
    setSelectedAttachment(attachment);
    setDialogOpen(true);

    try {
      const accessToken = localStorage.getItem("access_token");
      const base64Data = await fetchAttachmentData(
        messageId,
        attachment.attachmentId,
        accessToken
      );

      // Handle different MIME types
      if (attachment.mimeType.startsWith("image/")) {
        setAttachmentContent({
          type: "image",
          data: `data:${attachment.mimeType};base64,${base64Data}`,
        });
      } else if (attachment.mimeType === "application/pdf") {
        // For PDFs, create a blob URL
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);

        setAttachmentContent({
          type: "pdf",
          data: url,
        });
      } else if (attachment.mimeType.startsWith("text/")) {
        // For text files, decode the content
        const decodedText = atob(base64Data);
        setAttachmentContent({
          type: "text",
          data: decodedText,
        });
      } else if (attachment.mimeType.startsWith("video/")) {
        // For video files
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: attachment.mimeType });
        const url = URL.createObjectURL(blob);

        setAttachmentContent({
          type: "video",
          data: url,
        });
      } else {
        // For other types, create a downloadable blob
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: attachment.mimeType });
        const url = URL.createObjectURL(blob);

        setAttachmentContent({
          type: "other",
          data: url,
        });
      }
    } catch (error) {
      console.error("Failed to load attachment:", error);
      setAttachmentContent({
        type: "error",
        data: `Failed to load attachment: ${error.message}`,
      });
    } finally {
      setLoadingAttachments((prev) => ({ ...prev, [attachmentKey]: false }));
    }
  };

  // Rest of the component implementation remains the same...
  const processEmailContent = (payload) => {
    if (!payload) return { content: "", inlineImages: {} };

    let htmlContent = "";
    let textContent = "";
    const inlineImages = {};

    const processPayloadPart = (part) => {
      // Handle inline images
      if (part.mimeType?.startsWith("image/") && part.headers) {
        const contentId = part.headers.find(
          (h) => h.name.toLowerCase() === "content-id"
        )?.value;
        if (contentId) {
          const cid = contentId.replace(/[<>]/g, "");
          inlineImages[cid] = {
            attachmentId: part.body.attachmentId,
            mimeType: part.mimeType,
          };
        }
      }

      // Handle content
      if (part.mimeType === "text/html") {
        const content = part.body.data;
        if (content) {
          htmlContent = Buffer.from(content, "base64").toString("utf8");
        }
      } else if (part.mimeType === "text/plain" && !htmlContent) {
        const content = part.body.data;
        if (content) {
          textContent = Buffer.from(content, "base64").toString("utf8");
        }
      }

      // Recursively process nested parts
      if (part.parts) {
        part.parts.forEach(processPayloadPart);
      }
    };

    // Process main payload
    if (payload.body.data) {
      if (payload.mimeType === "text/html") {
        htmlContent = Buffer.from(payload.body.data, "base64").toString("utf8");
      } else if (payload.mimeType === "text/plain") {
        textContent = Buffer.from(payload.body.data, "base64").toString("utf8");
      }
    }

    // Process all parts
    if (payload.parts) {
      payload.parts.forEach(processPayloadPart);
    }

    return {
      content: htmlContent || textContent,
      inlineImages,
      isHtml: !!htmlContent,
    };
  };

  const getAttachments = (payload) => {
    const attachments = [];

    const processPayloadParts = (parts) => {
      if (!parts) return;

      parts.forEach((part) => {
        if (part.filename && part.filename.length > 0) {
          // Skip inline images that are displayed in the content
          const isInlineAttachment = part.headers?.some(
            (h) => h.name.toLowerCase() === "content-id"
          );

          if (!isInlineAttachment) {
            attachments.push({
              filename: part.filename,
              mimeType: part.mimeType,
              size: part.body.size,
              attachmentId: part.body.attachmentId,
            });
          } else {
            attachments.push({
              filename: part.filename,
              mimeType: part.mimeType,
              size: part.body.size,
              attachmentId: part.body.attachmentId,
            });
          }
        }
        if (part.parts) {
          processPayloadParts(part.parts);
        }
      });
    };

    if (payload.parts) {
      processPayloadParts(payload.parts);
    }

    return attachments;
  };

  const fetchInlineImages = async (messageId, inlineImages) => {
    const imageUrls = {};
    const accessToken = localStorage.getItem("access_token");

    await Promise.all(
      Object.entries(inlineImages).map(async ([cid, details]) => {
        try {
          const response = await axios.get(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${details.attachmentId}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );

          const imageData = response.data.data;
          imageUrls[cid] = `data:${details.mimeType};base64,${imageData}`;
        } catch (error) {
          console.error(`Failed to fetch inline image ${cid}:`, error);
        }
      })
    );

    return imageUrls;
  };

  const replaceInlineImages = (content, imageUrls) => {
    let updatedContent = content;
    Object.entries(imageUrls).forEach(([cid, dataUrl]) => {
      const regex = new RegExp(`cid:${cid}`, "g");
      updatedContent = updatedContent.replace(regex, dataUrl);
    });
    return updatedContent;
  };

  const fetchMentions = async () => {
    try {
      // setError(null);
      const { data, error: supabaseError } = await supabase
        .from("dashboard_email_content")
        .select("*")
        .eq("for", em)
        .order("created_at", { ascending: false });

      if (supabaseError) throw supabaseError;
      setMentions(data || []);
    } catch (error) {
      console.error("Error fetching mentions:", error);
      // setError("Failed to fetch cases. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // setError(null);

      // First create the case
      const { data, error: supabaseError } = await supabase
        .from("dashboard_email_content")
        .insert([
          {
            title: newMention.title,
            for: em,
            content: newMention.content,
            docs: newMention.docs || null,
          },
        ])
        .select();

      if (supabaseError) throw supabaseError;

      // Check if we have data and it contains at least one row
      if (!data || data.length === 0) {
        throw new Error("Failed to create mention: No data returned");
      }

      // const newMentionId = data[0].id;

      // Reset form
      setNewMention({
        title: "",
        content: "",
        docs: [],
      });

      // Refresh the cases list
      await fetchMentions();
    } catch (error) {
      console.error("Error creating case:", error);
      // setError(error.message || "Failed to create case. Please try again.");
    }
  };

  const toggleEmailDetails = async (emailId) => {
    const newExpandedEmails = new Set(expandedEmails);

    if (expandedEmails.has(emailId)) {
      newExpandedEmails.delete(emailId);
      setExpandedEmails(newExpandedEmails);
      return;
    }

    newExpandedEmails.add(emailId);
    setExpandedEmails(newExpandedEmails);

    // Only fetch if we don't already have the details
    if (!emailDetails[emailId]) {
      setLoading((prev) => ({ ...prev, [emailId]: true }));

      try {
        const accessToken = localStorage.getItem("access_token");
        const response = await axios.get(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${emailId}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: { format: "full" },
          }
        );

        // Process email content and inline images
        const { content, inlineImages, isHtml } = processEmailContent(
          response.data.payload
        );

        // Fetch inline images if present
        let processedContent = content;
        if (Object.keys(inlineImages).length > 0) {
          const imageUrls = await fetchInlineImages(emailId, inlineImages);
          processedContent = replaceInlineImages(content, imageUrls);
        }

        // Get thread messages if available
        let threadMessages = [];
        if (response.data.threadId) {
          const threadResponse = await axios.get(
            `https://gmail.googleapis.com/gmail/v1/users/me/threads/${response.data.threadId}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          threadMessages = threadResponse.data.messages || [];
        }

        setEmailDetails((prev) => ({
          ...prev,
          [emailId]: {
            ...response.data,
            content: processedContent,
            isHtml,
            attachments: getAttachments(response.data.payload),
            thread: threadMessages,
          },
        }));
      } catch (error) {
        console.error("Failed to fetch email details:", error);
      } finally {
        setLoading((prev) => ({ ...prev, [emailId]: false }));
      }
    }
  };

  // Load more handlers
  const handleLoadMoreEmails = async () => {
    setLoadingMore(true);
    try {
      setDisplayedEmails((prev) => prev + 10);
      setHasMoreEmails(filteredEmails.length > displayedEmails + 10);
    } catch (error) {
      console.error("Failed to load more emails:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleLoadMoreAttachments = () => {
    setDisplayedAttachments((prev) => prev + 3);
  };

  const handleLoadMoreEmailAttachments = (emailId) => {
    setDisplayedEmailAttachments((prev) => ({
      ...prev,
      [emailId]: (prev[emailId] || 3) + 3,
    }));
  };

  // Filter emails based on active tab
  const filteredEmails =
    emails?.filter((email) => {
      if (activeTab === "sent") return email.type === "sent";
      if (activeTab === "received") return email.type === "received";
      return false;
    }) || [];

  if (!emails || emails.length === 0) {
    return (
      <div className="mb-6">
        <h2 className="text-xl mb-4">{title}</h2>
        <p className="text-gray-500">No emails found</p>
      </div>
    );
  }

  // Render functions for better organization
  const renderAttachmentsList = (attachments, emailId) => {
    const displayCount = displayedEmailAttachments[emailId] || 3;
    const displayedAttachmentsList = attachments.slice(0, displayCount);

    return (
      <div className="mb-4">
        <h4 className="font-medium text-gray-400 mb-2">Attachments:</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {displayedAttachmentsList.map((attachment, i) => {
            const attachmentKey = `${emailId}-${attachment.attachmentId}`;
            const isLoading = loadingAttachments[attachmentKey];

            return (
              <div
                key={i}
                className="flex items-center p-3 bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors group cursor-pointer"
                onClick={() => previewAttachment(emailId, attachment)}
              >
                <span className="text-2xl mr-3">
                  {getFileIcon(attachment.mimeType, attachment.filename)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-300 truncate">
                    {attachment.filename}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatFileSize(attachment.size)}
                  </div>
                </div>
                <div className="ml-2">
                  {isLoading ? (
                    <span className="text-blue-400 animate-pulse">⌛</span>
                  ) : (
                    <span className="text-gray-400 opacity-0 group-hover:opacity-100">
                      👁️
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {attachments.length > displayCount && (
          <div className="text-center mt-2">
            <button
              onClick={() => handleLoadMoreEmailAttachments(emailId)}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Show More Attachments
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderAttachmentsTab = () => {
    if (loadingAllAttachments) {
      return (
        <div className="text-center py-8">
          <div
            className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent text-blue-400 rounded-full"
            role="status"
          >
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2 text-gray-400">Loading attachments...</p>
        </div>
      );
    }

    if (allAttachments.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-400">No attachments found</p>
        </div>
      );
    }

    return (
      <>
        {allAttachments
          .slice(0, displayedAttachments)
          .map((emailAttachments, index) => (
            <div
              key={index}
              className="border  border-[#2e2e2e] rounded-lg bg-[#111111] shadow-sm overflow-hidden"
            >
              <div className="p-4 relative">
                <div className="flex gap-4 ">
                  <span className="border-r border-[#323232] pr-5">
                    {index}
                  </span>
                  <div className="mb-3">
                    <h3 className="text-sm text-gray-500">
                      {new Date(emailAttachments.date).toLocaleString()}
                    </h3>
                    <h3 className="font-semibold text-md text-[#e0e0e0]">
                      {emailAttachments.subject}
                    </h3>

                    {renderAttachmentsList(
                      emailAttachments.attachments,
                      emailAttachments.emailId
                    )}
                  </div>
                  <span className="absolute right-0 top-0 px-2 py-1 bg-[#1d1d1d] rounded-lg ml-[40px]">
                    {emailAttachments.attachments.length}
                  </span>
                </div>
              </div>
            </div>
          ))}
        {allAttachments.length > displayedAttachments && (
          <div className="text-center mt-4">
            <button
              onClick={handleLoadMoreAttachments}
              className="px-4 py-2 bg-[#292929] text-white rounded hover:bg-[#313131] transition-colors"
            >
              Load More Attachments
            </button>
          </div>
        )}
      </>
    );
  };

  return (
    <>
      <div className="mb-6 relative">
        {/* Tab Navigation */}
        <div className="flex w-full overflow-x-auto z-[45] sticky top-0 space-x-2 mb-4 border-b bg-[#0C0C0C] pt-2 border-[#343434]">
          <button
            onClick={() => setActiveTab("received")}
            className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
              activeTab === "received"
                ? "bg-[#292929] border-[#565656] border-b text-white"
                : "text-gray-400 hover:text-white hover:bg-[#313131]"
            }`}
          >
            Received
          </button>
          <button
            onClick={() => setActiveTab("sent")}
            className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
              activeTab === "sent"
                ? "bg-[#292929] border-[#565656] border-b text-white"
                : "text-gray-400 hover:text-white hover:bg-[#313131]"
            }`}
          >
            Sent
          </button>
          <button
            onClick={() => setActiveTab("attachments")}
            className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
              activeTab === "attachments"
                ? "bg-[#292929] border-[#565656] border-b text-white"
                : "text-gray-400 hover:text-white hover:bg-[#313131]"
            }`}
          >
            Attachments
          </button>
          <button
            onClick={() => setActiveTab("mentions")}
            className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
              activeTab === "mentions"
                ? "bg-[#292929] border-[#565656] border-b text-white"
                : "text-gray-400 hover:text-white hover:bg-[#313131]"
            }`}
          >
            Mentions
          </button>
        </div>

        {/* Content Area */}
        <div className="space-y-4">
          {activeTab === "attachments" ? (
            renderAttachmentsTab()
          ) : activeTab === "received" ? (
            // Email List Content (Sent/Received)

            <>
              {filteredEmails.slice(0, displayedEmails).map((email, index) => (
                <div
                  key={email.id}
                  className="border border-[#2e2e2e] rounded-lg bg-[#111111] shadow-sm overflow-hidden"
                >
                  <div
                    className="py-2 px-3 cursor-pointer hover:bg-[#1c1c1c] transition-colors"
                    onClick={() => toggleEmailDetails(email.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex flex-row justify-start items-center gap-5">
                        {index}
                        <div className="flex flex-col border-l px-4 border-gray-500">
                          <h3 className="text-sm text-gray-500">
                            {new Date(email.date).toLocaleString()}
                          </h3>
                          <h3 className="font-semibold text-md text-[#e0e0e0]">
                            {email.subject}
                          </h3>
                        </div>
                      </div>
                      <button
                        className={`ml-2 p-2 rounded-full transition-transform ${
                          expandedEmails.has(email.id) ? "rotate-180" : ""
                        }`}
                      >
                        ▼
                      </button>
                    </div>
                  </div>

                  {expandedEmails.has(email.id) && (
                    <div className="border-t border-gray-800">
                      {loading[email.id] ? (
                        <div className="p-4 text-center text-gray-500">
                          Loading details...
                        </div>
                      ) : emailDetails[email.id] ? (
                        <div className="p-4">
                          {/* Full Headers */}
                          <div className="mb-4 p-3 bg-[#1d1d1d] rounded-lg text-sm">
                            {emailDetails[email.id].payload.headers
                              .filter((h) =>
                                [
                                  "From",
                                  "To",
                                  "Date",
                                  "Subject",
                                  "Cc",
                                  "Bcc",
                                ].includes(h.name)
                              )
                              .map((header, i) => (
                                <div key={i} className="mb-1">
                                  <span className="font-medium text-gray-400">
                                    {header.name}:{" "}
                                  </span>
                                  <span className="text-gray-300">
                                    {header.value}
                                  </span>
                                </div>
                              ))}
                          </div>

                          {/* Attachments */}
                          {emailDetails[email.id].attachments.length > 0 &&
                            renderAttachmentsList(
                              emailDetails[email.id].attachments,
                              email.id
                            )}

                          {/* Email Content */}
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-400 mb-2">
                              Content:
                            </h4>
                            <EmailContent
                              content={emailDetails[email.id].content}
                              isHtml={emailDetails[email.id].isHtml}
                            />
                          </div>

                          {/* Thread Messages */}
                          {emailDetails[email.id].thread.length > 1 && (
                            <div>
                              <h4 className="font-medium text-gray-400 mb-2">
                                Thread ({emailDetails[email.id].thread.length}{" "}
                                messages):
                              </h4>
                              <div className="space-y-2">
                                {emailDetails[email.id].thread.map((msg) => (
                                  <ThreadMessage
                                    key={msg.id}
                                    messageId={msg.id}
                                    headers={msg.payload.headers}
                                    snippet={msg.snippet}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-red-500">
                          Failed to load email details
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {rToken && (
                <div className="text-center mt-4">
                  <button
                    onClick={lmremails}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
                  >
                    Load More Received Emails
                  </button>
                </div>
              )}
            </>
          ) : activeTab === "sent" ? (
            <>
              {filteredEmails.slice(0, displayedEmails).map((email, index) => (
                <div
                  key={email.id}
                  className="border border-[#2e2e2e] rounded-lg bg-[#111111] shadow-sm overflow-hidden"
                >
                  <div
                    className="py-2 px-3 cursor-pointer hover:bg-[#1c1c1c] transition-colors"
                    onClick={() => toggleEmailDetails(email.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex flex-row justify-start items-center gap-5">
                        {index}
                        <div className="flex flex-col border-l px-4 border-gray-500">
                          <h3 className="text-sm text-gray-500">
                            {new Date(email.date).toLocaleString()}
                          </h3>
                          <h3 className="font-semibold text-md text-[#e0e0e0]">
                            {email.subject}
                          </h3>
                        </div>
                      </div>
                      <button
                        className={`ml-2 p-2 rounded-full transition-transform ${
                          expandedEmails.has(email.id) ? "rotate-180" : ""
                        }`}
                      >
                        ▼
                      </button>
                    </div>
                  </div>

                  {expandedEmails.has(email.id) && (
                    <div className="border-t border-gray-800">
                      {loading[email.id] ? (
                        <div className="p-4 text-center text-gray-500">
                          Loading details...
                        </div>
                      ) : emailDetails[email.id] ? (
                        <div className="p-4">
                          {/* Full Headers */}
                          <div className="mb-4 p-3 bg-[#1d1d1d] rounded-lg text-sm">
                            {emailDetails[email.id].payload.headers
                              .filter((h) =>
                                [
                                  "From",
                                  "To",
                                  "Date",
                                  "Subject",
                                  "Cc",
                                  "Bcc",
                                ].includes(h.name)
                              )
                              .map((header, i) => (
                                <div key={i} className="mb-1">
                                  <span className="font-medium text-gray-400">
                                    {header.name}:{" "}
                                  </span>
                                  <span className="text-gray-300">
                                    {header.value}
                                  </span>
                                </div>
                              ))}
                          </div>

                          {/* Attachments */}
                          {emailDetails[email.id].attachments.length > 0 &&
                            renderAttachmentsList(
                              emailDetails[email.id].attachments,
                              email.id
                            )}

                          {/* Email Content */}
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-400 mb-2">
                              Content:
                            </h4>
                            <EmailContent
                              content={emailDetails[email.id].content}
                              isHtml={emailDetails[email.id].isHtml}
                            />
                          </div>

                          {/* Thread Messages */}
                          {emailDetails[email.id].thread.length > 1 && (
                            <div>
                              <h4 className="font-medium text-gray-400 mb-2">
                                Thread ({emailDetails[email.id].thread.length}{" "}
                                messages):
                              </h4>
                              <div className="space-y-2">
                                {emailDetails[email.id].thread.map((msg) => (
                                  <ThreadMessage
                                    key={msg.id}
                                    messageId={msg.id}
                                    headers={msg.payload.headers}
                                    snippet={msg.snippet}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-red-500">
                          Failed to load email details
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {sToken && (
                <div className="text-center mt-4">
                  <button
                    onClick={lmsemails}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
                  >
                    Load More Sent Emails
                  </button>
                </div>
              )}
            </>
          ) : activeTab === "mentions" ? (
            <>
              {isPublic ? (
                <>
                  <Accordion type="single" collapsible className="w-full">
                    {mentions?.map((mention, index) => (
                      <AccordionItem
                        className="bg-[#1d1d1d] mb-2 rounded-lg border-none px-3"
                        value={mention.id}
                        key={index}
                      >
                        <AccordionTrigger>{mention.title}</AccordionTrigger>
                        <AccordionContent>
                          {mention.docs?.length > 0 && (
                            <div className="mt-4 space-y-2">
                              <h4 className="text-sm font-medium text-gray-400">
                                Attachments:
                              </h4>

                              {mention?.docs?.map((doc, index) => (
                                <>
                                  <details>
                                    <summary>{doc.name}</summary>
                                    <p>
                                      <img src={doc.url} alt="" />
                                    </p>
                                  </details>
                                  {/* <a
                                  key={index}
                                  href={doc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center p-2 bg-[#1a1a1a] rounded hover:bg-[#2a2a2a]"
                                >
                                  <span className="text-sm text-blue-400">
                                    {doc.name}
                                  </span>
                                </a> */}
                                </>
                              ))}
                            </div>
                          )}
                          {renderContent(mention.content)}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </>
              ) : (
                <>
                  <div className="flex sm:flex-row flex-col items-start gap-3">
                    <div className="bg-[#1d1d1d] w-full sm:w-1/3 p-6 rounded-lg shadow-md mb-6 border border-[#2d2d2d]">
                      <h2 className="text-xl font-semibold mb-4 text-white">
                        Add New Mention
                      </h2>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                          <label className="block mb-3 text-sm font-medium text-gray-200">
                            Title
                          </label>
                          <input
                            type="text"
                            value={newMention.title}
                            onChange={(e) =>
                              setNewMention({
                                ...newMention,
                                title: e.target.value,
                              })
                            }
                            className="mt-2 block w-full h-10 rounded-md px-3 bg-[#0e0e0e] border-[#3d3d3d] text-white shadow-sm"
                            required
                          />
                        </div>

                        <div>
                          <label className="block mb-3 text-sm font-medium text-gray-200">
                            Attachments
                          </label>
                          {console.log(newMention.docs)}

                          <FileUpload
                            docs={newMention.docs}
                            setNewMention={setNewMention}
                          />
                        </div>

                        <div>
                          <label className="block mb-3 text-sm font-medium text-gray-200">
                            Contents
                          </label>
                          {/* <div className="flex items-center space-x-2 mb-3">
                            <Label>Editor</Label>
                            <Switch
                              checked={mktoggle}
                              onClick={() => setMktoggle(!mktoggle)}
                              id="airplane-mode"
                            />
                            <Label>Markdown</Label>
                          </div> */}
                          

                          
                            {/* <textarea
                              value={newMention.content}
                              onChange={(e) =>
                                setNewMention({
                                  ...newMention,
                                  content: e.target.value,
                                })
                              }
                              placeholder="Write your content in Markdown or HTML..."
                              className="mt-1 h-[150px] p-2 block w-full rounded-md bg-[#0e0e0e] border-[#3d3d3d] text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              required
                            />
                         */}
                            <QuillEditor
                              newMention={newMention}
                              setNewMention={setNewMention}
                            />
                      
                          {/*  */}
                          {/* <Tiptap /> */}
                        </div>
                        {newMention.content != "" && (
                          <div className="">
                            <label className="text-sm text-gray-400">
                              Preview
                            </label>
                            <div className="w-full min-h-[200px] p-4 border border-gray-700 rounded overflow-auto bg-[#1a1a1a]">
                              {renderContent(newMention.content)}
                            </div>
                          </div>
                        )}
                        <button
                          type="submit"
                          className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                        >
                          Add Mention
                        </button>
                        <button
                          type="reset"
                          onClick={() => {
                            setNewMention({
                              title: "",
                              content: "",
                              docs: [],
                            }); // Reset to initial state with all fields empty
                          }}
                          className="bg-gray-500 ml-2 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                        >
                          Clear
                        </button>
                      </form>
                    </div>
                    <div
                      className="sm:w-2/3 w-full
                        "
                    >
                      {console.log(mentions)}
                      <Accordion type="single" collapsible className="w-full">
                        {mentions?.map((mention, index) => (
                          <AccordionItem
                            value={mention.id}
                            className="mb-2 bg-[#1d1d1d] rounded-lg border-none px-3"
                            key={index}
                          >
                            <AccordionTrigger>{mention.title}</AccordionTrigger>
                            <AccordionContent>
                              <>
                                <div className="flex justify-end mt-4">
                                  <button
                                    onClick={() => deleteMention(mention.uuid)}
                                    className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                                  >
                                    Delete
                                  </button>
                                </div>
                                {renderContent(mention.content)}

                                {mention.docs?.length > 0 && (
                                  <div className="mt-4 space-y-2">
                                    <h4 className="text-sm font-medium text-gray-400">
                                      Attachments:
                                    </h4>

                                    {mention?.docs?.map((doc, index) => (
                                      <a
                                        key={index}
                                        href={doc.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center p-2 bg-[#1a1a1a] rounded hover:bg-[#2a2a2a]"
                                      >
                                        <span className="text-sm text-blue-400">
                                          {doc.name}
                                        </span>
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <></>
          )}
        </div>
      </div>

      {/* Attachment Preview Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            // Cleanup blob URLs when dialog closes
            if (
              attachmentContent?.data &&
              attachmentContent.type !== "image" &&
              attachmentContent.type !== "text"
            ) {
              URL.revokeObjectURL(attachmentContent.data);
            }
            setAttachmentContent(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl bg-[#121212] max-h-[98vh] h-[98vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedAttachment?.filename}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {attachmentContent ? (
              attachmentContent.type === "image" ? (
                <img
                  src={attachmentContent.data}
                  alt={selectedAttachment?.filename}
                  className="max-w-full h-auto"
                />
              ) : attachmentContent.type === "pdf" ? (
                <iframe
                  src={attachmentContent.data}
                  className="sm:w-[60%] w-full mx-auto h-[88vh]"
                  title={selectedAttachment?.filename}
                />
              ) : attachmentContent.type === "text" ? (
                <pre className="whitespace-pre-wrap bg-gray-900 p-4 rounded-lg overflow-x-auto">
                  {attachmentContent.data}
                </pre>
              ) : attachmentContent.type === "video" ? (
                <video
                  controls
                  className="max-w-full"
                  src={attachmentContent.data}
                >
                  Your browser does not support the video tag.
                </video>
              ) : attachmentContent.type === "error" ? (
                <div className="text-red-500 text-center p-4">
                  {attachmentContent.data}
                </div>
              ) : (
                <div className="text-center p-4">
                  <p className="mb-4">
                    This file type cannot be previewed directly.
                  </p>
                  <a
                    href={attachmentContent.data}
                    download={selectedAttachment?.filename}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Download File
                  </a>
                </div>
              )
            ) : (
              <div className="text-center p-4">
                <div
                  className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent text-blue-400 rounded-full"
                  role="status"
                >
                  <span className="sr-only">Loading...</span>
                </div>
                <p className="mt-2">Loading attachment...</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            // Cleanup blob URLs when dialog closes
            if (
              attachmentContent?.data &&
              attachmentContent.type !== "image" &&
              attachmentContent.type !== "text"
            ) {
              URL.revokeObjectURL(attachmentContent.data);
            }
            setAttachmentContent(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl bg-[#121212] max-h-[98vh] h-[98vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedAttachment?.filename}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {attachmentContent ? (
              attachmentContent.type === "image" ? (
                <img
                  src={attachmentContent.data}
                  alt={selectedAttachment?.filename}
                  className="max-w-full h-auto"
                />
              ) : attachmentContent.type === "pdf" ? (
                <iframe
                  src={attachmentContent.data}
                  className="sm:w-[60%] w-full mx-auto h-[88vh]"
                  title={selectedAttachment?.filename}
                />
              ) : attachmentContent.type === "text" ? (
                <pre className="whitespace-pre-wrap bg-gray-900 p-4 rounded-lg overflow-x-auto">
                  {attachmentContent.data}
                </pre>
              ) : attachmentContent.type === "video" ? (
                <video
                  controls
                  className="max-w-full"
                  src={attachmentContent.data}
                >
                  Your browser does not support the video tag.
                </video>
              ) : attachmentContent.type === "error" ? (
                <div className="text-red-500 text-center p-4">
                  {attachmentContent.data}
                </div>
              ) : (
                <div className="text-center p-4">
                  <p className="mb-4">
                    This file type cannot be previewed directly.
                  </p>
                  <a
                    href={attachmentContent.data}
                    download={selectedAttachment?.filename}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Download File
                  </a>
                </div>
              )
            ) : (
              <div className="text-center p-4">
                <div
                  className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent text-blue-400 rounded-full"
                  role="status"
                >
                  <span className="sr-only">Loading...</span>
                </div>
                <p className="mt-2">Loading attachment...</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
