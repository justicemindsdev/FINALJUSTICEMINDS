import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { supabase } from "@/lib/supabase";
import { Progress } from "@/components/ui/progress";
import EmailList from "@/components/EmailList";
import ClientProfile from "@/components/ClientProfile";
import { formatEmailData } from "@/lib/emailUtils";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const GroupShare = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadingg, setLoadingg] = useState(false);
  const [shares, setShares] = useState(null);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [emailsData, setEmailsData] = useState({});
  const [progress, setProgress] = useState(30);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedReceivedNextPageToken, setSelectedReceivedNextPageToken] =
    useState(null);
  const [selectedSentNextPageToken, setSelectedSentNextPageToken] =
    useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setProgress(100), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    verifyAndInitialize();
  }, [router.isReady, router.query.id, router.query.token]);

  const verifyAndInitialize = async () => {
    try {
      // const uuid = localStorage.getItem("share_uuid");
      // if (!uuid) {
      //   router.push("/");
      //   return;
      // }

      const { data: shareData } = await supabase
        .from("manageshare")
        .select("*")
        .eq("uuid", router.query.id)
        .single();

      if (!shareData || !shareData.isActive) {
        setShares(null);
        setLoading(false);
        return;
      }

      setShares(shareData);
      setLoading(false);
    } catch (error) {
      console.error("Failed to verify:", error);
      router.push("/");
    }
  };

  const getAccessToken = async () => {
    try {
      const {token} = router.query;
      console.log(token)
      

      if (!token) {
        router.push("/");
        return null;
      }

      const { data } = await supabase
        .from("profiles")
        .select("access_token")
        .eq("id", token)
        .single();

        console.log(data);
        localStorage.setItem('access_token', data?.access_token);

        

      return data?.access_token;
    } catch (error) {
      console.error("Error getting access token:", error);
      router.push("/");
      return null;
    }
  };

  const fetchEmailsForContact = async (
    emailId,
    receivedPageToken = null,
    sentPageToken = null
  ) => {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      throw new Error("No access token available");
    }

    try {
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
      console.error("Failed to fetch emails:", error);
      throw error;
    }
  };

  const handleEmailSelect = async (email) => {
    try {
      setLoadingg(true)
      const {
        receivedEmails,
        sentEmails,
        nextReceivedPageToken,
        nextSentPageToken,
      } = await fetchEmailsForContact(email);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("email", email)
        .single();

      setEmailsData({
        ...emailsData,
        [email]: {
          email,
          name: profileData?.full_name || email.split("@")[0],
          receivedEmails,
          sentEmails,
        },
      });
      setSelectedEmail(email);
      setSelectedReceivedNextPageToken(nextReceivedPageToken);
      setSelectedSentNextPageToken(nextSentPageToken);
      setLoadingg(false)
    } catch (error) {
      console.error("Failed to fetch email data:", error);
    }
  };

  const handleLoadMoreReceivedEmails = async () => {
    if (!selectedReceivedNextPageToken || isLoadingMore || !selectedEmail)
      return;

    try {
      setIsLoadingMore(true);
      const { receivedEmails, nextReceivedPageToken } =
        await fetchEmailsForContact(
          selectedEmail,
          selectedReceivedNextPageToken,
          null
        );

      setEmailsData((prev) => ({
        ...prev,
        [selectedEmail]: {
          ...prev[selectedEmail],
          receivedEmails: [
            ...prev[selectedEmail].receivedEmails,
            ...receivedEmails,
          ],
        },
      }));
      setSelectedReceivedNextPageToken(nextReceivedPageToken);
    } catch (error) {
      console.error("Failed to load more received emails:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleLoadMoreSentEmails = async () => {
    if (!selectedSentNextPageToken || isLoadingMore || !selectedEmail) return;

    try {
      setIsLoadingMore(true);
      const { sentEmails, nextSentPageToken } = await fetchEmailsForContact(
        selectedEmail,
        null,
        selectedSentNextPageToken
      );

      setEmailsData((prev) => ({
        ...prev,
        [selectedEmail]: {
          ...prev[selectedEmail],
          sentEmails: [...prev[selectedEmail].sentEmails, ...sentEmails],
        },
      }));
      setSelectedSentNextPageToken(nextSentPageToken);
    } catch (error) {
      console.error("Failed to load more sent emails:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <div
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-[#0C0C0C]`}
      >
        <Progress value={progress} className="w-full mt-10" />
      </div>
    );
  }

  return (
    <>
      {shares ? (
        <div
          className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-[#0C0C0C] flex`}
        >
          <div className="w-1/4 border-r border-gray-800 p-4">
            <img src="/logomain.png" width="100px" alt="" className="mb-3" />
            <h2 className="text-xl font-bold mb-4 text-white">
              {shares.title}
            </h2>
            <div className="space-y-2">
              {shares.emails?.map((email) => (
                <button
                  key={email}
                  onClick={() => handleEmailSelect(email)}
                  className={`w-full p-2 text-left rounded ${
                    selectedEmail === email
                      ? "bg-blue-600"
                      : "hover:bg-gray-800"
                  } text-white`}
                >
                  {email}
                </button>
              ))}
            </div>
          </div>

          <div className="w-3/4 p-6">
          {loadingg ? (
            <>loading . . .</>
          ) : (
            <>
            {selectedEmail && emailsData[selectedEmail] ? (
              <>
                <ClientProfile
                  email={emailsData[selectedEmail].email}
                  name={emailsData[selectedEmail].name}
                />
                <EmailList
                  em={emailsData[selectedEmail].email}
                  title={`Emails with ${emailsData[selectedEmail].name}`}
                  emails={[
                    ...emailsData[selectedEmail].sentEmails,
                    ...emailsData[selectedEmail].receivedEmails,
                  ]}
                  receivedemails={emailsData[selectedEmail].receivedEmails}
                  sentemails={emailsData[selectedEmail].sentEmails}
                  rToken={selectedReceivedNextPageToken}
                  sToken={selectedSentNextPageToken}
                  lmremails={handleLoadMoreReceivedEmails}
                  lmsemails={handleLoadMoreSentEmails}
                  isPublic={true}
                />
              </>
            ) : (
              <div className="text-center text-gray-400 mt-10">
                Select an email from the list to view correspondence
              </div>
            )}
            </>
          )}
            
          </div>
        </div>
      ) : (
        <>not Allowed</>
      )}
    </>
  );
};

export default GroupShare;
