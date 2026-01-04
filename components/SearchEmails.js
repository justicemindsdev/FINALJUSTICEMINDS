import { useState, useEffect, useRef } from "react";
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
  const [error, setError] = useState("");
  const [rateLimitDelay, setRateLimitDelay] = useState(500);
  const lastRequestTime = useRef(0);
  const requestCount = useRef(0);

  // Clear results when query changes with enhanced debouncing
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Clear previous results and errors if query changes
    if (searchQuery !== currentQuery) {
      onSearchResults([], null, false, "");
      setError("");
    }

    // Enhanced debounce search with rate limiting awareness
    const timeout = setTimeout(() => {
      if (searchQuery.trim() && searchQuery !== currentQuery) {
        handleSearch(null);
      }
    }, Math.max(1500, rateLimitDelay)); // Adaptive delay based on rate limit

    setSearchTimeout(timeout);

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchQuery, rateLimitDelay]);

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
   * Rate limiting queue system to prevent API abuse
   * @param {Function} requestFn - The request function to execute
   * @returns {Promise} Promise that resolves when request is safe to execute
   */
  const rateLimitedRequest = async (requestFn) => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime.current;

    // Progressive delay: increase delay as more requests are made
    requestCount.current += 1;
    const progressiveDelay = Math.min(rateLimitDelay + (requestCount.current * 100), 2000);

    // If we need to wait, add delay
    if (timeSinceLastRequest < progressiveDelay) {
      const waitTime = progressiveDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    lastRequestTime.current = Date.now();

    try {
      const result = await requestFn();
      // Gradually reduce delay on success
      setRateLimitDelay(Math.max(300, rateLimitDelay * 0.95));
      return result;
    } catch (error) {
      // Handle rate limiting errors
      if (error.response?.status === 429 || error.message?.includes('rate limit')) {
        // Exponential backoff
        const newDelay = Math.min(rateLimitDelay * 3, 60000);
        setRateLimitDelay(newDelay);
        setError(`Rate limit exceeded. Please try again in a few minutes.`);
        throw error;
      }
      throw error;
    }
  };

  /**
   * Constructs Gmail API search query for searching
   * @param {string} query - User's search input
   * @returns {string} Formatted Gmail API search query
   */
  const constructSearchQuery = (query) => {
    // Keep spaces and basic punctuation for phrase searching
    const sanitizedQuery = query.replace(/[^\w\s@.,-]/g, "").trim();

    // Simple search - Gmail will search across all fields
    // Using quotes for exact phrase matching when query has multiple words
    if (sanitizedQuery.includes(' ')) {
      return `"${sanitizedQuery}"`;
    }
    return sanitizedQuery;
  };

  /**
   * Fetches and processes search results with rate limiting
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

      // Use rate limited request
      const searchResponse = await rateLimitedRequest(() =>
        axios.get(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: {
              q: constructSearchQuery(query.trim()),
              maxResults: 10,
              pageToken: pageToken,
            },
          }
        )
      );

      const messages = searchResponse.data?.messages || [];
      
      // Store next page token for future load more requests
      setNextPageToken(searchResponse.data.nextPageToken || null);

      // Fetch and process each message with staggered requests
      const searchResults = [];
      for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        try {
          const response = await rateLimitedRequest(() =>
            axios.get(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}?format=full`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            )
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
          if (matchDetails.length > 0) {
            searchResults.push({
              id: response.data.id,
              subject,
              from,
              to,
              date: headers.find((h) => h.name === "Date")?.value,
              snippet: contentMatch || snippet, // Prioritize matched content in preview
              matchDetails,
              body: bodyContent, // Include full body for expanded view
            });
          }
        } catch (messageError) {
          console.warn(`Failed to fetch message ${message.id}:`, messageError);
          // Continue with other messages
        }
      }

      // Sort results by relevance
      const validResults = searchResults.sort((a, b) => {
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
      setError(""); // Clear any previous errors on success
    } catch (error) {
      console.error("Search failed:", error);
      
      // Handle specific error types
      if (error.response?.status === 429) {
        setError("Rate limit exceeded. Please wait before searching again.");
      } else if (error.message?.includes('rate limit')) {
        setError("Search rate limited. Retrying automatically...");
      } else {
        setError("Search failed. Please try again.");
      }
      
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
   */
  const handleSearch = async (e) => {
    if (e) {
      e.preventDefault();
    }

    if (!searchQuery.trim() || isSearching) return;

    setIsSearching(true);
    setCurrentQuery(searchQuery); // Store current query for load more
    setNextPageToken(null); // Reset pagination for new search
    requestCount.current = 0; // Reset request count for new search
    setError(""); // Clear previous errors
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
      
      {error && (
        <div className="mt-2 p-3 rounded-lg bg-red-900/20 border border-red-500 text-red-300">
          {error}
        </div>
      )}
      
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
