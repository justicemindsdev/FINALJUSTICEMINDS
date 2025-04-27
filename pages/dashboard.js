import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { Geist, Geist_Mono } from "next/font/google";
import { Progress } from "@/components/ui/progress";
import { withAuth } from "@/lib/authUtils";
import { Menu, X } from "lucide-react";

// Font setup
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Components
import UserHeader from "@/components/UserHeader";
import EmailAddressList from "@/components/EmailAddressList";
import EmailList from "@/components/EmailList";
import SearchEmails from "@/components/SearchEmails";
import SearchResults from "@/components/SearchResults";
import SearchContacts from "@/components/SearchContacts";
import ClientProfile from "@/components/ClientProfile";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import Navbar from "@/components/Navbar";
import Welcome from "@/components/Welcome";
import { Button } from "@/components/ui/button";
import ShareDialog from "@/components/ShareDialogue";

// Utils
import { parseEmailAddresses, formatEmailData } from "@/lib/emailUtils";

const checkAuthToken = () => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    const user = localStorage.getItem("user");
    return token || user;
  }
  return null;
};

function Dashboard({ user }) {
  const [sentEmails, setSentEmails] = useState([]);
  const [receivedEmails, setReceivedEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [contactLoading, setContactLoading] = useState(false);
  const [uniqueContacts, setUniqueContacts] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [currentSearchQuery, setCurrentSearchQuery] = useState("");
  const [selectedReceivedNextPageToken, setSelectedReceivedNextPageToken] =
    useState(null);
  const [selectedSentNextPageToken, setSelectedSentNextPageToken] =
    useState(null);
  const router = useRouter();

  const [progress, setProgress] = useState(30);

  useEffect(() => {
    const timer = setTimeout(() => setProgress(100), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const token = checkAuthToken();
    if (!token) {
      router.push("/auth/login");
    }
  }, [router]);

  useEffect(() => {
    const initializeData = async () => {
      try {
        await fetchEmailBatch();
        setLoading(false);
      } catch (error) {
        console.error("Failed to initialize data:", error);
        handleLogout();
      }
    };

    initializeData();
  }, []);

  const deleteCookie = (name) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  };

  const handleLogout = () => {
    localStorage.clear();
    deleteCookie("access_token");
    router.push("/");
  };

  const fetchEmailBatch = async (pageToken = null) => {
    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) throw new Error("Not authenticated");

      // Fetch received emails
      const receivedResponse = await axios.get(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: {
            q: "",
            maxResults: 10,
            pageToken: pageToken,
          },
        }
      );

      const receivedMessages = receivedResponse.data?.messages || [];
      const receivedDetails = await Promise.all(
        receivedMessages.map(async (message) => {
          const response = await axios.get(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          return response.data;
        })
      );

      const formattedReceivedEmails = receivedDetails.map((email) =>
        formatEmailData(email, "received")
      );

      // Fetch sent emails
      const sentResponse = await axios.get(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: {
            q: "in:sent",
            maxResults: 10,
            pageToken: pageToken,
          },
        }
      );

      const sentMessages = sentResponse.data?.messages || [];
      const sentDetails = await Promise.all(
        sentMessages.map(async (message) => {
          const response = await axios.get(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          return response.data;
        })
      );

      const formattedSentEmails = sentDetails.map((email) =>
        formatEmailData(email, "sent")
      );

      // Extract unique contacts with names
      const contactsMap = new Map();

      formattedReceivedEmails.forEach((email) => {
        email.fromEmails.forEach(({ email: addr, name }) => {
          if (!contactsMap.has(addr)) {
            contactsMap.set(addr, { email: addr, name });
          } else if (!contactsMap.get(addr).name && name) {
            contactsMap.get(addr).name = name;
          }
        });
      });

      formattedSentEmails.forEach((email) => {
        email.toEmails.forEach(({ email: addr, name }) => {
          if (!contactsMap.has(addr)) {
            contactsMap.set(addr, { email: addr, name });
          } else if (!contactsMap.get(addr).name && name) {
            contactsMap.get(addr).name = name;
          }
        });
      });

      const newContacts = Array.from(contactsMap.values());

      if (pageToken) {
        setReceivedEmails((prev) => [...prev, ...formattedReceivedEmails]);
        setSentEmails((prev) => [...prev, ...formattedSentEmails]);
        setUniqueContacts((prev) => {
          const combined = [...prev, ...newContacts];
          const uniqueEmails = new Set();
          return combined.filter((contact) => {
            if (uniqueEmails.has(contact.email)) return false;
            uniqueEmails.add(contact.email);
            return true;
          });
        });
      } else {
        setReceivedEmails(formattedReceivedEmails);
        setSentEmails(formattedSentEmails);
        setUniqueContacts(newContacts);
      }

      setNextPageToken(receivedResponse.data.nextPageToken || null);
    } catch (error) {
      console.error("Failed to fetch email batch:", error);
      throw error;
    }
  };

  const handleLoadMore = async () => {
    if (!nextPageToken || isLoadingMore) return;

    try {
      setIsLoadingMore(true);
      await fetchEmailBatch(nextPageToken);
    } catch (error) {
      console.error("Failed to load more:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const fetchEmailsForContact = async (
    emailId,
    receivedPageToken = null,
    sentPageToken = null
  ) => {
    const accessToken = localStorage.getItem("access_token");
    try {
      // Fetch received emails
      const receivedResponse = await axios.get(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: {
            q: `from:(${emailId})`,
            maxResults: 10,
            pageToken: receivedPageToken,
          },
        }
      );

      const receivedMessages = receivedResponse.data?.messages || [];
      const receivedDetails = await Promise.all(
        receivedMessages.map(async (message) => {
          const response = await axios.get(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          return response.data;
        })
      );

      const formattedReceivedEmails = receivedDetails.map((email) =>
        formatEmailData(email, "received")
      );

      // Fetch sent emails
      const sentResponse = await axios.get(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: {
            q: `to:(${emailId})`,
            maxResults: 10,
            pageToken: sentPageToken,
          },
        }
      );

      const sentMessages = sentResponse.data?.messages || [];
      const sentDetails = await Promise.all(
        sentMessages.map(async (message) => {
          const response = await axios.get(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          return response.data;
        })
      );

      const formattedSentEmails = sentDetails.map((email) =>
        formatEmailData(email, "sent")
      );

      return {
        receivedEmails: formattedReceivedEmails,
        sentEmails: formattedSentEmails,
        nextReceivedPageToken: receivedResponse.data.nextPageToken || null,
        nextSentPageToken: sentResponse.data.nextPageToken || null,
      };
    } catch (error) {
      console.error("Failed to fetch emails for contact:", error);
      throw error;
    }
  };

  const handleLoadMoreReceivedEmails = async () => {
    if (!selectedReceivedNextPageToken || isLoadingMore) return;

    try {
      setIsLoadingMore(true);
      const {
        receivedEmails,
        sentEmails,
        nextReceivedPageToken,
        nextSentPageToken,
      } = await fetchEmailsForContact(
        selectedEmail.email,
        selectedReceivedNextPageToken,
        null
      );

      setSelectedEmail((prev) => ({
        ...prev,
        receivedEmails: [...prev.receivedEmails, ...receivedEmails],
      }));
      setSelectedReceivedNextPageToken(nextReceivedPageToken);
    } catch (error) {
      console.error("Failed to load more received emails:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleLoadMoreSentEmails = async () => {
    if (!selectedSentNextPageToken || isLoadingMore) return;

    try {
      setIsLoadingMore(true);
      const {
        receivedEmails,
        sentEmails,
        nextReceivedPageToken,
        nextSentPageToken,
      } = await fetchEmailsForContact(
        selectedEmail.email,
        null,
        selectedSentNextPageToken
      );

      setSelectedEmail((prev) => ({
        ...prev,
        sentEmails: [...prev.sentEmails, ...sentEmails],
      }));
      setSelectedSentNextPageToken(nextSentPageToken);
    } catch (error) {
      console.error("Failed to load more sent emails:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleEmailClick = async (emailId, name) => {
    setSearchResults(null);
    setContactLoading(true);
    setSelectedEmail(null);
    if (isMobile) {
      setIsSidebarOpen(false);
    }

    try {
      const contactName =
        name ||
        uniqueContacts.find((contact) => contact.email === emailId)?.name ||
        emailId.split("@")[0];

      // Fetch emails for the selected address
      const {
        receivedEmails,
        sentEmails,
        nextReceivedPageToken,
        nextSentPageToken,
      } = await fetchEmailsForContact(emailId);

      setSelectedEmail({
        email: emailId,
        name: contactName,
        receivedEmails: receivedEmails,
        sentEmails: sentEmails,
      });
      setSelectedReceivedNextPageToken(nextReceivedPageToken);
      setSelectedSentNextPageToken(nextSentPageToken);
    } catch (error) {
      console.error("Failed to fetch emails for the selected address:", error);
    } finally {
      setContactLoading(false);
    }
  };

  const handleSearchResults = (
    results,
    token,
    isLoadMore = false,
    query = ""
  ) => {
    if (isLoadMore) {
      setSearchResults((prev) => [...prev, ...results]);
    } else {
      setSearchResults(results);
      setSelectedEmail(null);
      setCurrentSearchQuery(query);
    }
  };

  if (loading) {
    return <Progress value={progress} className="w-full mt-10" />;
  }

  return (
    <>
      <div
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0C0C0C] overflow-hidden`}
        style={{ height: "100vh" }}
      >
        <Navbar 
          user={user} 
          onLogout={handleLogout}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
        />

        <div className="w-full h-screen pt-16">
          {isMobile ? (
            <div className="flex flex-col h-full">
              {/* Mobile Sidebar */}
              <div 
                className={`
                  fixed inset-y-0 left-0 z-[46] w-[300px] bg-[#0C0C0C] border-r border-[#222222]
                  transition-transform duration-300 ease-in-out transform
                  ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                  pt-16 pb-4
                `}
              >
                <div className="h-[100vh] flex flex-col overflow-hidden">
                  <SearchContacts onEmailClick={handleEmailClick} userId={user.id} />
                  <div className="flex-1 overflow-y-auto">
                    <EmailAddressList
                      contacts={uniqueContacts}
                      onEmailClick={handleEmailClick}
                      onLoadMore={handleLoadMore}
                      isLoading={isLoadingMore}
                      userId={user.id}
                    />
                  </div>
                </div>
              </div>

              {/* Mobile Main Content */}
              <div className={`
                flex-1 overflow-hidden transition-all duration-300 ease-in-out
                ${isSidebarOpen ? 'md:pl-64' : 'pl-0'}
                relative
              `}>
                {/* Overlay when sidebar is open on mobile */}
                {isSidebarOpen && (
                  <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                  />
                )}
                <div className="h-full flex flex-col">
                  <div className="flex-none p-3 border-b border-[#161616]">
                    <SearchEmails onSearchResults={handleSearchResults} />
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {searchResults ? (
                      <SearchResults
                        results={searchResults}
                        searchQuery={currentSearchQuery}
                      />
                    ) : (
                      <>
                        {contactLoading ? (
                          <div role="">
                            <svg
                              aria-hidden="true"
                              className="w-8 h-8 status mx-auto mt-10 text-gray-700 animate-spin dark:text-gray-600 fill-white"
                              viewBox="0 0 100 101"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                                fill="currentColor"
                              />
                              <path
                                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                                fill="currentFill"
                              />
                            </svg>
                            <span className="sr-only">Loading...</span>
                          </div>
                        ) : selectedEmail ? (
                          <>
                            <div className="flex justify-start w-full p-4 border-b border-[#222222]">
                              <Button
                                className="px-6 py-2 rounded-lg bg-[#1d1d1d] border-2 border-[#1d1d1d] text-white font-medium hover:bg-[#484848] transition-colors mr-2"
                                asChild
                              >
                                <a
                                  target="_blank"
                                  href={`/share?selectedEmail=${selectedEmail.email}&access=${user?.id}`}
                                >
                                  Share
                                </a>
                              </Button>
                              <Button
                                className="px-6 py-2 rounded-lg bg-[#1d1d1d] border-2 border-[#1d1d1d] text-white font-medium hover:bg-[#484848] transition-colors"
                                onClick={() => setShowShareDialog(true)}
                              >
                                Add to Share List &nbsp;+
                              </Button>
                            </div>

                            <ShareDialog
                              isOpen={showShareDialog}
                              onClose={() => setShowShareDialog(false)}
                              email={selectedEmail.email}
                              userId={user?.id}
                            />

                            <ClientProfile
                              email={selectedEmail.email}
                              name={selectedEmail.name}
                            />

                            <div className="p-4">
                              <EmailList
                                em={selectedEmail.email}
                                title={`Received Emails with ${selectedEmail.name}`}
                                emails={[
                                  ...selectedEmail.sentEmails,
                                  ...selectedEmail.receivedEmails,
                                ]}
                                receivedemails={selectedEmail.receivedEmails}
                                sentemails={selectedEmail.sentEmails}
                                rToken={selectedReceivedNextPageToken}
                                sToken={selectedSentNextPageToken}
                                lmremails={handleLoadMoreReceivedEmails}
                                lmsemails={handleLoadMoreSentEmails}
                                isPublic={false}
                              />
                            </div>
                          </>
                        ) : (
                          <Welcome />
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Desktop Layout
            <ResizablePanelGroup
              direction="horizontal"
              className="h-full"
            >
              <ResizablePanel defaultSize={22}>
                <div className="h-full flex flex-col overflow-hidden">
                  <SearchContacts onEmailClick={handleEmailClick} userId={user.id} />
                  <div className="flex-1">
                    <EmailAddressList
                      contacts={uniqueContacts}
                      onEmailClick={handleEmailClick}
                      onLoadMore={handleLoadMore}
                      isLoading={isLoadingMore}
                      userId={user.id}
                    />
                  </div>
                </div>
              </ResizablePanel>
              <ResizableHandle className="bg-[#1d1d1d]" />
              <ResizablePanel defaultSize={78}>
                <ResizablePanelGroup direction="vertical">
                  <ResizablePanel defaultSize={20}>
                    <div className="flex h-full items-center justify-center p-3 border-b-2 border-[#161616]">
                      <SearchEmails onSearchResults={handleSearchResults} />
                    </div>
                  </ResizablePanel>
                  <ResizablePanel defaultSize={80}>
                    <div className="flex flex-col h-full overflow-y-auto relative">
                      {searchResults ? (
                        <SearchResults
                          results={searchResults}
                          searchQuery={currentSearchQuery}
                        />
                      ) : (
                        <>
                          {contactLoading ? (
                            <div role="">
                              <svg
                                aria-hidden="true"
                                className="w-8 h-8 status mx-auto mt-10 text-gray-700 animate-spin dark:text-gray-600 fill-white"
                                viewBox="0 0 100 101"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                                  fill="currentColor"
                                />
                                <path
                                  d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                                  fill="currentFill"
                                />
                              </svg>
                              <span className="sr-only">Loading...</span>
                            </div>
                          ) : selectedEmail ? (
                            <>
                              <div className="flex absolute top-3 right-3 justify-end w-full">
                                <Button
                                  className="px-6 py-2 rounded-lg bg-[#1d1d1d] border-2 border-[#1d1d1d] text-white font-medium hover:bg-[#484848] transition-colors mr-2"
                                  asChild
                                >
                                  <a
                                    target="_blank"
                                    className=""
                                    href={`/share?selectedEmail=${selectedEmail.email}&access=${user?.id}`}
                                  >
                                    Share
                                  </a>
                                </Button>
                                <Button
                                  className="px-6 py-2 rounded-lg bg-[#1d1d1d] border-2 border-[#1d1d1d] text-white font-medium hover:bg-[#484848] transition-colors"
                                  onClick={() => setShowShareDialog(true)}
                                >
                                  Add to Share List &nbsp;+
                                </Button>

                                <ShareDialog
                                  isOpen={showShareDialog}
                                  onClose={() => setShowShareDialog(false)}
                                  email={selectedEmail.email}
                                  userId={user?.id}
                                />
                              </div>
                              <ClientProfile
                                email={selectedEmail.email}
                                name={selectedEmail.name}
                              />

                              <div className="p-6">
                                <EmailList
                                  em={selectedEmail.email}
                                  title={`Received Emails with ${selectedEmail.name}`}
                                  emails={[
                                    ...selectedEmail.sentEmails,
                                    ...selectedEmail.receivedEmails,
                                  ]}
                                  receivedemails={selectedEmail.receivedEmails}
                                  sentemails={selectedEmail.sentEmails}
                                  rToken={selectedReceivedNextPageToken}
                                  sToken={selectedSentNextPageToken}
                                  lmremails={handleLoadMoreReceivedEmails}
                                  lmsemails={handleLoadMoreSentEmails}
                                  isPublic={false}
                                />
                              </div>
                            </>
                          ) : (
                            <Welcome />
                          )}
                        </>
                      )}
                    </div>
                  </ResizablePanel>
                </ResizablePanelGroup>
              </ResizablePanel>
            </ResizablePanelGroup>
          )}
        </div>
      </div>
    </>
  );
}

export default withAuth(Dashboard);
