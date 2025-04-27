// import { SessionProvider } from "next-auth/react";
import '@/styles/globals.css'

function MyApp({ Component, pageProps }) {
    return (
        // <SessionProvider session={pageProps.session}>
            <Component classname={`antialiased`} {...pageProps} />
        // </SessionProvider>
    );
}

export default MyApp;
