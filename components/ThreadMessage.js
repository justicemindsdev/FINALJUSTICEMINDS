import { useState } from 'react';
import axios from 'axios';
import EmailContent from './EmailContent';

/**
 * Component to display a single message in a thread with expandable details
 */
export default function ThreadMessage({ messageId, headers, snippet }) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messageDetails, setMessageDetails] = useState(null);

  /**
   * Fetches complete message details when expanded
   */
  const fetchMessageDetails = async () => {
    if (messageDetails) return; // Already fetched
    
    setLoading(true);
    try {
      const accessToken = localStorage.getItem('access_token');
      const response = await axios.get(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
        { 
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { format: 'full' }
        }
      );

      // Process message content
      const payload = response.data.payload;
      let content = '';
      let isHtml = false;

      if (payload.parts) {
        const textPart = payload.parts.find(part => 
          part.mimeType === 'text/plain' || part.mimeType === 'text/html'
        );
        if (textPart) {
          content = Buffer.from(textPart.body.data, 'base64').toString('utf8');
          isHtml = textPart.mimeType === 'text/html';
        }
      } else if (payload.body.data) {
        content = Buffer.from(payload.body.data, 'base64').toString('utf8');
        isHtml = payload.mimeType === 'text/html';
      }

      // Get attachments
      const attachments = [];
      const processPayloadParts = (parts) => {
        if (!parts) return;
        parts.forEach(part => {
          if (part.filename && part.filename.length > 0) {
            attachments.push({
              filename: part.filename,
              mimeType: part.mimeType,
              size: part.body.size,
              attachmentId: part.body.attachmentId,
            });
          }
          if (part.parts) {
            processPayloadParts(part.parts);
          }
        });
      };
      processPayloadParts(payload.parts);

      setMessageDetails({
        content,
        isHtml,
        attachments,
        headers: payload.headers,
      });
    } catch (error) {
      console.error('Failed to fetch message details:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = () => {
    if (!expanded && !messageDetails) {
      fetchMessageDetails();
    }
    setExpanded(!expanded);
  };

  return (
    <div className="border rounded-lg bg-gray-900 p-3">
      {/* Message Header - Always visible */}
      <div 
        className="flex justify-between items-start cursor-pointer"
        onClick={toggleExpand}
      >
        <div className="flex-1">
          <div className="flex justify-between mb-1">
            <span className="text-gray-200">
              From: {headers.find(h => h.name === 'From')?.value}
            </span>
            <span className="text-gray-400">
              {new Date(
                headers.find(h => h.name === 'Date')?.value
              ).toLocaleString()}
            </span>
          </div>
          {!expanded && (
            <p className="text-gray-300 text-sm">{snippet}...</p>
          )}
        </div>
        <button 
          className={`ml-2 p-2 rounded-full transition-transform ${
            expanded ? 'rotate-180' : ''
          }`}
        >
          ▼
        </button>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          {loading ? (
            <div className="text-center text-gray-500">
              Loading message details...
            </div>
          ) : messageDetails ? (
            <div className="space-y-4">
              {/* Full Headers */}
              <div className="text-sm space-y-1">
                {messageDetails.headers
                  .filter(h => ['From', 'To', 'Date', 'Subject', 'Cc', 'Bcc'].includes(h.name))
                  .map((header, i) => (
                    <div key={i}>
                      <span className="font-medium text-gray-400">{header.name}: </span>
                      <span className="text-gray-300">{header.value}</span>
                    </div>
                  ))
                }
              </div>

              {/* Attachments */}
              {messageDetails.attachments.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-400 mb-2">Attachments:</h4>
                  <div className="flex flex-wrap gap-2">
                    {messageDetails.attachments.map((attachment, i) => (
                      <div 
                        key={i}
                        className="flex items-center p-2 bg-gray-800 rounded-lg text-sm"
                      >
                        <span className="text-gray-300">
                          {attachment.filename}
                        </span>
                        <span className="text-gray-500 ml-2">
                          ({Math.round(attachment.size / 1024)}KB)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Message Content */}
              <div>
                <h4 className="font-medium text-gray-400 mb-2">Content:</h4>
                <EmailContent 
                  content={messageDetails.content}
                  isHtml={messageDetails.isHtml}
                />
              </div>
            </div>
          ) : (
            <div className="text-center text-red-500">
              Failed to load message details
            </div>
          )}
        </div>
      )}
    </div>
  );
}
