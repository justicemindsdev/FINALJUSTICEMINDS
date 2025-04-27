import metadataScraper from 'metadata-scraper';

// Helper function to truncate description to 5-6 words
const truncateDescription = (desc, maxWords = 20) => {
  if (!desc) return '';
  const words = desc.split(' ');
  return words.slice(0, maxWords).join(' ') + (words.length > maxWords ? '...' : '');
};

// Helper function to extract YouTube video ID
const getYoutubeVideoId = (url) => {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : null;
};

// Helper function to get LinkedIn post type and ID
const getLinkedInInfo = (url) => {
  const patterns = {
    post: /linkedin\.com\/posts\/([^\/]+)(?:\/([^\/\?]+))?/,
    article: /linkedin\.com\/pulse\/([^\/\?]+)/,
    profile: /linkedin\.com\/in\/([^\/\?]+)/,
    company: /linkedin\.com\/company\/([^\/\?]+)/,
  };

  for (const [type, pattern] of Object.entries(patterns)) {
    const match = url.match(pattern);
    if (match) {
      return { type, id: match[1] };
    }
  }
  return null;
};

// Helper function to get Google Drive file ID and type
const getDriveFileInfo = (url) => {
  const patterns = [
    { type: 'file', regex: /\/file\/d\/([^\/]+)/ },
    { type: 'document', regex: /\/document\/d\/([^\/]+)/ },
    { type: 'presentation', regex: /\/presentation\/d\/([^\/]+)/ },
    { type: 'spreadsheet', regex: /\/spreadsheets\/d\/([^\/]+)/ },
    { type: 'form', regex: /\/forms\/d\/([^\/]+)/ },
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern.regex);
    if (match) {
      return { id: match[1], type: pattern.type };
    }
  }

  // Check for alternate URL format
  const idMatch = url.match(/[?&]id=([^&]+)/);
  if (idMatch) {
    return { id: idMatch[1], type: 'file' };
  }

  return null;
};

// Helper function to check if URL is from Grain
const isGrainUrl = (url) => {
  return url.includes('grain.com') || url.includes('grain.co');
};

// Helper function to validate and normalize image URL
const normalizeImageUrl = (imgUrl, baseUrl) => {
  try {
    if (imgUrl.startsWith('data:')) return null; // Skip data URLs
    if (imgUrl.startsWith('//')) {
      imgUrl = 'https:' + imgUrl;
    } else if (imgUrl.startsWith('/')) {
      const urlObj = new URL(baseUrl);
      imgUrl = urlObj.origin + imgUrl;
    } else if (!imgUrl.startsWith('http')) {
      const urlObj = new URL(baseUrl);
      imgUrl = new URL(imgUrl, urlObj.origin).href;
    }
    
    // Filter out small icons and invalid image URLs
    if (imgUrl.includes('favicon') || imgUrl.includes('icon')) {
      return null;
    }
    
    return imgUrl;
  } catch (error) {
    console.error('Error normalizing image URL:', error);
    return null;
  }
};

// Enhanced function to extract images from HTML content
const extractImagesFromHtml = async (url) => {
  try {
    const response = await fetchWithTimeout(url);
    const html = await response.text();
    const images = new Set();
    
    // Extract from standard img tags
    const imgRegex = /<img[^>]+src="([^">]+)"/g;
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      const normalizedUrl = normalizeImageUrl(match[1], url);
      if (normalizedUrl) images.add(normalizedUrl);
    }
    
    // Extract from meta tags
    const metaRegex = /<meta[^>]+property="(?:og:image|twitter:image)"[^>]+content="([^">]+)"/g;
    while ((match = metaRegex.exec(html)) !== null) {
      const normalizedUrl = normalizeImageUrl(match[1], url);
      if (normalizedUrl) images.add(normalizedUrl);
    }
    
    // Extract from background images in style attributes
    const styleRegex = /background-image:\s*url\(['"]?([^'")\s]+)['"]?\)/g;
    while ((match = styleRegex.exec(html)) !== null) {
      const normalizedUrl = normalizeImageUrl(match[1], url);
      if (normalizedUrl) images.add(normalizedUrl);
    }
    
    // Extract from srcset attributes
    const srcsetRegex = /<img[^>]+srcset="([^"]+)"/g;
    while ((match = srcsetRegex.exec(html)) !== null) {
      const srcset = match[1].split(',');
      for (const src of srcset) {
        const imgUrl = src.trim().split(' ')[0];
        const normalizedUrl = normalizeImageUrl(imgUrl, url);
        if (normalizedUrl) images.add(normalizedUrl);
      }
    }
    
    // Extract from picture elements
    const sourceRegex = /<source[^>]+srcset="([^"]+)"/g;
    while ((match = sourceRegex.exec(html)) !== null) {
      const srcset = match[1].split(',');
      for (const src of srcset) {
        const imgUrl = src.trim().split(' ')[0];
        const normalizedUrl = normalizeImageUrl(imgUrl, url);
        if (normalizedUrl) images.add(normalizedUrl);
      }
    }
    
    // Filter out small images and icons by checking URL patterns
    const filteredImages = Array.from(images).filter(img => 
      !img.includes('icon') && 
      !img.includes('logo') && 
      !img.includes('avatar') &&
      !img.includes('emoji') &&
      !img.includes('badge') &&
      !img.match(/\d+x\d+/) // Removes dimension-specific images like thumb_100x100.jpg
    );
    
    return filteredImages;
  } catch (error) {
    console.error('Error extracting images:', error);
    return [];
  }
};

async function fetchWithTimeout(url, options = {}, timeout = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...options.headers,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
      }
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function getYouTubeMetadata(videoId) {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetchWithTimeout(oembedUrl);
    const data = await response.json();

    const description = data.author_name ? 
      truncateDescription(`By ${data.author_name} • ${data.title}`) : 
      'Watch this video on YouTube';

    const thumbnails = [
      `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
    ];

    return {
      title: truncateDescription(data.title),
      description,
      thumbnail: thumbnails[0],
      allThumbnails: thumbnails
    };
  } catch (error) {
    console.error('YouTube metadata fetch error:', error);
    return {
      title: 'YouTube Video',
      description: 'Watch this video on YouTube',
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      allThumbnails: [`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`]
    };
  }
}

async function getLinkedInMetadata(info) {
  const thumbnail = 'https://static.licdn.com/aero-v1/sc/h/3dtfvv2esz58o2zimai1h3v2d';
  let title = '';
  let description = '';

  switch (info.type) {
    case 'profile':
      title = 'LinkedIn Profile';
      description = 'View profile on LinkedIn';
      break;
    case 'post':
      title = 'LinkedIn Post';
      description = 'View post on LinkedIn';
      break;
    case 'article':
      title = 'LinkedIn Article';
      description = 'Read article on LinkedIn';
      break;
    case 'company':
      title = 'LinkedIn Company';
      description = 'View company on LinkedIn';
      break;
  }

  return {
    title: truncateDescription(title),
    description: truncateDescription(description),
    thumbnail,
    allThumbnails: [thumbnail]
  };
}

async function getDriveMetadata(fileInfo) {
  let title = 'Google Drive';
  let description = '';
  let thumbnail = '';

  // Create a proxy URL for the thumbnail that will be handled by our API
  const proxyThumbnailUrl = `/api/thumbnail?id=${fileInfo.id}`;

  switch (fileInfo.type) {
    case 'document':
      title = 'Google Document';
      description = 'View document in Drive';
      thumbnail = 'https://ssl.gstatic.com/docs/doclist/images/mediatype/icon_1_document_x64.png';
      break;
    case 'spreadsheet':
      title = 'Google Spreadsheet';
      description = 'View spreadsheet in Drive';
      thumbnail = 'https://ssl.gstatic.com/docs/doclist/images/mediatype/icon_1_spreadsheet_x64.png';
      break;
    case 'presentation':
      title = 'Google Presentation';
      description = 'View presentation in Drive';
      thumbnail = 'https://ssl.gstatic.com/docs/doclist/images/mediatype/icon_1_presentation_x64.png';
      break;
    case 'form':
      title = 'Google Form';
      description = 'View form in Drive';
      thumbnail = 'https://ssl.gstatic.com/docs/doclist/images/mediatype/icon_1_form_x64.png';
      break;
    default:
      title = 'Google Drive File';
      description = 'View file in Drive';
      thumbnail = proxyThumbnailUrl;
  }

  return {
    title: truncateDescription(title),
    description: truncateDescription(description),
    thumbnail,
    allThumbnails: [thumbnail]
  };
}

async function getGrainMetadata(url, basicMetadata) {
  let description = basicMetadata.description || '';
  
  // Clean up and enhance Grain description
  if (description) {
    description = description.replace(/<[^>]*>/g, '');
    description = description.includes('Grain') ? 
      description : `Grain Video: ${description}`;
  } else {
    description = 'Watch video highlight on Grain';
  }

  const thumbnail = basicMetadata.thumbnail || basicMetadata.image || '';

  return {
    title: truncateDescription(basicMetadata.title || 'Grain Video'),
    description: truncateDescription(description),
    thumbnail,
    allThumbnails: thumbnail ? [thumbnail] : []
  };
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req.query;

  if (!/^https?:\/\/\S+\.\S+$/.test(url)) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  try {
    // Check for YouTube URLs
    const youtubeVideoId = getYoutubeVideoId(url);
    if (youtubeVideoId) {
      const metadata = await getYouTubeMetadata(youtubeVideoId);
      return res.status(200).json(metadata);
    }

    // Check for LinkedIn URLs
    const linkedInInfo = getLinkedInInfo(url);
    if (linkedInInfo) {
      const metadata = await getLinkedInMetadata(linkedInInfo);
      return res.status(200).json(metadata);
    }

    // Check for Google Drive URLs
    const driveInfo = getDriveFileInfo(url);
    if (driveInfo) {
      const metadata = await getDriveMetadata(driveInfo);
      return res.status(200).json(metadata);
    }

    // For other URLs, try metadata-scraper first
    try {
      const metadata = await metadataScraper(url);
      const extractedImages = await extractImagesFromHtml(url);
      
      // Special handling for Grain
      if (isGrainUrl(url)) {
        const grainMetadata = await getGrainMetadata(url, metadata);
        return res.status(200).json(grainMetadata);
      }

      // Combine and deduplicate all images
      const allThumbnails = new Set([
        ...(metadata.image ? [metadata.image] : []),
        ...(metadata.images || []),
        ...extractedImages
      ]);

      // Filter out invalid URLs and duplicates
      const validThumbnails = Array.from(allThumbnails)
        .filter(img => img && img.startsWith('http'))
        .filter((img, index, self) => self.indexOf(img) === index);

      const response = {
        title: truncateDescription(metadata.title || metadata.siteName || new URL(url).hostname),
        description: truncateDescription(metadata.description || `Visit ${new URL(url).hostname}`),
        thumbnail: validThumbnails[0] || '',
        allThumbnails: validThumbnails
      };

      // If no thumbnail is found, try to get the site's favicon
      if (!response.thumbnail) {
        try {
          const domain = new URL(url).origin;
          const faviconUrl = `${domain}/favicon.ico`;
          const faviconResponse = await fetchWithTimeout(faviconUrl);
          if (faviconResponse.ok) {
            response.thumbnail = faviconUrl;
            response.allThumbnails.push(faviconUrl);
          }
        } catch (error) {
          console.error('Favicon fetch failed:', error.message);
        }
      }

      return res.status(200).json(response);
    } catch (error) {
      // If metadata-scraper fails, provide basic fallback
      const urlObj = new URL(url);
      const extractedImages = await extractImagesFromHtml(url);
      
      const response = {
        title: truncateDescription(urlObj.hostname),
        description: truncateDescription(`Visit ${urlObj.hostname}`),
        thumbnail: extractedImages[0] || '',
        allThumbnails: extractedImages
      };

      // Try to get favicon as fallback thumbnail
      if (!response.thumbnail) {
        try {
          const faviconUrl = `${urlObj.origin}/favicon.ico`;
          const faviconResponse = await fetchWithTimeout(faviconUrl);
          if (faviconResponse.ok) {
            response.thumbnail = faviconUrl;
            response.allThumbnails.push(faviconUrl);
          }
        } catch (error) {
          console.error('Favicon fetch failed:', error.message);
        }
      }

      return res.status(200).json(response);
    }
  } catch (error) {
    console.error('Metadata Fetch Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch metadata' });
  }
}
