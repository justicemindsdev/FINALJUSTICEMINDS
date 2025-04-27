import React, { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const Navbar = ({ 
  user, 
  onLogout, 
  isMobileMenuOpen, 
  setIsMobileMenuOpen,
  onSidebarToggle,
  isSidebarOpen 
}) => {
  const router = useRouter();
  const [profileImage, setProfileImage] = useState(null);
  const isDashboard = router.pathname === '/dashboard';

  useEffect(() => {
    const fetchProfileImage = async () => {
      try {
        if (!user?.id) {
          if (user?.picture) {
            setProfileImage(user.picture);
          }
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single();

        if (error) {
          if (user?.picture) {
            setProfileImage(user.picture);
          }
          return;
        }

        if (data?.avatar_url) {
          setProfileImage(data.avatar_url);
        } else if (user?.picture) {
          setProfileImage(user.picture);
        }
      } catch (error) {
        if (user?.picture) {
          setProfileImage(user.picture);
        }
      }
    };
  }, [user]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0c0c0c] border-b border-[#222222]">
      <div className="flex items-center h-16 pl-4">
        {/* Left section with logo and sidebar toggle */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <img src="/smalllogo.png" className="w-10" alt="Logo" />
          </Link>
          {/* Only show sidebar toggle on dashboard */}
          {isDashboard && onSidebarToggle && (
            <button
              onClick={onSidebarToggle}
              className="p-2 text-gray-300 hover:text-white md:hidden"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
        </div>

        {/* Center section with navigation */}
        <div className="hidden md:flex items-center gap-6 flex-1 px-6">
          <div className="flex gap-2 items-center">
          <Link href="/dashboard">
            <span className={`cursor-pointer ${router.pathname === '/dashboard' ? 'text-white font-semibold' : 'text-gray-300 hover:text-white'}`}>
              Dashboard
            </span>
          </Link>
          <DropdownMenu>
      <DropdownMenuTrigger className="p-0 m-0" asChild>
        <span className="text-xs cursor-pointer hover:text-gray-300">▼</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-auto bg-[#1d1d1d] border border-[#494949]">
        <DropdownMenuLabel><Link href="/share/manage">
            <span className={`cursor-pointer ${router.pathname === '/share/manage' ? 'text-white font-semibold' : 'text-gray-300 hover:text-white'}`}>
              Manage Share
            </span>
          </Link></DropdownMenuLabel>
        
      </DropdownMenuContent>
    </DropdownMenu>
          </div>
          
          <Link href="/caseworks">
            <span className={`cursor-pointer ${router.pathname === '/caseworks' ? 'text-white font-semibold' : 'text-gray-300 hover:text-white'}`}>
              Case Works
            </span>
          </Link>
          <Link href="/journalists">
            <span className={`cursor-pointer ${router.pathname === '/journalists' ? 'text-white font-semibold' : 'text-gray-300 hover:text-white'}`}>
              Journalists
            </span>
          </Link>
        </div>

        {/* Right section */}
        <div className="flex items-center ml-auto">
          {/* Desktop logout */}
          <button 
            onClick={onLogout}
            className="hidden md:block text-red-400 hover:text-red-500 transition-colors mr-4"
          >
            Logout
          </button>

          {/* Mobile section (profile + menu) */}
          <div className="flex items-center md:hidden">
            {/* Profile image */}
            {user.picture && (
              <div className="relative">
                <img 
                  src={user.picture} 
                  className="w-8 h-8 rounded-full border-2 border-gray-700" 
                  alt={user?.name || 'Profile'}
                />
              </div>
            )}

            {/* Menu toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-300 hover:text-white ml-1 pr-2"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Desktop profile */}
          {user.picture && (
            <div className="relative hidden md:block md:mr-5">
              <img 
                src={user.picture} 
                className="w-8 h-8 rounded-full border-2 border-gray-700" 
                alt={user?.name || 'Profile'}
              />
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-[#222222] bg-[#0c0c0c]">
          <div className="px-4 py-3 space-y-3">
            <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
              <span className={`block py-2 ${router.pathname === '/dashboard' ? 'text-white font-semibold' : 'text-gray-300'}`}>
                Dashboard
              </span>
            </Link>
            <Link href="/share/manage" onClick={() => setIsMobileMenuOpen(false)}>
              <span className={`block py-2 ${router.pathname === '/share/manage' ? 'text-white font-semibold' : 'text-gray-300'}`}>
                Manage Share
              </span>
            </Link>
            <Link href="/caseworks" onClick={() => setIsMobileMenuOpen(false)}>
              <span className={`block py-2 ${router.pathname === '/caseworks' ? 'text-white font-semibold' : 'text-gray-300'}`}>
                Case Works
              </span>
            </Link>
            <Link href="/journalists" onClick={() => setIsMobileMenuOpen(false)}>
              <span className={`block py-2 ${router.pathname === '/journalists' ? 'text-white font-semibold' : 'text-gray-300'}`}>
                Journalists
              </span>
            </Link>
            <div className="flex items-center gap-4 pt-3 border-t border-[#222222]">
              <button 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onLogout();
                }}
                className="text-red-400 hover:text-red-500 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
