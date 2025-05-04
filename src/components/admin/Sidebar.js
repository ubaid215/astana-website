"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { FaTachometerAlt, FaUsers, FaTable, FaFileExport, FaCog, FaDollarSign } from 'react-icons/fa';

export default function Sidebar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: FaTachometerAlt },
    { name: 'Users', href: '/admin/users', icon: FaUsers },
    { name: 'Slots', href: '/admin/slots', icon: FaTable },
    { name: 'Reports', href: '/admin/reports', icon: FaFileExport },
    { name: 'Prices', href: '/admin/prices', icon: FaDollarSign },
    { name: 'Settings', href: '/admin/settings', icon: FaCog },
  ];

  return (
    <>
      <button
        className="md:hidden p-4 bg-primary text-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
      </button>
      <div
        className={`fixed top-0 left-0 h-full bg-primary text-white w-64 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-300 z-40`}
      >
        <div className="p-4 text-xl font-bold border-b border-gray-700">
          Admin Panel
        </div>
        <nav className="mt-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.name}>
                <Link href={item.href}>
                  <Button
                    variant="ghost"
                    className={`w-full flex items-center space-x-2 text-left ${
                      router.pathname === item.href ? 'bg-secondary' : 'hover:bg-gray-700'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Button>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}