// Custom hook to manage dashboard state and logic
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { formatEmailData } from '@/lib/emailUtils';

const checkAuthToken = () => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    return token || user;
  }
  return null;
};

export const useDashboard = (user) => {
  // Core state
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(30);
  const [csvData, setCsvData] = useState(null);
  
  // Email data
  const [sentEmails, setSentEmails] = useState([]);
  const [receivedEmails, setReceivedEmails] = useState([]);
  const [uniqueContacts, setUniqueContacts] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  
  // Search and pagination
  const [searchResults, setSearchResults] = useState(null);
  const [currentSearchQuery, setCurrentSearchQuery] = useState('');
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [selectedReceivedNextPageToken, setSelectedReceivedNextPageToken] = useState(null);
  const [selectedSentNextPageToken, setSelectedSentNextPageToken] = useState(null);
  
  // UI state
  const [activeTab, setActiveTab] = useState('emails');
  const [contactLoading, setContactLoading] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const router = useRouter();

  // Initialize progress
  useEffect(() => {
    const timer = setTimeout(() => setProgress(100), 500);
    return () => clearTimeout(timer);
  }, []);

  // Load CSV data
  useEffect(() => {
    const fetchCsvData = async () => {
      try {
        const response = await fetch('/mailsuite_tracks_1744690976.csv');
        const text = await response.text();
        setCsvData(text);
      } catch (error) {
        console.error('Failed to load CSV data:', error);
      }
    };
    fetchCsvData();
  }, []);

  // Check mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auth check
  useEffect(() => {
    const token = checkAuthToken();
    if (!token) {
      router.push('/auth/login');
    }
  }, [router]);

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      try {
        await fetchEmailBatch();
        setLoading(false);
      } catch (error) {
        console.error('Failed to initialize data:', error);
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
    deleteCookie('access_token');
    router.push('/');
  };

  const fetchEmailBatch = async (pageToken = null) => {
    try {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) throw new Error('Not authenticated');

      // Fetch received and sent emails in parallel
      const [receivedResponse, sentResponse] = await Promise.all([
        axios.get('https://gmail.googleapis.com/gmail/v1/users/me/messages', {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { q: '', maxResults: 10, pageToken }
        }),
        axios.get('https://gmail.googleapis.com/gmail/v1/users/me/messages', {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { q: 'in:sent', maxResults: 10, pageToken }
        })
      ]);

      // Process emails in parallel
      const [receivedDetails, sentDetails] = await Promise.all([
        Promise.all((receivedResponse.data?.messages || []).map(async (message) => {
          const response = await axios.get(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          return response.data;
        })),
        Promise.all((sentResponse.data?.messages || []).map(async (message) => {
          const response = await axios.get(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          return response.data;
        }))
      ]);

      const formattedReceivedEmails = receivedDetails.map(email => formatEmailData(email, 'received'));
      const formattedSentEmails = sentDetails.map(email => formatEmailData(email, 'sent'));

      // Extract unique contacts efficiently
      const contactsMap = new Map();
      
      const addContact = (addr, name) => {
        if (!contactsMap.has(addr)) {
          contactsMap.set(addr, { email: addr, name });
        } else if (!contactsMap.get(addr).name && name) {
          contactsMap.get(addr).name = name;
        }
      };

      formattedReceivedEmails.forEach(email => {
        email.fromEmails.forEach(({ email: addr, name }) => addContact(addr, name));
      });

      formattedSentEmails.forEach(email => {
        email.toEmails.forEach(({ email: addr, name }) => addContact(addr, name));
      });

      const newContacts = Array.from(contactsMap.values());

      // Update state based on pagination
      if (pageToken) {
        setReceivedEmails(prev => [...prev, ...formattedReceivedEmails]);
        setSentEmails(prev => [...prev, ...formattedSentEmails]);
        setUniqueContacts(prev => {
          const combined = [...prev, ...newContacts];
          const uniqueEmails = new Set();
          return combined.filter(contact => {
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
      console.error('Failed to fetch email batch:', error);
      throw error;
    }
  };

  const handleLoadMore = async () => {
    if (!nextPageToken || isLoadingMore) return;
    try {
      setIsLoadingMore(true);
      await fetchEmailBatch(nextPageToken);
    } catch (error) {
      console.error('Failed to load more:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const fetchEmailsForContact = async (emailId, receivedPageToken = null, sentPageToken = null) => {
    const accessToken = localStorage.getItem('access_token');
    try {
      const [receivedResponse, sentResponse] = await Promise.all([
        axios.get('https://gmail.googleapis.com/gmail/v1/users/me/messages', {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { q: `from:(${emailId})`, maxResults: 10, pageToken: receivedPageToken }
        }),
        axios.get('https://gmail.googleapis.com/gmail/v1/users/me/messages', {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { q: `to:(${emailId})`, maxResults: 10, pageToken: sentPageToken }
        })
      ]);

      const [receivedDetails, sentDetails] = await Promise.all([
        Promise.all((receivedResponse.data?.messages || []).map(async (message) => {
          const response = await axios.get(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          return response.data;
        })),
        Promise.all((sentResponse.data?.messages || []).map(async (message) => {
          const response = await axios.get(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          return response.data;
        }))
      ]);

      return {
        receivedEmails: receivedDetails.map(email => formatEmailData(email, 'received')),
        sentEmails: sentDetails.map(email => formatEmailData(email, 'sent')),
        nextReceivedPageToken: receivedResponse.data.nextPageToken || null,
        nextSentPageToken: sentResponse.data.nextPageToken || null
      };
    } catch (error) {
      console.error('Failed to fetch emails for contact:', error);
      throw error;
    }
  };

  const handleEmailClick = async (emailId, name) => {
    setSearchResults(null);
    setContactLoading(true);
    setSelectedEmail(null);
    if (isMobile) setIsSidebarOpen(false);

    try {
      const contactName = name || 
        uniqueContacts.find(contact => contact.email === emailId)?.name || 
        emailId.split('@')[0];

      const {
        receivedEmails,
        sentEmails,
        nextReceivedPageToken,
        nextSentPageToken
      } = await fetchEmailsForContact(emailId);

      setSelectedEmail({
        email: emailId,
        name: contactName,
        receivedEmails,
        sentEmails
      });
      setSelectedReceivedNextPageToken(nextReceivedPageToken);
      setSelectedSentNextPageToken(nextSentPageToken);
    } catch (error) {
      console.error('Failed to fetch emails for the selected address:', error);
    } finally {
      setContactLoading(false);
    }
  };

  const handleSearchResults = (results, token, isLoadMore = false, query = '') => {
    if (isLoadMore) {
      setSearchResults(prev => [...prev, ...results]);
    } else {
      setSearchResults(results);
      setSelectedEmail(null);
      setCurrentSearchQuery(query);
    }
  };

  const handleSiteUpdate = () => {
    console.log('Site updated via terminal chat');
  };

  const handleLoadMoreReceivedEmails = async () => {
    if (!selectedReceivedNextPageToken || isLoadingMore) return;
    try {
      setIsLoadingMore(true);
      const { receivedEmails } = await fetchEmailsForContact(
        selectedEmail.email,
        selectedReceivedNextPageToken,
        null
      );
      setSelectedEmail(prev => ({
        ...prev,
        receivedEmails: [...prev.receivedEmails, ...receivedEmails]
      }));
    } catch (error) {
      console.error('Failed to load more received emails:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleLoadMoreSentEmails = async () => {
    if (!selectedSentNextPageToken || isLoadingMore) return;
    try {
      setIsLoadingMore(true);
      const { sentEmails } = await fetchEmailsForContact(
        selectedEmail.email,
        null,
        selectedSentNextPageToken
      );
      setSelectedEmail(prev => ({
        ...prev,
        sentEmails: [...prev.sentEmails, ...sentEmails]
      }));
    } catch (error) {
      console.error('Failed to load more sent emails:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return {
    // State
    loading,
    progress,
    csvData,
    sentEmails,
    receivedEmails,
    uniqueContacts,
    selectedEmail,
    searchResults,
    currentSearchQuery,
    isLoadingMore,
    nextPageToken,
    activeTab,
    contactLoading,
    showShareDialog,
    isMobile,
    isMobileMenuOpen,
    isSidebarOpen,

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
  };
};