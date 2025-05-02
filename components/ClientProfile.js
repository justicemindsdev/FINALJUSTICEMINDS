import { useState, useEffect } from 'react';
import axios from 'axios';
import { Skeleton } from './ui/skeleton';
import { Component } from './Pie';

export default function ClientProfile({ email, name }) {
  const [messageStats, setMessageStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Generate a consistent avatar URL based on email
  const picture = `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=random`;

  useEffect(() => {
    const fetchAllMessages = async (query) => {
      const accessToken = localStorage.getItem('access_token');
      let allMessages = [];
      let pageToken = undefined;
      
      do {
        const response = await axios.get(
          'https://gmail.googleapis.com/gmail/v1/users/me/messages',
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: { 
              q: query,
              pageToken,
              maxResults: 500 // Maximum allowed by Gmail API
            }
          }
        );
        
        if (response.data.messages) {
          allMessages = [...allMessages, ...response.data.messages];
        }
        
        pageToken = response.data.nextPageToken;
      } while (pageToken);
      
      return allMessages;
    };

    const fetchMessageDetails = async (messageId) => {
      const accessToken = localStorage.getItem('access_token');
      const response = await axios.get(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      return response.data;
    };

    const fetchMessageStats = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) throw new Error('Not authenticated');

        // Get all received emails
        const receivedMessages = await fetchAllMessages(`from:(${email})`);
        const receivedDates = await Promise.all(
          receivedMessages.map(async (msg) => {
            const details = await fetchMessageDetails(msg.id);
            return new Date(parseInt(details.internalDate));
          })
        );

        // Get all sent emails
        const sentMessages = await fetchAllMessages(`to:(${email})`);
        const sentDates = await Promise.all(
          sentMessages.map(async (msg) => {
            const details = await fetchMessageDetails(msg.id);
            return new Date(parseInt(details.internalDate));
          })
        );

        const getEarliestAndLatestDate = (dates) => {
          if (dates.length === 0) return { first: null, last: null };
          const sortedDates = dates.sort((a, b) => a - b);
          return { first: sortedDates[0], last: sortedDates[sortedDates.length - 1] };
        };

        const receivedStats = getEarliestAndLatestDate(receivedDates);
        const sentStats = getEarliestAndLatestDate(sentDates);

        setMessageStats({
          received: receivedMessages.length,
          sent: sentMessages.length,
          total: receivedMessages.length + sentMessages.length,
          receivedDates: receivedStats,
          sentDates: sentStats,
        });
      } catch (error) {
        console.error('Failed to fetch message stats:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (email) {
      fetchMessageStats();
    }
  }, [email]);

  if (loading) {
    return (
      <div className="p-4 border-b border-[#161616]">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 bg-[#343434] rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[200px] bg-[#343434]" />
            <Skeleton className="h-4 w-[150px] bg-[#343434]" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border-b border-[#161616] text-red-500">
        Failed to load profile
      </div>
    );
  }

  const options = {
    hour12: true,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
};

  return (
    <div className="p-4 border-b border-[#161616]">
  <div className="flex px-2 w-auto items-stretch space-x-4">
    {/* Image and contents */}
    <div className="flex flex-col items-start w-auto py-4 px-6 gap-3 bg-[#1d1d1d] rounded-lg">
      <img
        src={picture}
        alt={email}
        className="h-12 w-12 rounded-full"
      />
      <div>
        <h3 className="font-medium text-lg">
          {name ? `${name}` : email}
        </h3>
        <h3 className="font-medium text-lg">
          {name ? `${email}` : email}
        </h3>
        <div className="text-md text-gray-200 space-y-1">
          <p>Total Messages: {messageStats?.total || 0}</p>
          <div className="flex space-x-4">
            <p>Received: {messageStats?.received || 0}</p>
            <p>Sent: {messageStats?.sent || 0}</p>
          </div>
          {messageStats?.receivedDates?.first && (
            <p>
              First Received: {messageStats.receivedDates.first.toLocaleString('en-US', options)}
            </p>
          )}
          {messageStats?.receivedDates?.last && (
            <p>
              Last Received: {messageStats.receivedDates.last.toLocaleString('en-US', options)}
            </p>
          )}
          {messageStats?.sentDates?.first && (
            <p>
              First Sent: {messageStats.sentDates.first.toLocaleString('en-US', options)}
            </p>
          )}
          {messageStats?.sentDates?.last && (
            <p>
              Last Sent: {messageStats.sentDates.last.toLocaleString('en-US', options)}
            </p>
          )}
        </div>
      </div>
    </div>

    {/* Component */}
    {/* {messageStats && (
      <div className="bg-[#2c2c2c] rounded-lg w-[100px]">
        <Component stats={messageStats} />
      </div>
    )} */}
  </div>
</div>

  );
}
