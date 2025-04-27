import { useState, useRef, useEffect } from "react";
import Welcome from "./Welcome";

/**
 * Highlights search query matches in text
 * @param {string} text - Text to highlight
 * @param {string} query - Search query to highlight
 * @returns {JSX.Element} Text with highlighted matches
 */
const HighlightText = ({ text, query }) => {
  if (!query) return text;

  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <span key={i} className="bg-yellow-500/20 text-yellow-200 px-1 rounded">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </span>
  );
};

/**
 * Renders email content based on whether it's HTML or plain text
 * If HTML is detected, renders in iframe with isolated styles
 * If plain text, renders with text formatting and search highlighting
 */
const EmailContent = ({ content, searchQuery }) => {
  const iframeRef = useRef(null);

  // Check if content contains HTML
  const isHTML = (content) => {
    const htmlTags = [
      '<html',
      '<body',
      '<div',
      '<p>',
      '<span>',
      '<table',
      '<a href',
      '<img',
      '<br>',
      '<br/>'
    ];
    return htmlTags.some(tag => content.toLowerCase().includes(tag));
  };

  const contentIsHtml = isHTML(content);

  useEffect(() => {
    if (contentIsHtml && iframeRef.current) {
      // Get iframe document
      const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
      
      // Create a style element to reset iframe styles
      const styleReset = iframeDoc.createElement('style');
      styleReset.textContent = `
        /* Reset styles */
        body {
          margin: 0;
          padding: 16px;
          color: black;
          font-family: "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          font-size: 14px;
          line-height: 1.5;
          background: white;
        }
        /* Ensure links are visible */
        a { color: #60a5fa; }
        /* Basic table styles */
        
        /* Image max-width */
        
      `;
      
      // Extract HTML content
      let cleanContent = content;
      // Find the start of HTML content
      const htmlStart = content.toLowerCase().indexOf('<html');
      const bodyStart = content.toLowerCase().indexOf('<body');
      const divStart = content.toLowerCase().indexOf('<div');
      
      // Use the earliest valid HTML tag as the starting point
      const validStarts = [htmlStart, bodyStart, divStart].filter(pos => pos !== -1);
      if (validStarts.length > 0) {
        const startPos = Math.min(...validStarts);
        cleanContent = content.substring(startPos);
      }
      
      // Write the cleaned content to iframe
      iframeDoc.open();
      iframeDoc.write('<!DOCTYPE html><html><head></head><body>');
      iframeDoc.head.appendChild(styleReset);
      iframeDoc.write(cleanContent);
      iframeDoc.write('</body></html>');
      iframeDoc.close();

      // Adjust iframe height to content
      const resizeObserver = new ResizeObserver(() => {
        if (iframeRef.current && iframeDoc.body) {
          iframeRef.current.style.height = `${iframeDoc.body.scrollHeight}px`;
        }
      });
      
      resizeObserver.observe(iframeDoc.body);
      return () => resizeObserver.disconnect();
    }
  }, [content, contentIsHtml]);

  if (contentIsHtml) {
    return (
      <iframe
        ref={iframeRef}
        className="w-full bg-transparent"
        style={{ border: 'none', minHeight: '100px' }}
        sandbox="allow-same-origin"
        title="Email content"
      />
    );
  }

  // Plain text content with white text on black background
  return (
    <div className="whitespace-pre-wrap text-sm bg-black text-white p-4 rounded-lg leading-relaxed font-mono">
      <HighlightText text={content} query={searchQuery} />
    </div>
  );
};

/**
 * Component to display email search results with match highlighting and toggleable details
 */
export default function SearchResults({ results, searchQuery }) {
  const [expandedEmails, setExpandedEmails] = useState(new Set());

  if (!results) return null;

  if (results.length === 0) {
    return <Welcome />;
  }

  const toggleEmail = (emailId) => {
    setExpandedEmails(prev => {
      const newSet = new Set(prev);
      if (newSet.has(emailId)) {
        newSet.delete(emailId);
      } else {
        newSet.add(emailId);
      }
      return newSet;
    });
  };

  return (
    <div className="mb-6 w-full p-4">
      <h2 className="text-lg font-semibold mb-4">Search Results ({results.length})</h2>
      <div className="space-y-4">
        {results.map((email) => {
          const isExpanded = expandedEmails.has(email.id);
          
          return (
            <div 
              key={email.id} 
              className="border border-[#2a2a2a] p-4 rounded-lg bg-[#171717] shadow-sm hover:border-blue-500 transition-colors cursor-pointer"
              onClick={() => toggleEmail(email.id)}
            >
              {/* Email Header */}
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg">
                  <HighlightText text={email.subject} query={searchQuery} />
                </h3>
                <span className="text-sm text-gray-500">
                  {new Date(email.date).toLocaleDateString()}
                </span>
              </div>

              {/* Email Details */}
              <div className="text-sm text-gray-400 mb-2">
                <div>
                  From: <HighlightText text={email.from} query={searchQuery} />
                </div>
                <div>
                  To: <HighlightText text={email.to} query={searchQuery} />
                </div>
              </div>
              
              {/* Match Details - Only shown if there are actual matches */}
              {email.matchDetails && email.matchDetails.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <div className="text-sm font-medium text-blue-400 mb-2">
                    Found matches in:
                  </div>
                  <div className="space-y-2">
                    {email.matchDetails.map((detail, index) => (
                      <div 
                        key={index} 
                        className="text-sm text-gray-300 bg-gray-800/50 rounded-md px-3 py-2"
                      >
                        <HighlightText text={detail} query={searchQuery} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Email Preview - Collapsed State */}
              {!isExpanded && (
                <div className="text-gray-300 text-sm mt-3 pt-3 border-t border-gray-700">
                  <div className="text-sm font-medium text-gray-400 mb-1">
                    Preview:
                  </div>
                  <p className="line-clamp-2">
                    <HighlightText text={email.snippet} query={searchQuery} />...
                  </p>
                  <button className="text-blue-400 hover:text-blue-300 mt-2 text-sm">
                    Click to show more
                  </button>
                </div>
              )}

              {/* Full Email Content - Expanded State */}
              {isExpanded && (
                <div className="text-gray-300 mt-3 pt-3 border-t border-gray-700">
                  <div className="space-y-4">
                    {/* Full Message Content */}
                    <div>
                      <div className="text-sm font-medium text-gray-400 mb-2">
                        Full Message:
                      </div>
                      <div className="rounded-lg">
                        <EmailContent 
                          content={email.body || email.snippet} 
                          searchQuery={searchQuery}
                        />
                      </div>
                    </div>

                    {/* Additional Metadata */}
                    <div className="text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-gray-400">Date: </span>
                          {new Date(email.date).toLocaleString()}
                        </div>
                        {email.labels && (
                          <div>
                            <span className="text-gray-400">Labels: </span>
                            {email.labels.join(", ")}
                          </div>
                        )}
                      </div>
                    </div>

                    <button className="text-blue-400 hover:text-blue-300 mt-2 text-sm">
                      Click to show less
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
