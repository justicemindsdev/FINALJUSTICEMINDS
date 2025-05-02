import { useState } from "react";
import axios from "axios";
import { IoSearch } from "react-icons/io5";
import { Button } from "./ui/button.jsx";
import ShareDialog from './ShareDialogue';
import { IoIosAddCircleOutline } from "react-icons/io";

/**
 * Component to search for contacts (email addresses) in Gmail
 */
export default function SearchContacts({ onEmailClick, userId }) {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [currentQuery, setCurrentQuery] = useState("");
  const [nextPageToken, setNextPageToken] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [processedMessageIds, setProcessedMessageIds] = useState(new Set());
  const [error, setError] = useState(null);

  // Previous functions remain the same...
  const handleApiError = async (error) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      
      if (status === 401) {
        localStorage.removeItem('access_token');
        setError("Session expired. Please refresh the page to sign in again.");
        return false;
      }
      
      if (status === 429) {
        setError("Rate limit exceeded. Please try again in a few minutes.");
        return false;
      }

      if (status === 400) {
        setError("Invalid request. Please check your search query.");
        return false;
      }

      if (status === 403) {
        setError("Access denied. Please check your permissions.");
        return false;
      }

      if (status === 404) {
        return true;
      }

      if (status >= 500) {
        setError("Server error. Please try again later.");
        return false;
      }
    }

    setError("An error occurred. Please check your connection and try again.");
    return false;
  };

  const getRelevanceScore = (contact, query) => {
    const lowerQuery = query.toLowerCase();
    const lowerName = (contact.name || "").toLowerCase();
    const lowerEmail = contact.email.toLowerCase();
    let score = 0;

    if (lowerName === lowerQuery || lowerEmail === lowerQuery) {
      score += 100;
    }

    if (lowerName.startsWith(lowerQuery)) {
      score += 50;
    }

    if (lowerEmail.startsWith(lowerQuery)) {
      score += 40;
    }

    const queryWords = lowerQuery.split(/\s+/);
    const allWordsMatch = queryWords.every(
      (word) => lowerName.includes(word) || lowerEmail.includes(word)
    );
    if (allWordsMatch) {
      score += 30;
    }

    if (lowerName.includes(lowerQuery)) {
      score += 20;
    }

    if (lowerEmail.includes(lowerQuery)) {
      score += 10;
    }

    queryWords.forEach((word) => {
      if (word.length > 1) {
        if (lowerName.includes(word)) score += 5;
        if (lowerEmail.includes(word)) score += 3;
      }
    });

    return score;
  };

  const matchesQuery = (contact, query) => {
    const lowerQuery = query.toLowerCase();
    const lowerName = (contact.name || "").toLowerCase();
    const lowerEmail = contact.email.toLowerCase();

    const queryWords = lowerQuery.split(/\s+/);
    return queryWords.every(
      (word) => lowerName.includes(word) || lowerEmail.includes(word)
    );
  };

  const extractUniqueContacts = async (messages, accessToken) => {
    const contactsMap = new Map();
    const errors = [];

    await Promise.all(
      messages.map(async (message) => {
        if (processedMessageIds.has(message.id)) {
          return;
        }

        try {
          const response = await axios.get(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
            { 
              headers: { Authorization: `Bearer ${accessToken}` },
              timeout: 10000
            }
          );

          const headers = response.data.payload.headers;
          const from = headers.find((h) => h.name === "From")?.value;
          const to = headers.find((h) => h.name === "To")?.value;

          const parseEmailAddress = (header) => {
            if (!header) return null;
            const match = header.match(/([^<]+)?<?([^>]+@[^>]+)>?/);
            if (match) {
              return {
                name: match[1]?.trim() || match[2].split("@")[0],
                email: match[2].trim(),
              };
            }
            return null;
          };

          const fromContact = parseEmailAddress(from);
          if (fromContact && !contactsMap.has(fromContact.email)) {
            contactsMap.set(fromContact.email, fromContact);
          }

          const toAddresses = to?.split(",") || [];
          toAddresses.forEach((address) => {
            const toContact = parseEmailAddress(address);
            if (toContact && !contactsMap.has(toContact.email)) {
              contactsMap.set(toContact.email, toContact);
            }
          });
        } catch (error) {
          const shouldContinue = await handleApiError(error);
          if (!shouldContinue) {
            errors.push(error);
          }
        }
      })
    );

    if (errors.length === messages.length) {
      throw new Error("Failed to process any messages");
    }

    messages.forEach((message) => {
      processedMessageIds.add(message.id);
    });

    return Array.from(contactsMap.values());
  };

  const constructSearchQuery = (query) => {
    const sanitizedQuery = query.replace(/[^\w\s@.-]/g, "").trim();
    return `{from:${sanitizedQuery} OR to:${sanitizedQuery}} in:anywhere`;
  };

  const retryWithBackoff = async (operation, maxAttempts = 3) => {
    let lastError;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxAttempts) break;
        
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  };

  const fetchSearchResults = async (query, pageToken = null, isLoadMore = false) => {
    setError(null);
    
    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        throw new Error("Not authenticated");
      }

      const searchResponse = await retryWithBackoff(async () => {
        return await axios.get(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: {
              q: constructSearchQuery(query),
              maxResults: 50,
              pageToken: pageToken,
            },
            timeout: 10000
          }
        );
      });

      const messages = searchResponse.data?.messages || [];
      setNextPageToken(searchResponse.data.nextPageToken || null);

      const contacts = await extractUniqueContacts(messages, accessToken);
      const matchingContacts = contacts.filter((contact) =>
        matchesQuery(contact, query)
      );

      const sortedContacts = matchingContacts.sort((a, b) => {
        const scoreA = getRelevanceScore(a, query);
        const scoreB = getRelevanceScore(b, query);
        return scoreB - scoreA;
      });

      if (isLoadMore) {
        setSearchResults((prev) => {
          const combined = [...prev, ...sortedContacts];
          const uniqueEmails = new Set();
          return combined.filter((contact) => {
            if (uniqueEmails.has(contact.email)) return false;
            uniqueEmails.add(contact.email);
            return true;
          });
        });
      } else {
        setProcessedMessageIds(new Set());
        setSearchResults(sortedContacts);
      }
    } catch (error) {
      await handleApiError(error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
    if (e.target.value !== currentQuery) {
      setSearchResults([]);
      setNextPageToken(null);
      setProcessedMessageIds(new Set());
      setError(null);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim() || isSearching) return;

    setIsSearching(true);
    setCurrentQuery(searchQuery);
    setNextPageToken(null);
    await fetchSearchResults(searchQuery);
  };

  const handleLoadMore = async () => {
    if (!nextPageToken || !currentQuery || isSearching) return;

    setIsSearching(true);
    await fetchSearchResults(currentQuery, nextPageToken, true);
  };

  return (
    <>
      <div className="flex flex-col gap-3 bg-[#1a1a1a] p-3 max-w-[400px] min-w-[250px] max-h-[400px]">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            placeholder="Search contacts..."
            className="flex-1 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-black text-white border-2 border-[#1d1d1d]"
          />
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className={`px-4 py-2 rounded-lg bg-[#000000] border-2 border-[#1d1d1d] text-white font-medium hover:bg-[#484848] transition-colors
              ${isSearching || !searchQuery.trim() ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isSearching ? "..." : <IoSearch />}
          </button>
        </form>

        {error && (
          <div className="bg-red-900/20 border border-red-900/50 text-red-500 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {searchResults.length > 0 && (
          <>
            <div className="flex flex-col gap-3 overflow-y-auto">
              {searchResults.map((contact, index) => (
                <div
                  key={index}
                  className="bg-[#020202] hover:bg-[#323232] border-2 border-[#141414] max-w-full rounded-lg flex items-center justify-between p-3"
                >
                  <button
                    onClick={() => {
                      const name = contact.name || contact.email.split("@")[0];
                      onEmailClick(contact.email, name);
                    }}
                    className="flex flex-col gap-1 items-start text-left"
                  >
                    <span className="font-medium capitalize">
                      {contact.name || contact.email.split("@")[0]}
                    </span>
                    <span className="text-sm opacity-90 text-[#B0B0B0]">
                      {contact.email}
                    </span>
                  </button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEmail(contact.email);
                      setIsShareDialogOpen(true);
                    }}
                    variant="ghost"
                    className="ml-2 hover:bg-[#ffffff] p-2"
                  >
                    <IoIosAddCircleOutline />
                  </Button>
                </div>
              ))}
            </div>

            {nextPageToken && currentQuery && searchResults.length > 0 && (
              <button
                onClick={handleLoadMore}
                disabled={isSearching}
                className={`mt-2 px-4 py-2 rounded-lg bg-[#0e0e0e] border-2 border-[#1d1d1d] text-white font-medium hover:bg-[#484848] transition-colors
                ${isSearching ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isSearching ? "Loading..." : "Load More"}
              </button>
            )}
          </>
        )}
      </div>
      <ShareDialog
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        email={selectedEmail}
        userId={userId}
      />
    </>
  );
}
