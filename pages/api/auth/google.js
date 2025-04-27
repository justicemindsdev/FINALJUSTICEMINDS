import axios from 'axios';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { access_token } = req.body;

      // Verify token and get user info
      const userResponse = await axios.get(
        `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`
      );

      // Fetch Gmail messages
      const gmailResponse = await axios.get(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10`,
        { 
          headers: { 
            Authorization: `Bearer ${access_token}` 
          } 
        }
      );

      // Fetch full email details
      const emailPromises = gmailResponse.data.messages.map(async (message) => {
        const details = await axios.get(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
          { 
            headers: { 
              Authorization: `Bearer ${access_token}` 
            } 
          }
        );
        return details.data;
      });

      const emails = await Promise.all(emailPromises);

      res.status(200).json({
        success: true,
        user: userResponse.data,
        emails: emails.map(email => {
          // Extract readable email details
          const headers = email.payload.headers;
          return {
            id: email.id,
            subject: headers.find(h => h.name === 'Subject')?.value,
            from: headers.find(h => h.name === 'From')?.value
          };
        })
      });
    } catch (error) {
      console.error('Authentication error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Authentication failed' 
      });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}