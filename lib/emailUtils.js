/**
 * Parses email addresses and names from a string
 * Handles formats like: "John Doe <email@domain.com>" or "email@domain.com"
 * @param {string} emailString - String containing one or more email addresses
 * @returns {Array<{email: string, name: string}>} Array of unique email and name pairs
 */
export const parseEmailAddresses = (emailString) => {
  if (!emailString) return [];
  
  // Match pattern: "Name <email@domain.com>" or just "email@domain.com"
  const emailRegex = /(?:"?([^"]*)"?\s)?(?:<)?([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)(?:>)?/gi;
  const matches = [];
  let match;

  while ((match = emailRegex.exec(emailString)) !== null) {
    const name = match[1]?.trim() || '';
    const email = match[2];
    
    // Only add if we haven't seen this email before
    if (!matches.some(m => m.email === email)) {
      matches.push({ email, name });
    }
  }

  return matches;
};

/**
 * Formats email data from Gmail API response
 * @param {Object} email - Gmail API message object
 * @param {string} type - Type of email ('sent' or 'received')
 * @returns {Object} Formatted email object
 */
export const formatEmailData = (email, type) => {
  const headers = email.payload.headers;
  const subject = headers.find((h) => h.name === 'Subject')?.value || 'No Subject';
  const date = headers.find((h) => h.name === 'Date')?.value;
  
  // Base email object with common properties
  const baseEmail = {
    id: email.id,
    subject,
    date,
    type, // Include the email type for filtering
  };
  
  if (type === 'sent') {
    const toValue = headers.find((h) => h.name === 'To')?.value;
    const toEmails = parseEmailAddresses(toValue);
    return {
      ...baseEmail,
      to: toValue || 'Unknown Recipient',
      toEmails,
    };
  } else {
    const fromValue = headers.find((h) => h.name === 'From')?.value;
    const fromEmails = parseEmailAddresses(fromValue);
    return {
      ...baseEmail,
      from: fromValue || 'Unknown Sender',
      fromEmails,
    };
  }
};
