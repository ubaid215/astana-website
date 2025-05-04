'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { 
  FaTachometerAlt, 
  FaUsers, 
  FaTable, 
  FaFileExport, 
  FaCog, 
  FaDollarSign, 
  FaMoneyBill,
  FaBars,
  FaTimes,
} from 'react-icons/fa';
import { MenuIcon } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile when component mounts and on window resize
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // Close sidebar by default on mobile
      if (window.innerWidth < 768) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };

    // Initial check
    checkIsMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkIsMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: FaTachometerAlt },
    { name: 'Users', href: '/admin/users', icon: FaUsers },
    { name: 'Slots', href: '/admin/slots', icon: FaTable },
    { name: 'Reports', href: '/admin/reports', icon: FaFileExport },
    { name: 'Prices', href: '/admin/prices', icon: FaDollarSign },
    { name: 'Payments', href: '/admin/payments', icon: FaMoneyBill },
    { name: 'Settings', href: '/admin/settings', icon: FaCog },
  ];

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-primary text-white"
        onClick={toggleSidebar}
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-primary text-white transition-all duration-300 ease-in-out z-40 
          ${isOpen ? 'w-64' : 'w-16'} 
          ${isMobile && !isOpen ? '-translate-x-full' : 'translate-x-0'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h1 className={`font-bold transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>
            Admin Panel
          </h1>
          
          {/* Desktop Toggle Button */}
          <button 
            className="hidden md:block text-white hover:text-gray-300 transition-colors"
            onClick={toggleSidebar}
            aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isOpen ? <MenuIcon size={16} /> : <MenuIcon size={16} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-4">
          <ul className="space-y-2 px-2">
            {navItems.map((item) => (
              <li key={item.name}>
                <Link href={item.href}>
                  <Button
                    variant="ghost"
                    className={`w-full flex items-center ${isOpen ? 'justify-start' : 'justify-center'} 
                      ${pathname === item.href ? 'bg-secondary' : 'hover:bg-gray-700'} 
                      transition-all duration-200 ease-in-out`}
                  >
                    <item.icon className={`${isOpen ? 'mr-2' : 'mx-auto'} w-5 h-5`} />
                    <span className={`transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 hidden md:hidden'}`}>
                      {item.name}
                    </span>
                  </Button>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Mobile Backdrop */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
}