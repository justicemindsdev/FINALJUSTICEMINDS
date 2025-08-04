import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <title>Justice Minds</title>
        <link rel="shortcut icon" href="/smalllogo.png" type="image/x-icon" />
        
        {/* PWA Meta Tags */}
        <meta name="application-name" content="Justice Minds" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Justice Minds" />
        <meta name="description" content="Justice Minds - Legal Evidence Management System" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#2B5797" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#000000" />

        {/* Viewport for mobile responsiveness */}
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, user-scalable=no, viewport-fit=cover" />

        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/logomain.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/logomain.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/logomain.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/logomain.png" />

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Splash Screens for iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* Preconnect to external domains for better performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://accounts.google.com" />
        <link rel="preconnect" href="https://gmail.googleapis.com" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
