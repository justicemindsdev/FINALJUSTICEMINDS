import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { GoogleOAuthProvider } from "@react-oauth/google";
import GoogleSignInButton from "../../components/GoogleSignInButton";
import { useAuth } from "@/lib/authUtils";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabase";
import axios from "axios";

export default function Login() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [progress, setProgress] = useState(30);

  // Helper function to set cookie
  const setCookie = (name, value, days = 7) => {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    const isSecure = window.location.protocol === 'https:';
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax${isSecure ? '; Secure' : ''}`;
  };

  // Handle OAuth redirect callback
  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Check for access_token in URL hash (from Google redirect)
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        setIsLoggingIn(true);

        // Parse the hash fragment
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');

        if (accessToken) {
          try {
            // Fetch user info from Google
            const userResponse = await axios.get(
              `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${accessToken}`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            const userData = {
              id: userResponse.data.id,
              email: userResponse.data.email,
              name: userResponse.data.name,
              picture: userResponse.data.picture,
              access_token: accessToken
            };

            // Store in localStorage
            localStorage.setItem("user", JSON.stringify(userData));
            localStorage.setItem("access_token", accessToken);

            // Set cookie for middleware auth check
            setCookie("access_token", accessToken);

            // Save to Supabase
            try {
              await supabase.from('profiles').upsert({
                id: userData.id,
                email: userData.email,
                full_name: userData.name,
                avatar_url: userData.picture,
                access_token: accessToken
              }, { onConflict: 'id' });
            } catch (e) {
              console.error('Supabase error:', e);
            }

            // Clear the hash and redirect
            window.history.replaceState(null, '', window.location.pathname);
            window.location.href = '/dashboard';
          } catch (error) {
            console.error('OAuth callback error:', error);
            setIsLoggingIn(false);
          }
        }
      }
    };

    handleOAuthCallback();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setProgress(100), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  // Show logging in state
  if (isLoggingIn) {
    return (
      <div className="h-screen w-screen bg-[#0c0c0c] flex flex-col items-center justify-center">
        <Progress value={progress} className="w-1/3 mb-4" />
        <p className="text-white text-lg">Logging you in...</p>
      </div>
    );
  }

  // Don't show anything while checking auth state
  if (loading) return null;

  // If user is authenticated, don't render the login page
  if (user) return null;

  return (
    <GoogleOAuthProvider clientId={process.env.GOOGLE_CLIENT_ID}>
      <div className="h-screen w-screen bg-[#0c0c0c]">
        <div className="fixed grid place-items-center backdrop-blur-sm top-0 right-0 left-0 z-50 w-full inset-0 h-modal h-full justify-center items-center">
          <div className="relative container m-auto px-6">
            <div className="m-auto md:w-7/12">
              <div className="rounded-xl border border-gray-700 bg-gradient-to-br from-[#151515] to-[#141414] shadow-xl">
                <div className="p-8">
                  <div className="space-y-4">
                    <img 
                      src="/smalllogo.png" 
                      alt="Justice Minds Logo"
                      loading="lazy" 
                      className="w-16" 
                    />
                    <h2 className="mb-8 text-2xl text-white font-bold">
                      Justice Minds - Data Driven Advocacy
                    </h2>
                  </div>
                  <div className="mt-10 grid space-y-4">
                    <GoogleSignInButton onLoginStart={() => setIsLoggingIn(true)} />
                  </div>
                  <div className="mt-14 space-y-4 py-3 text-gray-600 dark:text-gray-400 text-center">
                    <p className="text-xs">
                      By proceeding, you agree to our
                      <a 
                        href="/terms" 
                        className="underline hover:text-gray-500 transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        &nbsp;Terms of Use&nbsp;
                      </a>
                      and confirm you have read our
                      <a 
                        href="/privacy" 
                        className="underline hover:text-gray-500 transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        &nbsp;Privacy and Cookie Statement
                      </a>
                      .
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
