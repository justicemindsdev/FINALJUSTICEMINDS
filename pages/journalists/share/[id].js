import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabase";
import { Accordion } from "@/components/ui/accordionss";
import MarkdownContent from "@/components/MarkdownContent";

// Helper function to extract domain from URL
const extractDomain = (text) => {
  try {
    if (text.startsWith("http://") || text.startsWith("https://")) {
      const url = new URL(text);
      return url.hostname;
    }
    return text;
  } catch {
    return text;
  }
};

// Helper function to check if content is HTML
const isHTML = (str) => {
  const doc = new DOMParser().parseFromString(str, "text/html");
  return Array.from(doc.body.childNodes).some((node) => node.nodeType === 1);
};

// Helper function to render content based on type
const renderContent = (content) => {
  if (isHTML(content)) {
    return (
      <div
        dangerouslySetInnerHTML={{ __html: content }}
        className="prose prose-invert max-w-none"
      />
    );
  }
  return <MarkdownContent content={content} />;
};

const Share = () => {
  const router = useRouter();
  const { id } = router.query;

  const [linkShare, setLinkShare] = useState(null);
  const [linkCards, setLinkCards] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLinkShare = async () => {
      if (!id) return;

      try {
        // Fetch the record from LinkShare table
        const { data, error } = await supabase
          .from("linkpreiews")
          .select("*")
          .eq("uuid", id)
          .single();

        if (error) throw error;

        setLinkShare(data);

        // Parse the links from the JSON payload
        const parsedLinks = data.links.Links || [];

        // Initialize cards with loading state
        const initialCards = parsedLinks.map((link) => ({
          url: typeof link === "string" ? link : link.url,
          title: "Loading...",
          description: "Fetching metadata...",
          thumbnail: typeof link === "string" ? "" : link.selectedThumbnail,
        }));

        setLinkCards(initialCards);

        // Fetch metadata for each link independently
        const fetchMetadata = async (url, existingThumbnail) => {
          try {
            const response = await fetch(
              `/api/fetchMetadata?url=${encodeURIComponent(url)}`
            );

            if (!response.ok) throw new Error("Failed to fetch metadata");
            const metadata = await response.json();
            return {
              ...metadata,
              thumbnail: existingThumbnail || metadata.thumbnail,
            };
          } catch (error) {
            return {
              title: "Unknown",
              description: "Could not fetch metadata",
              thumbnail: existingThumbnail || "",
            };
          }
        };

        // Update cards as metadata is fetched
        parsedLinks.forEach(async (link) => {
          const url = typeof link === "string" ? link : link.url;
          const existingThumbnail =
            typeof link === "string" ? "" : link.selectedThumbnail;

          const metadata = await fetchMetadata(url, existingThumbnail);

          setLinkCards((prevCards) =>
            prevCards.map((card) =>
              card.url === url
                ? {
                    ...card,
                    ...metadata,
                    thumbnail: card.thumbnail || metadata.thumbnail,
                  }
                : card
            )
          );
        });
      } catch (err) {
        console.error("Error fetching link share:", err);
        setError(err);
      }
    };

    fetchLinkShare();
  }, [id]);

  if (error) {
    return (
      <div className="text-center text-red-500 py-10">
        Error loading link: {error.message}
      </div>
    );
  }

  return (
    <section className="text-gray-400 bg-[#101010] body-font min-h-screen">
      <div className="px-5 py-10 flex flex-col justify-center items-center">
        <img src="/logomain.png" className="mb-5" width={"150px"} alt="" />
        {linkShare && (
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold text-white mb-4">
              {linkShare.title}
            </h1>
            <div className="text-xl text-gray-300">
              {renderContent(linkShare.desc)}
            </div>
          </div>
        )}

        {linkShare?.accordions && linkShare.accordions.length > 0 && (
          <div className="w-full max-w-3xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              Additional Information
            </h2>
            <div className="space-y-4">
              {linkShare.accordions.map((accordion, index) => (
                <Accordion
                  key={index}
                  title={accordion.title}
                  content={accordion.content}
                  isEditable={false}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {linkCards.map((card, index) => (
            <a
              href={card.url}
              key={index}
              className="p-2 w-full sm:w-1/2 md:w-1/3 lg:w-1/4 max-w-[400px] text-wrap"
            >
              <div className="flex justify-between rounded-lg h-full bg-[#303030] bg-opacity-60 p-4 flex-col">
                {card.thumbnail ? (
                  <img
                    src={card.thumbnail}
                    alt={card.title}
                    className="w-full object-cover h-[200px] mb-2 rounded-md"
                  />
                ) : (
                  <div className="w-full h-[200px] bg-gray-200 animate-pulse mb-2 rounded-md"></div>
                )}
                <div className="flex items-center mb-3">
                  <h2 className="text-white text-xl font-bold text-wrap w-full">
                    {extractDomain(card.title)
                      .trim()
                      .split(/\s+/)
                      .slice(0, 30)
                      .join(" ")}
                  </h2>
                </div>
                <div className="flex flex-col">
                  <p className="leading-relaxed text-base text-wrap w-full">
                    {card.description.split(" ").slice(0, 18).join(" ")}
                  </p>
                  <a
                    href={card.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 text-indigo-400 inline-flex items-center"
                  >
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
                  </a>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Accordions Section */}
      </div>
    </section>
  );
};

export default Share;
