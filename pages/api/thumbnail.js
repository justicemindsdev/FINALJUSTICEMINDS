export default async function handler(req, res) {
    const { id } = req.query;
  
    if (!id) {
      return res.status(400).json({ error: 'File ID is required' });
    }
  
    try {
      // Try different thumbnail URLs
      const urls = [
        `https://drive.google.com/thumbnail?id=${id}&sz=w1000`,
        `https://lh3.googleusercontent.com/d/${id}=w1000`,
        `https://drive.google.com/uc?id=${id}&export=download`,
      ];
  
      let response = null;
      for (const url of urls) {
        try {
          response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
            }
          });
          if (response.ok) break;
        } catch (error) {
          console.error('Thumbnail fetch error:', error);
          continue;
        }
      }
  
      if (!response || !response.ok) {
        return res.status(404).json({ error: 'Thumbnail not found' });
      }
  
      // Get the content type and forward it
      const contentType = response.headers.get('content-type');
      res.setHeader('Content-Type', contentType);
      
      // Set CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
  
      // Stream the response
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (error) {
      console.error('Thumbnail proxy error:', error);
      res.status(500).json({ error: 'Failed to fetch thumbnail' });
    }
  }
  