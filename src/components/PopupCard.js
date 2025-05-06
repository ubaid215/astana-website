'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { FaTimes } from 'react-icons/fa';

export default function PopupCard() {
  const [isVisible, setIsVisible] = useState(false);

  // Show popup on every page load/refresh
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Handle closing the popup
  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Transparent Backdrop */}
      <div className="fixed inset-0 backdrop-blur-sm bg-white/30 z-50" onClick={handleClose} />

      {/* Popup Card */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-xl shadow-xl p-6 mx-4 animate-popup">
        {/* Close Button with Cross Icon */}
        <button
          className="absolute top-4 right-4 cursor-pointer text-gray-600 hover:text-gray-800 transition-colors"
          onClick={handleClose}
          aria-label="Close popup"
        >
          <FaTimes className="w-6 h-6" />
        </button>

        {/* Content */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-primary">Join Eid ul Adha Sacrifice Now!</h2>
          <p className="text-gray-600">
            Don’t miss out! Animal prices for Qurbani change daily. Participate now to secure your sacrifice and fulfill this sacred duty with ease and transparency.
          </p>
          <Button asChild className="bg-primary cursor-pointer hover:bg-primary/90 text-white">
            <Link href="/participation">Participate Now</Link>
          </Button>
        </div>
      </div>

      {/* Animation Styles */}
      <style jsx>{`
        .animate-popup {
          animation: popup 0.5s ease-out;
        }
        @keyframes popup {
          from {
            opacity: 0;
            transform: translate(-50%, -40%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
      `}</style>
    </>
  );
}