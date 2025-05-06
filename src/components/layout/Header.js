"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { usePathname } from 'next/navigation';
import { 
  FaSignOutAlt, 
  FaUser, 
  FaBars, 
  FaTimes, 
  FaHome, 
  FaInfoCircle, 
  FaSignInAlt, 
  FaUserPlus, 
  FaHandsHelping,
  FaShieldAlt
} from 'react-icons/fa';

export default function Header() {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  // Check if the current route matches the link
  const isActive = (path) => pathname === path;

  // Toggle mobile menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false);
      }
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Common link style function
  const getLinkStyle = (path) => {
    return `transition-all duration-300 flex items-center gap-2 py-2 ${
      isActive(path)
        ? 'text-yellow-400 border-b-2 border-yellow-400 font-bold'
        : 'hover:text-yellow-200'
    }`;
  };

  const navLinks = (
    <>
      <Link href="/" className={getLinkStyle('/')}>
        <FaHome className="text-lg" />
        <span>Home</span>
      </Link>
      <Link href="/about" className={getLinkStyle('/about')}>
        <FaInfoCircle className="text-lg" />
        <span>About</span>
      </Link>
      {status === 'authenticated' ? (
        <>
          <Link href="/profile" className={getLinkStyle('/profile')}>
            <FaUser className="text-lg" />
            <span>Profile</span>
          </Link>
          <Link href="/participation" className={getLinkStyle('/participation')}>
            <FaHandsHelping className="text-lg" />
            <span>Participate</span>
          </Link>
          {session?.user?.isAdmin && (
            <Link href="/admin" className={getLinkStyle('/admin')}>
              <FaShieldAlt className="text-lg" />
              <span>Admin</span>
            </Link>
          )}
          <Button
            variant="ghost"
            className="flex items-center space-x-2 text-white hover:bg-gray-700"
            onClick={() => {
              signOut({ callbackUrl: '/' });
              setIsMenuOpen(false);
            }}
          >
            <FaSignOutAlt className="text-lg" />
            <span>Sign Out</span>
          </Button>
        </>
      ) : (
        <>
          <Link href="/login" className={getLinkStyle('/login')}>
            <FaSignInAlt className="text-lg" />
            <span>Login</span>
          </Link>
          <Link href="/register" className={getLinkStyle('/register')}>
            <FaUserPlus className="text-lg" />
            <span>Sign Up</span>
          </Link>
        </>
      )}
    </>
  );

  return (
    <header className="bg-primary text-white py-4 px-6 shadow-md relative">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">Astana Aliya Murshidabad</Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {navLinks}
        </nav>
        
        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-white text-2xl focus:outline-none"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>
      
      {/* Mobile Navigation */}
      {isMobile && isMenuOpen && (
        <nav className="absolute top-full left-0 right-0 bg-primary shadow-lg z-50 flex flex-col space-y-4 py-4 px-6 md:hidden animate-fadeIn">
          {navLinks}
        </nav>
      )}
    </header>
  );
}