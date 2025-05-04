"use client";

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { FaSignOutAlt, FaUser } from 'react-icons/fa';

export default function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="bg-primary text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">Eid ul Adha</Link>
        <nav className="flex items-center space-x-4">
          <Link href="/" className="hover:underline">Home</Link>
          <Link href="/about" className="hover:underline">About</Link>
          {status === 'authenticated' ? (
            <>
              <Link href="/profile" className="flex items-center space-x-2 hover:underline">
                <FaUser />
                <span>Profile</span>
              </Link>
              <Link href="/participation" className="hover:underline">Participate</Link>
              {session?.user?.isAdmin && (
                <Link href="/admin" className="hover:underline">Admin</Link>
              )}
              <Button
                variant="ghost"
                className="flex items-center space-x-2 text-white hover:bg-gray-700"
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                <FaSignOutAlt />
                <span>Sign Out</span>
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:underline">Login</Link>
              <Link href="/signup" className="hover:underline">Sign Up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}