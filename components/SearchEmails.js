import { useState, useEffect } from "react";
import axios from "axios";

/**
 * Global search component for Gmail
 * Searches through all email content including body text, subjects, names, and addresses
 */
export default function SearchEmails({ onSearchResults }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [currentQuery, setCurrentQuery] = useState("");
  const [nextPageToken, setNextPageToken] = useState(null);
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Clear results when query changes
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Clear previous results if query changes
    if (searchQuery !== currentQuery) {
      onSearchResults([], null, false, "");
    }

    // Debounce search for better performance
    const timeout = setTimeout(() => {
      if (searchQuery.trim() && searchQuery !== currentQuery) {
        handleSearch(null, true); // Pass true to indicate it's from query change
      }
    }, 500);

    setSearchTimeout(timeout);

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchQuery]);

  /**
   * Checks if text contains the exact search phrase
   * @param {string} text - Text to search in
   * @param {string} query - Search query
   * @returns {boolean} Whether the text contains the exact phrase
   */
  const hasMatch = (text, query) => {
    if (!text || !query) return false;
    return text.toLowerCase().includes(query.toLowerCase());
  };

  /**
   * Extracts matching text with surrounding context
   * @param {string} text - Text to search in
   * @param {string} query - Search query
   * @returns {string|null} Text with highlighted match context or null if no match
   */
  const getMatchContext = (text, query) => {
    if (!text || !hasMatch(text, query)) return null;

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);

    // Get more surrounding context (100 chars before and after)
    const start = Math.max(0, index - 100);
    const end = Math.min(text.length, index + query.length + 100);

    return (
      (start > 0 ? "..." : "") +
      text.slice(start, end) +
      (end < text.length ? "..." : "")
    );
  };

  /**
   * Constructs Gmail API search query for exact phrase matching
   * @param {string} query - User's search input
   * @returns {string} Formatted Gmail API search query
   */
  const constructSearchQuery = (query) => {
    // Keep spaces and basic punctuation for phrase searching
    const sanitizedQuery = query.replace(/[^\w\s@.,-]/g, "").trim();
    
    // Wrap the query in quotes for exact phrase matching
    return `{"${sanitizedQuery}" OR 
      subject:"${sanitizedQuery}" OR 
      from:"${sanitizedQuery}" OR 
      to:"${sanitizedQuery}" OR 
      body:"${sanitizedQuery}"} in:anywhere`;
  };

  /**
   * Fetches and processes search results
   * @param {string} query - Search query
   * @param {string|null} pageToken - Token for pagination
   * @param {boolean} isLoadMore - Whether this is a load more request
   */
  const fetchSearchResults = async (query, pageToken = null, isLoadMore = false) => {
    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        throw new Error("Not authenticated");
      }

      const searchResponse = await axios.get(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: {
            q: constructSearchQuery(query.trim()),
            maxResults: 20,
            pageToken: pageToken,
          },
        }
      );

      const messages = searchResponse.data?.messages || [];
      
      // Store next page token for future load more requests
      setNextPageToken(searchResponse.data.nextPageToken || null);

      // Fetch and process each message
      const searchResults = await Promise.all(
        messages.map(async (message) => {
          const response = await axios.get(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}?format=full`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );

          const headers = response.data.payload.headers;
          const from = headers.find((h) => h.name === "From")?.value || "";
          const to = headers.find((h) => h.name === "To")?.value || "";
          const subject = headers.find((h) => h.name === "Subject")?.value || "";
          const snippet = response.data.snippet || "";

          // Extract full message content including body
          let bodyContent = "";
          const extractContent = (part) => {
            if (part.body?.data) {
              bodyContent += Buffer.from(part.body.data, 'base64').toString('utf8');
            }
            if (part.parts) {
              part.parts.forEach(extractContent);
            }
          };
          
          extractContent(response.data.payload);

          // Find exact phrase matches in all content
          const matchDetails = [];

          // Check sender details (both name and email)
          const fromMatch = getMatchContext(from, query);
          if (fromMatch) {
            matchDetails.push(`Sender: ${fromMatch}`);
          }

          // Check recipient details (both name and email)
          const toMatch = getMatchContext(to, query);
          if (toMatch) {
            matchDetails.push(`Recipient: ${toMatch}`);
          }

          // Check subject
          const subjectMatch = getMatchContext(subject, query);
          if (subjectMatch) {
            matchDetails.push(`Subject: ${subjectMatch}`);
          }

          // Check email content (both snippet and full body)
          const contentMatch = getMatchContext(bodyContent, query) || getMatchContext(snippet, query);
          if (contentMatch) {
            matchDetails.push(`Content: ${contentMatch}`);
          }

          // Only include emails that have exact phrase matches
          if (matchDetails.length === 0) {
            return null;
          }

          return {
            id: response.data.id,
            subject,
            from,
            to,
            date: headers.find((h) => h.name === "Date")?.value,
            snippet: contentMatch || snippet, // Prioritize matched content in preview
            matchDetails,
            body: bodyContent, // Include full body for expanded view
          };
        })
      );

      // Filter out null results and sort by relevance
      const validResults = searchResults
        .filter((result) => result !== null)
        .sort((a, b) => {
          // Prioritize exact phrase matches in subject and content
          const aSubjectMatch = hasMatch(a.subject, query);
          const bSubjectMatch = hasMatch(b.subject, query);
          const aContentMatch = hasMatch(a.snippet, query);
          const bContentMatch = hasMatch(b.snippet, query);

          if (aSubjectMatch && !bSubjectMatch) return -1;
          if (!aSubjectMatch && bSubjectMatch) return 1;
          if (aContentMatch && !bContentMatch) return -1;
          if (!aContentMatch && bContentMatch) return 1;
          return 0;
        });

      // Pass results, nextPageToken, isLoadMore flag, and the current query
      onSearchResults(validResults, searchResponse.data.nextPageToken, isLoadMore, query);
    } catch (error) {
      console.error("Search failed:", error);
      // Clear results and token on error
      setNextPageToken(null);
      onSearchResults([], null, false, "");
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * Handles the search submission
   * @param {Event} e - Form submit event
   * @param {boolean} fromQueryChange - Whether the search is triggered by query change
   */
  const handleSearch = async (e, fromQueryChange = false) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!searchQuery.trim() || isSearching) return;

    setIsSearching(true);
    setCurrentQuery(searchQuery); // Store current query for load more
    setNextPageToken(null); // Reset pagination for new search
    await fetchSearchResults(searchQuery);
  };

  /**
   * Handles loading more results
   */
  const handleLoadMore = async () => {
    if (!nextPageToken || !currentQuery || isSearching) return;
    
    setIsSearching(true);
    await fetchSearchResults(currentQuery, nextPageToken, true);
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSearch} className="flex gap-2 w-full">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search any text or phrase in emails..."
          className="flex-1 px-4 py-2 w-1/2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-black text-white border-2 border-[#1d1d1d] "
        />
        <button
          type="submit"
          disabled={isSearching}
          className={`px-6 py-2 rounded-lg bg-[#1d1d1d] border-2 border-[#1d1d1d] text-white font-medium hover:bg-[#484848] transition-colors
            ${isSearching ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {isSearching ? "Searching..." : "Search"}
        </button>
      </form>
      {nextPageToken && currentQuery && (
        <button
          onClick={handleLoadMore}
          disabled={isSearching}
          className={`mt-4 px-6 py-2 rounded-lg bg-[#1d1d1d] border-2 border-[#1d1d1d] text-white font-medium hover:bg-[#484848] transition-colors
            ${isSearching ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {isSearching ? "Loading more..." : "Load More Results"}
        </button>
      )}
    </div>
  );
}
