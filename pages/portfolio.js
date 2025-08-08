import { Geist } from "next/font/google";
import Head from "next/head";
import ParticleBackground from '@/components/Particles';
import Navbar from '@/components/Navbar';
import { useState, useEffect } from 'react';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const endorsements = [
  {
    id: 1,
    name: "Westminster City Council",
    title: "WESTMINSTER ENDORSEMENT",
    subtitle: "CITY COUNCIL RECOGNITION",
    imgUrl: "/assets/Logo final/processed_city westminster.png",
    color: "#3B82F6",
    content: "As part of Ben Mak's extensive contributions to public advocacy, he has been recognized by Westminster Outreach for his expertise, legal knowledge, and ability to inspire others through public speaking engagements."
  },
  {
    id: 2,
    name: "House of Commons",
    title: "PARLIAMENTARY ENDORSEMENT",
    subtitle: "HOUSE OF COMMONS RECOGNITION",
    imgUrl: "/assets/Logo final/processed_house commons.png",
    color: "#10B981",
    content: "Ben's advocacy has been recognized at the highest levels of government, with direct support from Dan Carden MP and Liverpool City Council's Chief Executive Tony Reeves. \"Dear Ben, Thank you for recently contacting my office about your concerns...I hope my support and contacting Liverpool City Council for a referral to social services has been of some assistance and helped towards this.\" — Parliamentary - Tony Reeves, Chief Executive - The House of Commons",
    doc: "/CERTIFICATES ENDORESEMENTS/asdas.jpeg"
  },
  {
    id: 3,
    name: "Liverpool City Council",
    title: "LOCAL AUTHORITY RECOGNITION",
    subtitle: "PRACTITIONER ENDORSEMENT",
    imgUrl: "/assets/Logo final/processed_lpool city counil .png",
    color: "#6366F1",
    content: "Ben's committed work on Liverpool City Council to supporting and enhancing service provision and relationship efficacy. Acknowledged by 19 years Fostering Social Worker who was \"honoured\" to meet Ben."
  },
  {
    id: 4,
    name: "Department of Health",
    title: "SECRETARY OF STATE ENGAGEMENT",
    subtitle: "Health and Social Care communications",
    imgUrl: "/assets/Logo final/processed_download.png",
    color: "#22C55E",
    content: "Sajid Javid Health and social care 2021-2022 Highlighting matters raised and acknowledged by Chief executive of Liverpool City Council. Ben's endured resilience gets a response and matters to their attention."
  },
  {
    id: 5,
    name: "Justice Recognition",
    title: "JUSTICE ENDORSEMENT",
    subtitle: "LEGAL ADVOCACY RECOGNITION",
    imgUrl: "/assets/Logo final/processed_justice .png",
    color: "#8B5CF6",
    content: "Ben's legal acumen and perseverance have been recognized in the High Court of Justice, successful appeal revision despite statistics on 1% likelihood. Demonstrating exceptional advocacy skills."
  },
  {
    id: 6,
    name: "NSPCC",
    title: "NSPCC ENDORSEMENT",
    subtitle: "CHILD PROTECTION RECOGNITION",
    imgUrl: "/assets/Logo final/processed_nspsc.png",
    color: "#EF4444",
    content: "Ben's commitment to child protection and safeguarding has been recognized by the NSPCC."
  },
  {
    id: 7,
    name: "OBE Nomination",
    title: "OBE NOMINATION INTERVIEW",
    subtitle: "ORDER OF THE BRITISH EMPIRE",
    imgUrl: "/assets/Logo final/processed_OBE-GOLD-Effect-logo.png",
    color: "#F59E0B",
    content: "Ben Mak's extraordinary qualifications for the highest honors have been recognized through an OBE nomination interview."
  },
  {
    id: 8,
    name: "Liverpool College",
    title: "EDUCATIONAL EXCELLENCE",
    subtitle: "ACADEMIC RECOGNITION",
    imgUrl: "/assets/Logo final/processed_lliverpool collehe .png",
    color: "#14B8A6",
    content: "Recognition from Liverpool College for academic excellence and contributions to educational advancement."
  },
  {
    id: 9,
    name: "UK Parliament",
    title: "PARLIAMENTARY RECOGNITION",
    subtitle: "LEGISLATIVE ENGAGEMENT",
    imgUrl: "/assets/Logo final/processed_UK-Parliament-Logo-1536x864.png",
    color: "#8B5CF6",
    content: "Acknowledgment from UK Parliament for contributions to legislative discourse and policy development."
  },
  {
    id: 10,
    name: "Cumbria Police",
    title: "SENIOR DETECTIVE COMMENDATION",
    subtitle: "LEGAL EXPERTISE & RESILIENCE",
    imgUrl: "/assets/Logo final/cumbria police.png",
    color: "#DC2626",
    content: "\"Mr. MAK's exceptional understanding of complex legal statutes proved vital in a serious police investigation. His ability to articulate and break down intricate legal concepts into actionable intelligence was remarkable. Despite facing severe personal challenges, his resilience and professional approach remained exemplary.\" — Senior Detective, Cumbria Police (2023)"
  }
];

const certificates = [
  {
    src: "/assets/CERTIFICATES ENDORESEMENTS/Finder 2025-02-12 08.46.26.png",
    title: "Professional Certification in Child Protection"
  },
  {
    src: "/assets/CERTIFICATES ENDORESEMENTS/Finder 2025-02-12 08.46.31.png",
    title: "Advanced Safeguarding Certification"
  },
  {
    src: "/assets/CERTIFICATES ENDORESEMENTS/Finder 2025-02-12 08.46.44.png",
    title: "Legal Advocacy Qualification"
  },
  {
    src: "/assets/CERTIFICATES ENDORESEMENTS/Finder 2025-02-12 08.47.31.png",
    title: "Child Welfare Specialist Certification"
  },
  {
    src: "/assets/CERTIFICATES ENDORESEMENTS/Finder 2025-02-12 08.47.32.png",
    title: "NSPCC Endorsed Child Protection"
  },
  {
    src: "/assets/CERTIFICATES ENDORESEMENTS/Finder 2025-02-12 08.47.59.png",
    title: "Mental Health Advocacy Certification"
  },
  {
    src: "/assets/CERTIFICATES ENDORESEMENTS/Finder 2025-02-12 08.48.08.png",
    title: "SEND Support Services Qualification"
  },
  {
    src: "/assets/CERTIFICATES ENDORESEMENTS/Yoink 2025-02-12 09.28.15.png",
    title: "Government Recognition Award"
  },
  {
    src: "/assets/CERTIFICATES ENDORESEMENTS/Finder 2025-02-12 09.27.35.png",
    title: "Children's Rights Advocacy Certificate"
  },
  {
    src: "/assets/CERTIFICATES ENDORESEMENTS/Finder 2025-02-12 09.29.50.png",
    title: "Independent Advocacy Training"
  },
  {
    src: "/assets/CERTIFICATES ENDORESEMENTS/Finder 2025-02-12 09.30.10.png",
    title: "Professional Development Excellence"
  },
  {
    src: "/assets/CERTIFICATES ENDORESEMENTS/Finder 2025-02-12 09.32.13.png",
    title: "Safeguarding Leadership Award"
  },
  {
    src: "/CERTIFICATES ENDORESEMENTS/asdas.jpeg",
    title: "Parliamentary Chief Executive Tony Reeves Acknowledgement"
  }
];

const credentials = [
  {
    number: "01",
    text: "CEO & Policy Officer at Justice Minds, Author of PhD research paper titled \"Reconceptualising Abuse: Theoretical Innovations and Practical Applications\"",
    type: "Leadership"
  },
  {
    number: "02", 
    text: "Partner initiatives pass OBE interview nomination, Fashion Design BA graduation Womenswear Technology",
    type: "Achievement"
  },
  {
    number: "03",
    text: "2 years in Master of Law studies, Senior Staff Level 3 Safeguarding Certification",
    type: "Legal"
  },
  {
    number: "04",
    text: "Children's S.E.N.D expertise demonstrated, Autism legal initiative chosen by barrister",
    type: "Specialist"
  },
  {
    number: "05",
    text: "Passed City Council Independent Scrutineer for Children & Adults, Justice Minds Non-Profit Advocacy established",
    type: "Governance"
  },
  {
    number: "06",
    text: "Advocate for Children's and Adults Rights, Key rights statutes understanding advanced",
    type: "Advocacy"
  },
  {
    number: "07",
    text: "Families and individuals children's advocate seasoned, Certified in Safeguarding Children, endorsed by NSPCC",
    type: "Protection"
  },
  {
    number: "08",
    text: "Completed Independent Advocacy training under Care Act, Ambassador for University of Arts London",
    type: "Training"
  },
  {
    number: "09",
    text: "Completed Level 3 Safeguarding Adults Training course, Endorsed for Autism and LGBTQ+ support",
    type: "Certification"
  },
  {
    number: "10",
    text: "Recognized for overcoming challenges, supporting communities, Received press endorsement and acknowledged work alongside MPs",
    type: "Recognition"
  }
];

export default function Portfolio() {
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (selectedCard || selectedCertificate) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }
    setIsVisible(false);
  }, [selectedCard, selectedCertificate]);

  const CarouselRow = ({ direction = 1, speed = 40, startIndex = 0 }) => {
    const shiftedEndorsements = [...endorsements.slice(startIndex), ...endorsements.slice(0, startIndex)];
    
    return (
      <div className="flex items-center gap-8 animate-scroll" style={{
        animation: `scroll-${direction > 0 ? 'left' : 'right'} ${speed}s linear infinite`,
        paddingTop: "1rem",
        paddingBottom: "1rem"
      }}>
        {[...shiftedEndorsements, ...shiftedEndorsements].map((endorsement, index) => (
          <div
            key={`${endorsement.id}-${index}`}
            className="flex-shrink-0 hover:scale-105 transition-transform duration-200 cursor-pointer"
            onClick={() => setSelectedCard(endorsement)}
          >
            <div className="relative w-96 h-64 rounded-2xl overflow-hidden flex items-start justify-center bg-gray-900/50 backdrop-blur-sm border border-gray-700 hover:border-blue-500">
              <div className="absolute inset-0 flex flex-col items-center">
                <div className="flex-1 flex items-center justify-center -mt-4">
                  <div className="w-48 h-48 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <div className="text-center p-4">
                      <div className="text-4xl mb-2">🏆</div>
                      <div className="text-sm font-medium text-white">{endorsement.name}</div>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-4 left-0 right-0 text-center flex flex-col items-center gap-1">
                  <h3 className="text-lg font-thin tracking-wide text-white whitespace-nowrap px-2">
                    {endorsement.title}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {endorsement.subtitle}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`${geistSans.variable} min-h-screen bg-[#0c0c0c] text-white relative`}>
      <ParticleBackground />
      <Navbar />
      
      <Head>
        <title>Portfolio - Justice Minds</title>
        <meta property="og:title" content="Portfolio - Justice Minds" />
        <meta property="og:description" content="Professional portfolio featuring certificates, endorsements, and achievements in digital forensics and legal advocacy." />
      </Head>

      <div className="relative z-10 pt-20">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Professional Portfolio
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Our credentials, certifications, and professional endorsements demonstrate our commitment to excellence in legal advocacy and child protection.
            </p>
          </div>

          {/* Endorsements Section */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold mb-12 text-center">
              Endorsements & Accolades
            </h2>
            <div className="relative overflow-hidden">
              <div className="space-y-12 fade-edges">
                <CarouselRow direction={1} speed={40} startIndex={0} />
                <CarouselRow direction={-1} speed={35} startIndex={5} />
                <CarouselRow direction={1} speed={45} startIndex={7} />
              </div>
            </div>
          </div>

          {/* Certificates Section */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold mb-12 text-center">
              Professional Certifications
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {certificates.map((cert, index) => (
                <div 
                  key={index} 
                  className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-all duration-300 hover:transform hover:scale-105 cursor-pointer"
                  onClick={() => setSelectedCertificate(cert)}
                >
                  <div className="bg-gradient-to-br from-blue-600 to-purple-600 h-48 rounded-lg mb-6 flex items-center justify-center">
                    <div className="text-center p-4">
                      <div className="text-4xl mb-2">📜</div>
                      <div className="text-sm font-medium text-white">Certificate</div>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{cert.title}</h3>
                  <p className="text-gray-400 text-sm">Professional Certification</p>
                </div>
              ))}
            </div>
          </div>

          {/* Credentials Section */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold mb-12 text-center">Professional Achievements & Recognition</h2>
            <p className="text-center text-gray-400 mb-8">Verified credentials and expertise in advocacy, law, and child protection</p>
            
            <div className="space-y-4">
              {credentials.map((credential, index) => (
                <div key={index} className="flex items-start gap-6 bg-gray-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-all duration-300">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {credential.number}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-300 mb-2">{credential.text}</p>
                    <span className="inline-block px-3 py-1 bg-blue-900/30 text-blue-400 rounded-full text-sm">
                      {credential.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Section */}
          <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-2xl p-8 border border-gray-700">
            <h2 className="text-3xl font-bold mb-8 text-center">Our Impact</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-blue-400 mb-2">500+</div>
                <p className="text-gray-400">Cases Analyzed</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-purple-400 mb-2">98%</div>
                <p className="text-gray-400">Success Rate</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-green-400 mb-2">50TB+</div>
                <p className="text-gray-400">Data Processed</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-yellow-400 mb-2">24/7</div>
                <p className="text-gray-400">Support Available</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Endorsements */}
      {selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95" onClick={() => setSelectedCard(null)}>
          <div className="relative w-full max-w-4xl mx-4 h-screen flex items-center justify-center" onClick={e => e.stopPropagation()}>
            {selectedCard.doc && (
              <img src={selectedCard.doc} className="w-1/3 rounded-lg opacity-40 mr-8" alt="" />
            )}
            <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg p-8 border border-gray-700 max-w-2xl">
              <div className="mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <span className="text-2xl">🏆</span>
                </div>
                <h2 className="text-4xl font-bold mb-4 text-center">{selectedCard.title}</h2>
                <h3 className="text-xl text-gray-400 mb-6 text-center">{selectedCard.subtitle}</h3>
              </div>
              <p className="text-gray-300 leading-relaxed mb-6">
                {selectedCard.content.split('"').map((text, i) => 
                  i % 2 === 0 ? text : (
                    <span key={i} className="font-thin italic block my-4 pl-4 border-l-2 border-blue-500">
                      "{text}"
                    </span>
                  )
                )}
              </p>
              <button 
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                onClick={() => setSelectedCard(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Certificates */}
      {selectedCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95" onClick={() => setSelectedCertificate(null)}>
          <div className="relative max-w-4xl mx-4" onClick={e => e.stopPropagation()}>
            <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg p-8 border border-gray-700">
              <h3 className="text-2xl font-bold mb-6 text-center">{selectedCertificate.title}</h3>
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 h-96 rounded-lg mb-6 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">📜</div>
                  <div className="text-white font-bold">Professional Certificate</div>
                </div>
              </div>
              <button 
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                onClick={() => setSelectedCertificate(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes scroll-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .fade-edges {
          position: relative;
          overflow: hidden;
        }
        .fade-edges::before,
        .fade-edges::after {
          content: '';
          position: absolute;
          top: 0;
          width: 100px;
          height: 100%;
          z-index: 10;
          pointer-events: none;
        }
        .fade-edges::before {
          left: 0;
          background: linear-gradient(to right, rgba(12, 12, 12, 1), transparent);
        }
        .fade-edges::after {
          right: 0;
          background: linear-gradient(to left, rgba(12, 12, 12, 1), transparent);
        }
      `}</style>
    </div>
  );
}
