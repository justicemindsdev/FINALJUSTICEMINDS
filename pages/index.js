import { useRouter } from "next/router";
import { Geist } from "next/font/google";
import Head from "next/head";
import ParticleBackground from '@/components/Particles';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export default function Home() {
  const router = useRouter();

  return (
    <div className={`${geistSans.variable} min-h-screen bg-[#0c0c0c9a] text-white relative`}>
      <ParticleBackground />
      <Head>
        <title>Justice Minds Home</title>
        <meta property="og:url" content="https://www.justice-minds.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Justice Minds - Data Driven Advocacy" />
        <meta property="og:description" content="" />
        <meta property="og:image" content="https://opengraph.b-cdn.net/production/images/2792736a-d669-498f-9fc6-ffa13e92dd88.png?token=5ootqg1UDKFuyJhXVw9hepvnTYHevYxmYqsQRS1dUIw&height=763&width=1200&expires=33270879312" />
      </Head>
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <img 
              src="/logomain.png" 
              alt="Justice Minds Logo" 
              className="w-1/4 mx-auto mb-8"
            />
            <h1 className="text-4xl sm:text-6xl font-bold mb-6">
              Data Driven Legal Advocacy
            </h1>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
              Transform your legal practice with AI-powered insights and automated case management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/auth/login')}
                className="bg-blue-600 text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Get Started
              </button>
              <button
                onClick={() => router.push('/portfolio')}
                className="bg-transparent border-2 border-blue-600 text-blue-400 px-8 py-3 rounded-full text-lg font-semibold hover:bg-blue-600 hover:text-white transition-colors"
              >
                View Portfolio
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
