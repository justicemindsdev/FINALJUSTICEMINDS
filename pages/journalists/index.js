import React, { useState, useEffect } from "react";
import { MdEdit } from "react-icons/md";
import { MdLink } from "react-icons/md";
import { MdDeleteOutline } from "react-icons/md";
import { Accordion, AccordionForm } from "@/components/ui/accordionss";
import { supabase } from "@/lib/supabase";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { withAuth } from "@/lib/authUtils";
const Journalists = ({ user }) => {
  const [isLoading, setIsLoading] = useState(true);

  const [inputText, setInputText] = useState("");
  const [linkCards, setLinkCards] = useState([]);
  const [savedLinks, setSavedLinks] = useState([]);
  const [editingLink, setEditingLink] = useState(null);
  const [showAccordionForm, setShowAccordionForm] = useState(false);
  const [accordions, setAccordions] = useState([]);
  const [editingAccordion, setEditingAccordion] = useState(null);

  const [pageTitle, setPageTitle] = useState("");
  const [pageDescription, setPageDescription] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [showSaveInputs, setShowSaveInputs] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    fetchSavedLinks();
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const fetchSavedLinks = async () => {
    try {
      const { data, error } = await supabase
        .from("linkpreiews")
        .select("*")
        .eq("prof_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setSavedLinks(data || []);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching saved links:", error);
      setSaveMessage("Failed to fetch saved links");
      setIsLoading(false);
    }
  };

  const fetchMetadata = async (url) => {
    try {
      const response = await fetch(
        `/api/fetchMetadata?url=${encodeURIComponent(url)}`
      );

      if (!response.ok) throw new Error("Failed to fetch metadata");
      const data = await response.json();
      return {
        ...data,
        currentThumbnailIndex: 0,
        allThumbnails: data.allThumbnails || [data.thumbnail],
      };
    } catch (error) {
      return {
        title: "Unknown",
        description: "Could not fetch metadata",
        thumbnail: "",
        allThumbnails: [],
        currentThumbnailIndex: 0,
      };
    }
  };

  const extractLinks = () => {
    const regex = /\b(?:https?:\/\/|www\.)[^\s/$.?#].[^\s]*\b/g;
    const foundLinks = inputText.match(regex) || [];

    const initialCards = foundLinks.map((link) => ({
      url: link,
      title: "Loading...",
      description: "Fetching metadata...",
      thumbnail: "",
      allThumbnails: [],
      currentThumbnailIndex: 0,
    }));

    setLinkCards(initialCards);
    setShowSaveInputs(false);

    foundLinks.forEach(async (link) => {
      const metadata = await fetchMetadata(link);
      setLinkCards((prevCards) =>
        prevCards.map((card) =>
          card.url === link ? { url: link, ...metadata } : card
        )
      );
    });
  };

  const handleAccordionSubmit = async ({ title, content }) => {
    if (editingAccordion !== null) {
      setAccordions(
        accordions.map((acc, i) =>
          i === editingAccordion ? { title, content } : acc
        )
      );
      setEditingAccordion(null);
    } else {
      setAccordions([...accordions, { title, content }]);
    }
    setShowAccordionForm(false);
  };

  const handleAccordionEdit = (index) => {
    setEditingAccordion(index);
    setShowAccordionForm(true);
  };

  const handleAccordionDelete = (index) => {
    if (window.confirm("Are you sure you want to delete this accordion?")) {
      setAccordions(accordions.filter((_, i) => i !== index));
    }
  };

  const shuffleThumbnail = (index) => {
    setLinkCards((prevCards) => {
      const newCards = [...prevCards];
      const card = newCards[index];
      if (card.allThumbnails && card.allThumbnails.length > 1) {
        const nextIndex =
          (card.currentThumbnailIndex + 1) % card.allThumbnails.length;
        card.currentThumbnailIndex = nextIndex;
        card.thumbnail = card.allThumbnails[nextIndex];
      }
      return newCards;
    });
  };

  const handleEdit = async (link) => {
    setEditingLink(link);
    setShowSaveInputs(true);

    const initialCards = link.links.Links.map((l) => ({
      url: l.url,
      thumbnail: l.selectedThumbnail,
      title: "Loading...",
      description: "Loading...",
      allThumbnails: [l.selectedThumbnail],
      currentThumbnailIndex: 0,
    }));
    setLinkCards(initialCards);

    // Fetch metadata for each link
    for (const [index, l] of link.links.Links.entries()) {
      const metadata = await fetchMetadata(l.url);
      setLinkCards((prevCards) =>
        prevCards.map((card, i) =>
          i === index
            ? {
                ...card,
                ...metadata,
                thumbnail: l.selectedThumbnail,
                allThumbnails: metadata.allThumbnails || [l.selectedThumbnail],
                currentThumbnailIndex: 0,
              }
            : card
        )
      );
    }

    setPageTitle(link.title);
    setPageDescription(link.desc);
    setAccordions(link.accordions || []);
  };

  const handleDelete = async (uuid, title) => {
    const isConfirmed = window.confirm(
      `Are you sure you want to delete "${title}"?`
    );

    if (!isConfirmed) {
      return;
    }

    try {
      const { error } = await supabase
        .from("linkpreiews")
        .delete()
        .match({ uuid });

      if (error) throw error;

      // Also delete related content from LinkContent
      const { error: contentError } = await supabase
        .from("Linkcontent")
        .delete()
        .match({ uuid });

      if (contentError) throw contentError;

      setSaveMessage("Link collection deleted successfully!");
      fetchSavedLinks();

      if (editingLink?.uuid === uuid) {
        setEditingLink(null);
        setLinkCards([]);
        setPageTitle("");
        setPageDescription("");
        setShowSaveInputs(false);
        setAccordions([]);
      }
    } catch (error) {
      console.error("Error deleting link:", error);
      setSaveMessage("Failed to delete link collection.");
    }
  };

  const updateLinks = async () => {
    if (!editingLink) return;

    if (!pageTitle.trim()) {
      setSaveMessage("Please enter a title");
      return;
    }

    if (!pageDescription.trim()) {
      setSaveMessage("Please enter a description");
      return;
    }

    const links = linkCards.map((card) => ({
      url: card.url,
      selectedThumbnail: card.thumbnail,
    }));
    const jsonPayload = { Links: links };

    try {
      const { error } = await supabase
        .from("linkpreiews")
        .update({
          title: pageTitle,
          desc: pageDescription,
          links: jsonPayload,
          accordions: accordions,
        })
        .match({ uuid: editingLink.uuid });

      if (error) throw error;

      setSaveMessage("Links updated successfully!");
      setEditingLink(null);
      setPageTitle("");
      setPageDescription("");
      setLinkCards([]);
      setShowSaveInputs(false);
      setAccordions([]);
      fetchSavedLinks();
    } catch (error) {
      console.error("Error updating links:", error);
      setSaveMessage("Failed to update links.");
    }
  };

  const saveLinks = async () => {
    if (editingLink) {
      await updateLinks();
      return;
    }

    if (!pageTitle.trim()) {
      setSaveMessage("Please enter a title");
      return;
    }

    if (!pageDescription.trim()) {
      setSaveMessage("Please enter a description");
      return;
    }

    const links = linkCards.map((card) => ({
      url: card.url,
      selectedThumbnail: card.thumbnail,
    }));
    const jsonPayload = { Links: links };

    try {
      const { data, error } = await supabase.from("linkpreiews").insert({
        title: pageTitle,
        prof_id: user.id,
        desc: pageDescription,
        links: jsonPayload,
        accordions: accordions,
      });

      if (error) throw error;

      setSaveMessage("Links saved successfully!");
      setPageTitle("");
      setPageDescription("");
      setShowSaveInputs(false);
      setLinkCards([]);
      setInputText("");
      setAccordions([]);
      fetchSavedLinks();
    } catch (error) {
      console.error("Error saving links:", error);
      setSaveMessage("Failed to save links.");
    }
  };

  const LinkCard = ({ card, index }) => (
    <div className="h-[400px] transition-transform hover:scale-[1.02]">
      <div className="flex rounded-lg h-full bg-[#303030] bg-opacity-60 p-4 flex-col">
        <div className="h-[200px] mb-2 relative group">
          {card.thumbnail ? (
            <>
              <img
                src={card.thumbnail}
                alt={card.title}
                className="w-full h-full object-cover rounded-md"
              />
              {card.allThumbnails && card.allThumbnails.length > 1 && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    shuffleThumbnail(index);
                  }}
                  className="absolute top-2 right-2 bg-black bg-opacity-50 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Shuffle thumbnail"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-white"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </>
          ) : (
            <div className="w-full h-full bg-gray-200 animate-pulse rounded-md"></div>
          )}
        </div>
        <a
          href={card.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-grow flex flex-col"
        >
          <h2 className="text-white text-lg title-font font-medium mb-2 line-clamp-2">
            {card.title}
          </h2>
          <p className="leading-relaxed text-base flex-grow line-clamp-2 text-gray-400">
            {card.description}
          </p>
          <div className="mt-3 text-indigo-400 inline-flex items-center hover:text-indigo-300 transition-colors">
            Visit Link
            <svg
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              className="w-4 h-4 ml-2"
              viewBox="0 0 24 24"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
        </a>
      </div>
    </div>
  );

  const renderAccordionSection = () => (
    <div className="w-full max-w-lg mt-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white text-lg font-medium">Accordions</h3>
        <button
          onClick={() => {
            setEditingAccordion(null);
            setShowAccordionForm(true);
          }}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Add Accordion
        </button>
      </div>

      {showAccordionForm && (
        <div className="mb-4">
          <AccordionForm
            onSubmit={handleAccordionSubmit}
            initialTitle={
              editingAccordion !== null
                ? accordions[editingAccordion].title
                : ""
            }
            initialContent={
              editingAccordion !== null
                ? accordions[editingAccordion].content
                : ""
            }
            isEdit={editingAccordion !== null}
          />
        </div>
      )}

      <div className="space-y-2">
        {accordions.map((accordion, index) => (
          <Accordion
            key={index}
            title={accordion.title}
            content={accordion.content}
            isEditable={true}
            onEdit={() => handleAccordionEdit(index)}
            onDelete={() => handleAccordionDelete(index)}
          />
        ))}
      </div>
    </div>
  );
  return (
    <>
      {isMobile ? (
        <section className="text-gray-400 bg-[#0c0c0c] body-font min-h-screen">
          <div className="container px-5 py-24 mx-auto flex flex-col justify-start items-center gap-5 flex-wrap">
            <img src="/logomain.png" className="w-[300px]" alt="" />
            <h1 className="text-2xl font-bold mb-4 text-white">Link Share</h1>
            <textarea
              className="w-full max-w-lg p-2 border bg-[#1c1c1c] border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="6"
              placeholder="Enter text containing links here..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            ></textarea>
            <div className="flex gap-3 flex-col items-center pb-4">
              <button
                className="mt-4 px-4 py-2 bg-gray-500 text-white font-semibold rounded-md shadow-md hover:bg-[#1d1d1d]"
                onClick={extractLinks}
              >
                Extract Links
              </button>
              {linkCards.length > 0 && (
                <button
                  className="mt-4 px-4 py-2 bg-green-500 text-white font-semibold rounded-md shadow-md hover:bg-green-600"
                  onClick={() => setShowSaveInputs(true)}
                >
                  {editingLink ? "Update Page" : "Save Page"}
                </button>
              )}
            </div>

            {showSaveInputs && linkCards.length > 0 && (
              <div className="mt-4 flex flex-col gap-3 w-full max-w-lg">
                <input
                  type="text"
                  placeholder="Enter Page Title"
                  className="w-full p-2 border bg-[#1c1c1c] border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  value={pageTitle}
                  onChange={(e) => setPageTitle(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Enter Page Description"
                  className="w-full p-2 border bg-[#1c1c1c] border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  value={pageDescription}
                  onChange={(e) => setPageDescription(e.target.value)}
                />
                {renderAccordionSection()}
                <button
                  className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-md shadow-md hover:bg-blue-600"
                  onClick={saveLinks}
                >
                  {editingLink ? "Confirm Update" : "Confirm Save"}
                </button>
                {saveMessage && (
                  <div
                    className={`mt-2 text-center p-2 rounded ${
                      saveMessage.includes("successfully")
                        ? "bg-green-500 text-white"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {saveMessage}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-6xl mt-6">
              {linkCards.map((card, index) => (
                <LinkCard key={index} card={card} index={index} />
              ))}
            </div>
          </div>
        </section>
      ) : (
        <ResizablePanelGroup
          direction="horizontal"
          className="rounded-lg w-full"
          style={{ height: "100vh" }}
        >
          <ResizablePanel defaultSize={30}>
            <div className="flex flex-col items-center overflow-auto h-screen justify-center p-6">
              <img src="/logomain.png" className="w-[200px]" alt="" />
              <h1 className="text-2xl font-bold mb-4 text-white">Link Share</h1>
              <textarea
                className="w-full max-w-lg p-2 border bg-[#1c1c1c] border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="6"
                placeholder="Enter text containing links here..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              ></textarea>
              <div className="flex gap-3 flex-col items-center pb-4">
                <div className="flex gap-3">
                  <button
                    className="mt-4 px-4 py-2 bg-gray-500 text-white font-semibold rounded-md shadow-md hover:bg-[#1d1d1d]"
                    onClick={extractLinks}
                  >
                    Extract Links
                  </button>
                  {linkCards.length > 0 && (
                    <button
                      className="mt-4 px-4 py-2 bg-green-500 text-white font-semibold rounded-md shadow-md hover:bg-green-600"
                      onClick={() => setShowSaveInputs(true)}
                    >
                      {editingLink ? "Update Page" : "Save Page"}
                    </button>
                  )}
                </div>

                {showSaveInputs && linkCards.length > 0 && (
                  <div className="mt-4 flex flex-col gap-3 w-full max-w-lg">
                    <input
                      type="text"
                      placeholder="Enter Page Title"
                      className="w-full p-2 border bg-[#1c1c1c] border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                      value={pageTitle}
                      onChange={(e) => setPageTitle(e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Enter Page Description"
                      className="w-full p-2 border bg-[#1c1c1c] border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                      value={pageDescription}
                      onChange={(e) => setPageDescription(e.target.value)}
                    />
                    {renderAccordionSection()}
                    <button
                      className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-md shadow-md hover:bg-blue-600"
                      onClick={saveLinks}
                    >
                      {editingLink ? "Confirm Update" : "Confirm Save"}
                    </button>
                    {saveMessage && (
                      <div
                        className={`mt-2 text-center p-2 rounded ${
                          saveMessage.includes("successfully")
                            ? "bg-green-500 text-white"
                            : "bg-red-500 text-white"
                        }`}
                      >
                        {saveMessage}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {savedLinks && (
                <>
                  <div className="flex flex-col w-full h-[200px] border border-gray-600 rounded-lg p-2 overflow-y-scroll">
                    {savedLinks?.map((link) => (
                      <div
                        key={link.uuid}
                        className="p-2 mb-4 bg-[#1c1c1c] rounded shadow-sm flex items-center justify-between"
                      >
                        <span>{link.title}</span>
                        <div className="flex gap-2">
                          <a
                            href={`/journalists/share/${link.uuid}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 flex items-center justify-center bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            <MdLink />
                          </a>
                          <button
                            onClick={() => handleEdit(link)}
                            className="px-2 py-1 flex items-center justify-center bg-yellow-500 text-white rounded hover:bg-yellow-600"
                          >
                            <MdEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(link.uuid, link.title)}
                            className="px-2 py-1 bg-red-500 flex items-center justify-center text-white rounded hover:bg-red-600"
                          >
                            <MdDeleteOutline />
                          </button>
                          <span className="px-2 py-1 bg-gray-700 text-white rounded">
                            {link.links.Links.length}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </ResizablePanel>
          <ResizableHandle className="bg-gray-600" />
          <ResizablePanel defaultSize={70}>
            <div className="flex flex-col overflow-auto h-screen">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 auto-rows-min">
                {linkCards.map((card, index) => (
                  <LinkCard key={index} card={card} index={index} />
                ))}
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </>
  );
};

export default withAuth(Journalists);
