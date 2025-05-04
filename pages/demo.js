import { useState, useEffect } from "react";
import ClientProfile from "@/components/ClientProfile";
import { Geist, Geist_Mono } from "next/font/google";

// Font setup
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function DemoPage() {
  const [csvData, setCsvData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCsvData = async () => {
      try {
        const response = await fetch('/mailsuite_tracks_1744690976.csv');
        const text = await response.text();
        setCsvData(text);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load CSV data:', error);
        setLoading(false);
      }
    };

    fetchCsvData();
  }, []);

  return (
    <div className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-[#0C0C0C] text-white p-6`}>
      <h1 className="text-2xl font-bold mb-6">Email Statistics Dashboard Demo</h1>
      
      {loading ? (
        <div className="text-center">Loading...</div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold mb-4">Contact Profile with Statistics</h2>
          <ClientProfile 
            email="streetlicensing@westminster.gov.uk" 
            name="street, tradinglicensing: WCC" 
            csvData={csvData}
          />
        </div>
      )}
    </div>
  );
}
