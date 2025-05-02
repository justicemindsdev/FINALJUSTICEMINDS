import { useEffect, useRef, useState } from 'react';
import { Button } from "./ui/button.jsx";
import ShareDialog from './ShareDialogue';
import { Skeleton } from "./ui/skeleton.jsx";
import { IoIosAddCircleOutline } from "react-icons/io";

/**
 * Component to display and handle unique email address buttons with names
 * with infinite scroll functionality
 */
export default function EmailAddressList({ contacts, onEmailClick, onLoadMore, isLoading, userId }) {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const containerRef = useRef(null);

  const handleShareClick = (contact, e) => {
    e.stopPropagation();
    setSelectedEmail(contact.email);
    setIsShareDialogOpen(true);
  };

  // Handle scroll for infinite loading
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (isLoading) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      // If scrolled to bottom (with 20px threshold)
      if (scrollHeight - scrollTop - clientHeight < 50) {
        console.log('Loading more contacts...'); // Debug log
        onLoadMore?.();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [isLoading, onLoadMore]);

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-130px)]">
        <div className="text-md font-semibold my-2 px-4 text-gray-500">Recent Contacts</div>
        <div 
          ref={containerRef}
          className="flex-1 flex flex-col gap-1 bg-[#101010] p-3 max-w-[400px] min-w-[250px] overflow-y-auto"
          style={{ height: '100%' }}
        >
          {contacts.map((contact, index) => (
            <div
              key={`${contact.email}-${index}`}
              className="bg-[#020202] hover:bg-[#323232] border-2 border-[#141414] max-w-full rounded-lg flex items-center justify-between px-3 py-3 overflow-clip"
            >
              <button
                onClick={() => onEmailClick(contact.email)}
                className="flex flex-col gap-1 items-start text-left"
              >
                <span className="font-medium text-base capitalize">
                  {contact.name || contact.email.split("@")[0]}
                </span>
                <span className="text-xs opacity-90 text-[#B0B0B0]">
                  {contact.email}
                </span>
              </button>
              <Button
                onClick={(e) => handleShareClick(contact, e)}
                variant="ghost"
                className="ml-2 hover:bg-[#ffffff] p-2"
              >
                <IoIosAddCircleOutline />

              </Button>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-center">
              <div className="space-y-2 px-2">
                <Skeleton className="h-4 w-[250px] bg-[#1d1d1d]" />
                <Skeleton className="h-4 w-[200px] bg-[#1d1d1d]" />
              </div>
            </div>
          )}
        </div>
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
