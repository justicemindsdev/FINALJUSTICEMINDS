import { useState } from "react";

export default function GoogleSignInButton({ onLoginStart }) {
  const [error, setError] = useState(null);

  const handleSignIn = () => {
    if (onLoginStart) onLoginStart();

    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const redirectUri = encodeURIComponent(window.location.origin + '/auth/login');
    const scope = encodeURIComponent('openid email profile https://www.googleapis.com/auth/gmail.readonly');
    const responseType = 'token';

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${scope}&prompt=consent`;

    // Full page redirect - no popup
    window.location.href = authUrl;
  };

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={handleSignIn}
        className="group h-12 px-6 border-2 bg-white text-black font-semibold border-gray-300 rounded-full transition duration-300 hover:border-blue-400"
      >
        <div className="relative flex items-center space-x-4 justify-center">
          <img
            className="w-5 h-5"
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            loading="lazy"
            alt="google logo"
          />
          <span>Sign in with Google</span>
        </div>
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
}
