"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaHome, FaShoppingCart, FaHeadphones, FaBook, FaImage, FaPlayCircle, FaInfoCircle, FaEnvelope, FaBars, FaTimes } from 'react-icons/fa';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  // Check if the current route matches the link
  const isActive = (path) => pathname === path;

  // Toggle mobile menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Handle resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Navigation links with icons
  const navLinks = [
    { path: '/', name: 'Home', icon: FaHome },
    { path: '/shop', name: 'Shop', icon: FaShoppingCart },
    { path: '/audio-lectures', name: 'Audio Lectures', icon: FaHeadphones },
    { path: '/digital-books', name: 'Digital Books', icon: FaBook },
    { path: '/islamic-art', name: 'Islamic Art', icon: FaImage },
    { path: '/courses', name: 'Courses (Coming Soon)', icon: FaPlayCircle },
    { path: '/about', name: 'About Us', icon: FaInfoCircle },
    { path: '/contact', name: 'Contact', icon: FaEnvelope },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md py-4 px-4 sm:px-6 lg:px-8 font-['Cairo']">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-green-800 flex items-center gap-2">
          <FaBook className="text-green-600" />
          Khanqah Saifia
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              className={`flex items-center gap-2 text-gray-700 transition-all duration-300 ${
                isActive(link.path) ? 'text-green-600 font-semibold border-b-2 border-green-600' : 'hover:text-green-600'
              }`}
            >
              <link.icon className="text-lg" />
              <span>{link.name}</span>
            </Link>
          ))}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-green-600 text-2xl focus:outline-none"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMobile && isMenuOpen && (
        <nav className="md:hidden bg-white shadow-lg py-4 px-6 mt-2 rounded-lg animate-fadeIn">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`flex items-center gap-2 text-gray-700 transition-all duration-300 ${
                  isActive(link.path) ? 'text-green-600 font-semibold' : 'hover:text-green-600'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <link.icon className="text-lg" />
                <span>{link.name}</span>
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}