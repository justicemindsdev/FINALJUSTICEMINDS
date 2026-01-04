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

    // Create the HTML content - preserve original email styling for evidence
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            /* Base styles - preserve original email appearance */
            body {
              margin: 0;
              padding: 16px;
              font-family: Arial, system-ui, -apple-system, sans-serif;
              color: #222222;
              background-color: #ffffff;
              line-height: 1.6;
              font-size: 14px;
            }

            /* Responsive images */
            img {
              display: inline-block;
              height: auto;
              max-width: 100%;
            }

            /* Ensure content fits */
            * {
              max-width: 100%;
              box-sizing: border-box;
            }

            /* Default link styling */
            a {
              color: #1a73e8;
            }

            /* Tables - common in email */
            table {
              border-collapse: collapse;
            }

            /* Print styles for evidence preservation */
            @media print {
              body {
                background-color: white !important;
                color: black !important;
                padding: 0;
                font-size: 12pt;
              }

              a {
                color: #1a73e8 !important;
                text-decoration: underline;
              }

              img {
                max-width: 100% !important;
                page-break-inside: avoid;
              }

              /* Ensure all content prints */
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
          </style>
        </head>
        <body>
          ${isHtml ? content : `<pre style="white-space: pre-wrap; font-family: inherit;">${content}</pre>`}
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
      className="w-full rounded-lg bg-white shadow-lg border border-gray-300"
      title="Email content"
      sandbox="allow-same-origin"
      style={{ minHeight: '200px' }}
    />
  );
}
