import { useEffect, useRef } from 'react';

/**
 * Isolated component for rendering email content with scoped styles
 */
export default function EmailContent({ content, isHtml }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    if (!iframeRef.current || !content) return;

    const iframe = iframeRef.current;
    const doc = iframe.contentDocument || iframe.contentWindow.document;

    // Create the HTML content with scoped styles
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              margin: 0;
              padding: 16px;
              font-family: Arial, system-ui, -apple-system, sans-serif !important;
              color: black !important;
              background-color:white !important;
              line-height: 1.5;

            }
            
            * {
              max-width: 100% !important;
              font-family: inherit !important;
              line-height: inherit !important;

              color: black !important;
              background-color:white !important;
            }

            a {
              color: #60A5FA !important;
              text-decoration: underline !important;
            }

            img {
              display: inline-block;
              height: auto;
              max-width: 100%;
              margin: 0.5rem 0;
            }

            p, div {
              margin: 0.5rem 0;
              padding: 0;
            }

          </style>
        </head>
        <body>
          ${isHtml ? content : `<pre style="white-space: pre-wrap;">${content}</pre>`}
        </body>
      </html>
    `;

    // Write the content to the iframe
    doc.open();
    doc.write(html);
    doc.close();

    // Adjust iframe height to content
    const resizeIframe = () => {
      if (iframe && iframe.contentWindow) {
        iframe.style.height = 
          iframe.contentWindow.document.documentElement.scrollHeight + 'px';
      }
    };

    // Handle iframe load and window resize
    iframe.onload = resizeIframe;
    window.addEventListener('resize', resizeIframe);

    // Add click handler for links to open in new tab
    const links = doc.getElementsByTagName('a');
    for (let i = 0; i < links.length; i++) {
      links[i].target = '_blank';
      links[i].rel = 'noopener noreferrer';
    }

    return () => {
      window.removeEventListener('resize', resizeIframe);
    };
  }, [content, isHtml]);

  return (
    <iframe
      ref={iframeRef}
      className="w-full rounded-lg"
      title="Email content"
      sandbox="allow-same-origin"
    />
  );
}
