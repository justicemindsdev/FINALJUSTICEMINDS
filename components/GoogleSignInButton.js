import { GoogleLogin } from "@react-oauth/google";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function GoogleSignInButton({ onLoginStart }) {
  const [error, setError] = useState(null);

  // Helper function to set cookie
  const setCookie = (name, value, days = 7) => {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    const isSecure = window.location.protocol === 'https:';
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax${isSecure ? '; Secure' : ''}`;
  };

  // Decode JWT to get user info
  const decodeJwt = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('JWT decode error:', e);
      return null;
    }
  };

  const handleSuccess = async (credentialResponse) => {
    try {
      if (onLoginStart) onLoginStart();

      // Decode the JWT credential to get user info
      const decoded = decodeJwt(credentialResponse.credential);

      if (!decoded) {
        throw new Error('Failed to decode credential');
      }

      const userData = {
        id: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
        credential: credentialResponse.credential
      };

      // Store in localStorage
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("access_token", credentialResponse.credential);

      // Set cookie for middleware auth check
      setCookie("access_token", credentialResponse.credential);

      // Save to Supabase
      try {
        await supabase.from('profiles').upsert({
          id: userData.id,
          email: userData.email,
          full_name: userData.name,
          avatar_url: userData.picture,
          access_token: credentialResponse.credential
        }, { onConflict: 'id' });
      } catch (e) {
        console.error('Supabase error:', e);
      }

      // Redirect to dashboard
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Login error:", error);
      setError("Authentication failed");
    }
  };

  return (
    <div className="flex flex-col items-center">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => setError("Google Sign-In failed")}
        useOneTap={false}
        shape="pill"
        size="large"
        text="signin_with"
        theme="filled_black"
      />
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
}
