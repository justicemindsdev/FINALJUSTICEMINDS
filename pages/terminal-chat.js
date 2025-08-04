import { useState } from 'react';
import TerminalChat from '../components/TerminalChat';
import Navbar from '../components/Navbar';

export default function TerminalChatPage() {
  const [siteUpdated, setSiteUpdated] = useState(false);

  const handleSiteUpdate = () => {
    setSiteUpdated(true);
    // Optionally trigger a refresh or show notification
    setTimeout(() => setSiteUpdated(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Terminal Chat - Site Modifier
            </h1>
            <p className="text-gray-600">
              Give English instructions to modify your site. Changes will be previewed before deployment.
            </p>
            
            {siteUpdated && (
              <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                ✅ Site updated and deployed successfully!
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 h-[600px]">
            <TerminalChat onSiteUpdate={handleSiteUpdate} />
          </div>

          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Example Instructions:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• "Add a contact form to the about page"</li>
              <li>• "Change the theme color to blue"</li>
              <li>• "Create a new testimonials page"</li>
              <li>• "Add a 'Get Started' button to the homepage"</li>
              <li>• "Update the navbar with a new menu item"</li>
            </ul>
          </div>

          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">How it works:</h3>
            <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
              <li>Type your instruction in English</li>
              <li>AI analyzes and generates the necessary code changes</li>
              <li>Preview the changes before applying</li>
              <li>Approve to automatically commit to Git and deploy to Vercel</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}