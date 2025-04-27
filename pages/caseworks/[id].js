import { supabase } from "@/lib/supabase";
import Head from "next/head";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const Caseworks = () => {
  const router = useRouter();
  const { id } = router.query;
  const [details, setDetails] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [columnLayout, setColumnLayout] = useState(2); // Default to 2 columns

  const isHTML = (str) => {
    if (typeof window !== "undefined") {
      const doc = new DOMParser().parseFromString(str, "text/html");
      return Array.from(doc.body.childNodes).some(
        (node) => node.nodeType === 1
      );
    }
    return false;
  };

  const splitContentIntoColumns = (content, numColumns) => {
    if (typeof content !== "string") return Array(numColumns).fill("");

    const words = content.split(" ");
    const wordsPerColumn = Math.ceil(words.length / numColumns);
    const columns = [];

    for (let i = 0; i < numColumns; i++) {
      const startIndex = i * wordsPerColumn;
      const columnContent = words
        .slice(startIndex, startIndex + wordsPerColumn)
        .join(" ");
      columns.push(columnContent);
    }

    return columns;
  };

  const LayoutButton = ({ columns, currentLayout, onClick }) => (
    <button
      onClick={() => onClick(columns)}
      className={`px-4 py-2 rounded-md mr-2 transition-colors ${
        currentLayout === columns
          ? "bg-blue-600 text-white"
          : "bg-[#252525] text-gray-300 hover:bg-gray-700"
      }`}
    >
      {columns} Column{columns > 1 ? "s" : ""}
    </button>
  );

  const MarkdownContent = ({ content }) => {
    const columns = splitContentIntoColumns(content, columnLayout);

    return (
      <div
        className={`grid grid-cols-1 md:grid-cols-${columnLayout} gap-3 prose prose-invert max-w-none`}
      >
        {columns.map((column, index) => (
          <div key={index} className="column-content">
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
                  <h2
                    className="text-white mt-5 mb-3 text-xl font-bold"
                    {...props}
                  />
                ),
                h3: ({ node, ...props }) => (
                  <h3
                    className="text-white mt-4 mb-2 text-lg font-bold"
                    {...props}
                  />
                ),
                p: ({ node, ...props }) => (
                  <p
                    className="text-gray-300 my-3 leading-relaxed"
                    {...props}
                  />
                ),
                ul: ({ node, ...props }) => (
                  <ul
                    className="list-disc list-inside my-3 space-y-1"
                    {...props}
                  />
                ),
                ol: ({ node, ...props }) => (
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
              {column}
            </ReactMarkdown>
          </div>
        ))}
      </div>
    );
  };

  const renderContent = (content) => {
    if (isHTML(content)) {
      const columns = splitContentIntoColumns(content, columnLayout);
      return (
        <>
          {columnLayout === 1 ? (
            <div
              className={`grid md:grid-cols-1 grid-cols-1 gap-3`}
              style={{ fontFamily: "IBM Plex Serif" }}
            >
              {columns.map((column, index) => (
                <div
                  key={index}
                  className="column-content prose lg:prose-md max-w-none bg-[#252525] p-5 rounded-lg"
                  dangerouslySetInnerHTML={{ __html: column }}
                />
              ))}
            </div>
          ) : columnLayout === 2 ? (
            <div
              className={`grid md:grid-cols-2 grid-cols-1 gap-3`}
              style={{ fontFamily: "IBM Plex Serif" }}
            >
              {columns.map((column, index) => (
                <div
                  key={index}
                  className="column-content prose lg:prose-md max-w-none bg-[#252525] p-5 rounded-lg"
                  dangerouslySetInnerHTML={{ __html: column }}
                />
              ))}
            </div>
          ) : (
            <div
              className={`grid md:grid-cols-3 grid-cols-1 gap-3`}
              style={{ fontFamily: "IBM Plex Serif" }}
            >
              {columns.map((column, index) => (
                <div
                  key={index}
                  className="column-content prose lg:prose-md max-w-none bg-[#252525] p-5 rounded-lg"
                  dangerouslySetInnerHTML={{ __html: column }}
                />
              ))}
            </div>
          )}
        </>
      );
    }
    return <MarkdownContent content={content} />;
  };

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setIsLoading(true);
        if (id) {
          const { data, error } = await supabase
            .from("caseworks")
            .select("*")
            .eq("id", id)
            .single();
          if (error) {
            console.error("Error fetching details:", error);
          } else {
            setDetails(data);
            console.log("Data fetched:", data);
          }
        } else {
          console.log("No ID provided");
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  return (
    <div>
      <Head>
        <title>{details.title}</title>
      </Head>
      {!isLoading ? (
        <>
          <div className="flex flex-col justify-center w-[80%] mx-auto">
            <div className="flex justify-between items-center mt-4 mb-10">
              <img src="/logomain.png" width={"90px"} className="" alt="" />
              <a
                href="mailto:justice@justice-minds.com"
                className="bg-[#1d1d1d] text-white px-4 py-2 rounded-md hover:bg-gray-500 transition-colors"
              >
                Contact Us
              </a>
            </div>
            <div className="flex flex-col bg-[#1d1d1d] border border-[#343434] p-6 rounded-lg w-full">
              {details?.cover_image_url && (
                <div className="w-full h-[300px] relative mb-2">
                  <img
                    src={
                      supabase.storage
                        .from("caseworks")
                        .getPublicUrl(details?.cover_image_url).data.publicUrl
                    }
                    alt={details?.title}
                    className="w-full h-full object-cover rounded-md pb-5"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/placeholder-image.jpg";
                    }}
                  />
                </div>
              )}
              <h1 className="text-3xl font-bold mb-4">{details.title}</h1>
              <marquee className="text-lg text-gray-300 mb-6">
                {details.description}
              </marquee>

              <div className="flex mb-4">
                <LayoutButton
                  columns={1}
                  currentLayout={columnLayout}
                  onClick={setColumnLayout}
                />
                <LayoutButton
                  columns={2}
                  currentLayout={columnLayout}
                  onClick={setColumnLayout}
                />
                <LayoutButton
                  columns={3}
                  currentLayout={columnLayout}
                  onClick={setColumnLayout}
                />
              </div>

              <div className="text-base leading-relaxed text-left">
                {renderContent(details?.content)}
              </div>
            </div>
          </div>
        </>
      ) : (
        <p className="flex justify-center py-10">Loading</p>
      )}
    </div>
  );
};

export default Caseworks;
