'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import {
  FaTachometerAlt,
  FaUsers,
  FaTable,
  FaCog,
  FaDollarSign,
  FaMoneyBill,
  FaBars,
  FaTimes,
  FaSignOutAlt,
  FaChartPie, // Added for Share Limits icon
} from 'react-icons/fa';
import { MenuIcon } from 'lucide-react';

export default function Layout({ children }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsOpen(!mobile);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: FaTachometerAlt },
    { name: 'Users', href: '/admin/users', icon: FaUsers },
    { name: 'Slots', href: '/admin/slots', icon: FaTable },
    { name: 'Prices', href: '/admin/prices', icon: FaDollarSign },
    { name: 'Share Limits', href: '/admin/share-limits', icon: FaChartPie }, // Added Share Limits
    { name: 'Payments', href: '/admin/payments', icon: FaMoneyBill },
    { name: 'Settings', href: '/admin/settings', icon: FaCog },
  ];

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleLogout = () => {
    signOut({ callbackUrl: '/admin/login' });
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Mobile Menu Button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-primary text-white"
        onClick={toggleSidebar}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
      >
        {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen bg-primary text-white transition-all duration-300 ease-in-out z-40 
          ${isOpen ? 'w-64' : 'w-16'} 
          ${isMobile && !isOpen ? '-translate-x-full' : 'translate-x-0'}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h1 className={`font-bold transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>
            Admin Panel
          </h1>
          <button
            className="hidden md:block text-white hover:text-gray-300 transition-colors"
            onClick={toggleSidebar}
            aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isOpen ? <MenuIcon size={16} /> : <MenuIcon size={16} />}
          </button>
        </div>

        <nav className="mt-4 flex flex-col h-[calc(100%-5rem)]">
          <ul className="space-y-2 px-2 flex-1">
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

          <div className="mt-auto px-2 pb-4">
            <Button
              variant="ghost"
              className={`w-full flex items-center ${isOpen ? 'justify-start' : 'justify-center'} 
                hover:bg-gray-700 transition-all duration-200 ease-in-out`}
              onClick={handleLogout}
            >
              <FaSignOutAlt className={`${isOpen ? 'mr-2' : 'mx-auto'} w-5 h-5`} />
              <span className={`transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 hidden md:hidden'}`}>
                Logout
              </span>
            </Button>
          </div>
        </nav>
      </div>

      <div
        className={`flex-1 overflow-auto bg-gray-50 transition-all duration-300 ${
          isOpen && !isMobile ? 'ml-64' : 'ml-16'
        }`}
      >
        <main className="p-4">
          {children}
        </main>
      </div>

      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
}