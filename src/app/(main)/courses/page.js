"use client";

import Link from 'next/link';
import { FaShoppingCart } from 'react-icons/fa';
import { useCart } from '@/context/cartContext';

// export const metadata = {
//   title: 'Khanqah Saifia Digital Store - Courses',
//   description: 'Coming soon: Online courses on Islamic studies and spiritual growth.',
//   keywords: 'Islamic courses, online learning, coming soon',
// };

export default function CoursesPage() {
  const { getCartCount } = useCart();

  return (
    <div className="bg-cream-50 font-['Cairo'] text-gray-800 min-h-screen">
      {/* Page Header */}
      <header className="py-8 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="text-sm text-gray-600 mb-4">
            <Link href="/" className="hover:underline">Home</Link>  <Link href="/shop" className="hover:underline">Shop</Link>  Courses
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-green-700 mb-2">📖 Courses</h1>
          <p className="text-gray-600">Online courses on Islamic studies and spiritual growth.</p>
        </div>
      </header>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-semibold text-green-700 mb-4">🚀 Coming Soon!</h2>
          <p className="text-gray-600 mb-6">
            Our Islamic online courses are under development. Stay tuned for structured learning experiences on Tafseer,
            Hadith, Tasawwuf, and more!
          </p>
          <Link
            href="/shop"
            className="inline-block px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"
          >
            Explore Other Categories
          </Link>
        </div>
      </section>

      {/* Mini Cart Icon */}
      <div className="fixed top-20 right-4 z-50">
        <Link href="/cart">
          <button className="bg-green-600 text-white p-3 rounded-full shadow-lg flex items-center gap-2">
            <FaShoppingCart className="text-lg" />
            <span className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
              {getCartCount()}
            </span>
          </button>
        </Link>
      </div>

      {/* Trust Indicators */}
      <div className="bg-white py-4 text-center text-gray-600 text-sm">
        <p>🔐 Secure UBL Payment | 📥 Instant Download After Checkout</p>
      </div>
    </div>
  );
}