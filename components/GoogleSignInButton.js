import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function GoogleSignInButton({ onLoginStart }) {
  const [error, setError] = useState(null);

  const createOrUpdateProfile = async (userData, accessToken) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: userData.id,
          email: userData.email,
          full_name: userData.name,
          avatar_url: userData.picture,
          access_token: accessToken
        }, {
          onConflict: 'id'
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving profile:', error);
      // Don't throw error here, allow sign-in to continue
      return null;
    }
  };

  // Helper function to set cookie
  const setCookie = (name, value, days = 7) => {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    const isSecure = window.location.protocol === 'https:';
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax${isSecure ? '; Secure' : ''}`;
  };

  const login = useGoogleLogin({
    flow: "implicit",
    onSuccess: async (codeResponse) => {
      try {
        // Notify parent component about login start
        if (onLoginStart) onLoginStart();

        // Fetch user info from Google
        const userResponse = await axios.get(
          `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${codeResponse.access_token}`,
          { headers: { Authorization: `Bearer ${codeResponse.access_token}` } }
        );

        // Store the complete user data
        const userData = {
          id: userResponse.data.id,
          email: userResponse.data.email,
          name: userResponse.data.name,
          picture: userResponse.data.picture,
          access_token: codeResponse.access_token
        };

        // Store in localStorage
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("access_token", codeResponse.access_token);

        // Set cookie for middleware auth check
        setCookie("access_token", codeResponse.access_token);

        // Fetch emails (don't block sign-in if this fails)
        try {
          const gmailResponse = await axios.get(
            "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10",
            { headers: { Authorization: `Bearer ${codeResponse.access_token}` } }
          );
          localStorage.setItem(
            "emails",
            JSON.stringify(gmailResponse.data.messages)
          );
        } catch (emailError) {
          console.error("Error fetching emails:", emailError);
          // Continue with sign-in even if email fetch fails great
        }

        // Create or update profile in Supabase (don't block sign-in if this fails)
        await createOrUpdateProfile(userData, codeResponse.access_token);

        // Hard redirect to dashboard (ensures cookie is sent with request)
        window.location.href = "/dashboard";
      } catch (error) {
        console.error("Login error:", error);
        setError("Authentication failed");
      }
    },
    onError: (errorResponse) => {
      console.error("Google Sign-In Error:", errorResponse);
      setError("Google Sign-In failed");
    },
    scope: "https://www.googleapis.com/auth/gmail.readonly profile email",
  });

  return (
    <>
      <button
        onClick={() => login()}
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
    </>
  );
}
