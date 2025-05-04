"use client";

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function Header() {
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-primary text-white p-4 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          Eid ul Adha
        </Link>
        <button
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
        <nav className={`md:flex md:items-center ${isMenuOpen ? 'block' : 'hidden'} absolute md:static top-16 left-0 right-0 bg-primary md:bg-transparent p-4 md:p-0`}>
          <ul className="flex flex-col md:flex-row md:space-x-4 space-y-2 md:space-y-0">
            <li>
              <Link href="/" className="hover:underline">Home</Link>
            </li>
            <li>
              <Link href="/about" className="hover:underline">About</Link>
            </li>
            <li>
              <Link href="/participation" className="hover:underline">Participate</Link>
            </li>
            {!session ? (
              <>
                <li>
                  <Link href="/login" className="hover:underline">Login</Link>
                </li>
                <li>
                  <Link href="/register" className="hover:underline">Register</Link>
                </li>
              </>
            ) : (
              <>
                {session.user.isAdmin && (
                  <li>
                    <Link href="/admin" className="hover:underline">Admin Dashboard</Link>
                  </li>
                )}
                <li>
                  <Button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="bg-secondary text-white px-4 py-2 rounded-md"
                  >
                    Logout
                  </Button>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}