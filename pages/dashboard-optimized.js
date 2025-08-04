import { Geist, Geist_Mono } from "next/font/google";
import { Progress } from "@/components/ui/progress";
import { withAuth } from "@/lib/authUtils";
import { useDashboard } from "@/hooks/useDashboard";

// Components
import EmailAddressList from "@/components/EmailAddressList";
import SearchContacts from "@/components/SearchContacts";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import ShareDialog from "@/components/ShareDialogue";

// Dashboard components
import TabNavigation from "@/components/dashboard/TabNavigation";
import EmailsTab from "@/components/dashboard/EmailsTab";
import TerminalTab from "@/components/dashboard/TerminalTab";
import MainContent from "@/components/dashboard/MainContent";

// Font setup
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

function Dashboard({ user }) {
  const {
    // State
    loading,
    progress,
    csvData,
    uniqueContacts,
    selectedEmail,
    searchResults,
    currentSearchQuery,
    isLoadingMore,
    activeTab,
    contactLoading,
    showShareDialog,
    isMobile,
    isMobileMenuOpen,
    isSidebarOpen,
    selectedReceivedNextPageToken,
    selectedSentNextPageToken,

    // Setters
    setActiveTab,
    setShowShareDialog,
    setIsMobileMenuOpen,
    setIsSidebarOpen,

    // Handlers
    handleLogout,
    handleLoadMore,
    handleEmailClick,
    handleSearchResults,
    handleSiteUpdate,
    handleLoadMoreReceivedEmails,
    handleLoadMoreSentEmails
  } = useDashboard(user);

  if (loading) {
    return <Progress value={progress} className="w-full mt-10" />;
  }

  const renderMobileLayout = () => (
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
            <EmailsTab onSearchResults={handleSearchResults} />
          </div>
          <div className="flex-1 overflow-y-auto">
            {contactLoading ? (
              <div role="status">
                <svg
                  aria-hidden="true"
                  className="w-8 h-8 mx-auto mt-10 text-gray-700 animate-spin dark:text-gray-600 fill-white"
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

                <MainContent
                  activeTab="emails"
                  searchResults={searchResults}
                  currentSearchQuery={currentSearchQuery}
                  contactLoading={contactLoading}
                  selectedEmail={selectedEmail}
                  showShareDialog={showShareDialog}
                  setShowShareDialog={setShowShareDialog}
                  user={user}
                  csvData={csvData}
                  selectedReceivedNextPageToken={selectedReceivedNextPageToken}
                  selectedSentNextPageToken={selectedSentNextPageToken}
                  handleLoadMoreReceivedEmails={handleLoadMoreReceivedEmails}
                  handleLoadMoreSentEmails={handleLoadMoreSentEmails}
                  handleSiteUpdate={handleSiteUpdate}
                />
              </>
            ) : (
              <div className="text-center text-gray-400 mt-20">
                <h2 className="text-xl mb-2">Welcome to Justice Minds</h2>
                <p>Select a contact to view emails</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderDesktopLayout = () => (
    <ResizablePanelGroup direction="horizontal" className="h-full">
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
            <div className="flex h-full flex-col border-b-2 border-[#161616]">
              <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
              
              {activeTab === 'emails' && (
                <EmailsTab onSearchResults={handleSearchResults} />
              )}
              {activeTab === 'terminal' && <TerminalTab />}
            </div>
          </ResizablePanel>
          <ResizablePanel defaultSize={80}>
            <div className="flex flex-col h-full overflow-y-auto relative">
              <MainContent
                activeTab={activeTab}
                searchResults={searchResults}
                currentSearchQuery={currentSearchQuery}
                contactLoading={contactLoading}
                selectedEmail={selectedEmail}
                showShareDialog={showShareDialog}
                setShowShareDialog={setShowShareDialog}
                user={user}
                csvData={csvData}
                selectedReceivedNextPageToken={selectedReceivedNextPageToken}
                selectedSentNextPageToken={selectedSentNextPageToken}
                handleLoadMoreReceivedEmails={handleLoadMoreReceivedEmails}
                handleLoadMoreSentEmails={handleLoadMoreSentEmails}
                handleSiteUpdate={handleSiteUpdate}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  );

  return (
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
        {isMobile ? renderMobileLayout() : renderDesktopLayout()}
      </div>
    </div>
  );
}

export default withAuth(Dashboard);