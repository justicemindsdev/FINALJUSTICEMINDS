import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { Progress } from "@/components/ui/progress";
import EmailList from "@/components/EmailList";
import { formatEmailData } from "@/lib/emailUtils";
import ClientProfile from "@/components/ClientProfile";
import { Geist, Geist_Mono } from "next/font/google";
import { supabase } from "@/lib/supabase";
// Font setup
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export default function SharePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [progress, setProgress] = useState(30);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [selectedReceivedNextPageToken, setSelectedReceivedNextPageToken] = useState(null);
    const [selectedSentNextPageToken, setSelectedSentNextPageToken] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => setProgress(100), 500);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!router.isReady) return;

        const { selectedEmail: emailId, access: uuid } = router.query;
        
        if (emailId && uuid) {
            verifyAndInitialize(uuid, emailId);
        } else {
            router.push("/");
        }
    }, [router.isReady, router.query]);

    const verifyAndInitialize = async (uuid, emailId) => {
        try {
            // Check if UUID exists in profiles and get access token
            const { data, error } = await supabase
                .from('profiles')
                .select('access_token')
                .eq('id', uuid)
                .single();

            if (error || !data) {
                console.error("Invalid UUID or no access token found");
                router.push("/");
                return;
            }

            // Store UUID in localStorage (not the access token)
            localStorage.setItem('share_uuid', uuid);
            localStorage.setItem('access_token', data.access_token);
            
            // Initialize with the access token from Supabase
            await initializeData(emailId, data.access_token);
        } catch (error) {
            console.error("Failed to verify UUID:", error);
            router.push("/");
        }
    };

    const getAccessToken = async () => {
        try {
            const uuid = localStorage.getItem('share_uuid');
            if (!uuid) {
                router.push("/");
                return null;
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('access_token')
                .eq('id', uuid)
                .single();

            if (error || !data) {
                console.error("Failed to get access token");
                router.push("/");
                return null;
            }

            return data.access_token;
        } catch (error) {
            console.error("Error getting access token:", error);
            router.push("/");
            return null;
        }
    };

    const fetchEmailsForContact = async (emailId, receivedPageToken = null, sentPageToken = null) => {
        const accessToken = await getAccessToken();
        if (!accessToken) {
            throw new Error("No access token available");
        }

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

    const initializeData = async (emailId) => {
        try {
            const { receivedEmails, sentEmails, nextReceivedPageToken, nextSentPageToken } = 
                await fetchEmailsForContact(emailId);

            // Get user profile from Supabase to get the name if available
            const { data: profileData } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('email', emailId)
                .single();

            setSelectedEmail({
                email: emailId,
                name: profileData?.full_name || emailId.split("@")[0],
                receivedEmails: receivedEmails,
                sentEmails: sentEmails,
            });
            setSelectedReceivedNextPageToken(nextReceivedPageToken);
            setSelectedSentNextPageToken(nextSentPageToken);
            setLoading(false);
        } catch (error) {
            console.error("Failed to initialize data:", error);
            router.push("/");
        }
    };

    const handleLoadMoreReceivedEmails = async () => {
        if (!selectedReceivedNextPageToken || isLoadingMore) return;

        try {
            setIsLoadingMore(true);
            const { receivedEmails, nextReceivedPageToken } = 
                await fetchEmailsForContact(
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
            const { sentEmails, nextSentPageToken } = 
                await fetchEmailsForContact(
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

    if (loading) {
        return (
            <div className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-[#0C0C0C]`}>
                <Progress value={progress} className="w-full mt-10" />
            </div>
        );
    }

    return (
        <div className={`${geistSans.variable} ${geistMono.variable} p-6 min-h-screen lg:w-1/2 md:w-3/4 w-full mx-auto bg-[#0C0C0C]`}>
            {selectedEmail && (
                <>
                <img src="/logomain.png" width={"150px"} alt="" />
                    <ClientProfile
                        email={selectedEmail.email}
                        name={selectedEmail.name}
                    />
                    <EmailList
                    em={selectedEmail.email}
                        title={`Emails with ${selectedEmail.name}`}
                        emails={[...selectedEmail.sentEmails, ...selectedEmail.receivedEmails]}
                        receivedemails={selectedEmail.receivedEmails}
                        sentemails={selectedEmail.sentEmails}
                        rToken={selectedReceivedNextPageToken}
                        sToken={selectedSentNextPageToken}
                        lmremails={handleLoadMoreReceivedEmails}
                        lmsemails={handleLoadMoreSentEmails}
                        isPublic={true}
                    />
                </>
            )}
        </div>
    );
}