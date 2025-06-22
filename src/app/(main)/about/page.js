"use client";

import Link from 'next/link';
import { FaShoppingCart, FaMosque, FaMapMarkerAlt, FaEnvelope, FaWhatsapp } from 'react-icons/fa';
import { useCart } from '@/context/cartContext';

// export const metadata = {
//   title: 'Khanqah Saifia Digital Store - About',
//   description: 'Learn about Khanqah Saifia, our mission, values, spiritual lineage, and privacy policy.',
//   keywords: 'about, Khanqah Saifia, Islamic digital content, mission, privacy policy',
// };

export default function AboutPage() {
  const { getCartCount } = useCart();

  return (
    <div className="bg-cream-50 font-['Cairo'] text-gray-800 min-h-screen">
      {/* Page Header */}
      <header className="py-8 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="text-sm text-gray-600 mb-4">
            <Link href="/" className="hover:underline">Home</Link>  About
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-green-700 mb-2">About Us</h1>
          <p className="text-gray-600">Discover our mission, values, and commitment to spreading Islamic knowledge.</p>
        </div>
      </header>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Who We Are */}
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gold-700 mb-4 flex items-center justify-center gap-2">
              <FaMosque /> 🕌 Who We Are
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto">
              Khanqah Saifia is a digital initiative dedicated to preserving and spreading the timeless teachings of Islam
              through authentic, high-quality digital content. Rooted in traditional scholarship and spiritual lineage, we
              aim to make Islamic knowledge accessible to every home, in every corner of the world.
            </p>
            <p className="text-gray-600 max-w-3xl mx-auto mt-4">
              We offer a curated collection of PDF books, audio bayanaat, digital Islamic art, and structured learning
              resources — all focused on personal purification, Tasawwuf, Quranic wisdom, and the Prophetic way of life.
            </p>
          </div>

          {/* Our Mission */}
          <div className="text-center bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gold-700 mb-4">🧭 Our Mission</h2>
            <p className="text-gray-600 text-lg italic max-w-2xl mx-auto">
              “To digitally empower Muslims by connecting them with spiritually enriching, scholar-approved Islamic content
              — in their language, on their devices.”
            </p>
          </div>

          {/* Core Values */}
          <div>
            <h2 className="text-2xl font-semibold text-gold-700 mb-4 text-center">🌱 Our Core Values</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-green-100">
                    <th className="p-4 font-semibold text-green-700">Value</th>
                    <th className="p-4 font-semibold text-green-700">What It Means</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white border-b">
                    <td className="p-4 font-medium">Authenticity</td>
                    <td className="p-4 text-gray-600">
                      Every product is verified by scholars and rooted in the Quran and Sunnah.
                    </td>
                  </tr>
                  <tr className="bg-white border-b">
                    <td className="p-4 font-medium">Accessibility</td>
                    <td className="p-4 text-gray-600">
                      We deliver digital content that can be downloaded instantly from anywhere.
                    </td>
                  </tr>
                  <tr className="bg-white border-b">
                    <td className="p-4 font-medium">Spirituality</td>
                    <td className="p-4 text-gray-600">
                      Our content inspires transformation — not just information.
                    </td>
                  </tr>
                  <tr className="bg-white">
                    <td className="p-4 font-medium">Simplicity</td>
                    <td className="p-4 text-gray-600">
                      Clear UI, straightforward pricing, and instant downloads.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Spiritual Lineage */}
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gold-700 mb-4">🧔 Our Spiritual Lineage</h2>
            <p className="text-gray-600 max-w-3xl mx-auto">
              Khanqah Saifia was inspired by the teachings and legacy of Hazrat Sheikh Saif ur Rehman (رحمه الله) — a
              well-known figure in traditional Tasawwuf circles of Pakistan. Today, we continue this mission online to
              serve the seekers of knowledge with sincerity, transparency, and barakah.
            </p>
          </div>

          {/* What We Offer */}
          <div>
            <h2 className="text-2xl font-semibold text-gold-700 mb-4 text-center">🖥️ What We Offer</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-green-100">
                    <th className="p-4 font-semibold text-green-700">Category</th>
                    <th className="p-4 font-semibold text-green-700">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white border-b">
                    <td className="p-4 font-medium">Digital Books (PDFs)</td>
                    <td className="p-4 text-gray-600">
                      Classical and contemporary works on Quran, Hadith, Fiqh, Seerah, and self-purification
                    </td>
                  </tr>
                  <tr className="bg-white border-b">
                    <td className="p-4 font-medium">Audio Bayanaat (MP3)</td>
                    <td className="p-4 text-gray-600">Powerful Islamic lectures by scholars and khulafa</td>
                  </tr>
                  <tr className="bg-white border-b">
                    <td className="p-4 font-medium">Islamic Art (PNG, JPEG)</td>
                    <td className="p-4 text-gray-600">
                      High-quality calligraphy and motivational Islamic designs
                    </td>
                  </tr>
                  <tr className="bg-white">
                    <td className="p-4 font-medium">Structured Collections</td>
                    <td className="p-4 text-gray-600">Thematic bundles for easy spiritual progress</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Why Trust Khanqah Saifia */}
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gold-700 mb-4">🤝 Why Trust Khanqah Saifia?</h2>
            <ul className="text-gray-600 max-w-2xl mx-auto space-y-2">
              <li className="flex items-center gap-2">✅ 100% Digital – No physical shipping</li>
              <li className="flex items-center gap-2">✅ Secure Payments via UBL eCommerce Gateway</li>
              <li className="flex items-center gap-2">✅ Instant access to content after purchase</li>
              <li className="flex items-center gap-2">✅ Transparent policies and customer support</li>
              <li className="flex items-center gap-2">✅ Actively maintained & continuously growing platform</li>
            </ul>
          </div>

          {/* Location & Contact */}
          <div className="text-center bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gold-700 mb-4">📍 Location & Contact</h2>
            <p className="text-gray-600 mb-4">
              We are based in Faisalabad, Pakistan, and proudly serve a growing global community of students, scholars,
              and seekers.
            </p>
            <div className="flex flex-col items-center gap-4">
              <a
                href="mailto:info@khanqahsaifia.com"
                className="flex items-center gap-2 text-green-600 hover:underline"
              >
                <FaEnvelope /> Email: info@khanqahsaifia.com
              </a>
              <a
                href="https://wa.me/+923xxxxxxxxx"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-green-600 hover:underline"
              >
                <FaWhatsapp /> WhatsApp: +92-3xx-xxxxxxx
              </a>
              {/* <p className="flex items-center gap-2 text-gray-600">
                <FaMapMarkerAlt /> Address: [Add your official location if required by the bank]
              </p> */}
            </div>
          </div>

          {/* Privacy Policy */}
          <div>
            <h2 className="text-2xl font-semibold text-gold-700 mb-4 text-center">🔐 Privacy Policy</h2>
            <div className="bg-white rounded-2xl shadow-md p-6 space-y-4">
              <h3 className="text-lg font-semibold text-green-700">Introduction</h3>
              <p className="text-gray-600">
                Your privacy is important to us. This Privacy Policy outlines how KhanqahSaifia.com collects, uses, and
                protects your information when you use our website.
              </p>

              <h3 className="text-lg font-semibold text-green-700">1. What Information We Collect</h3>
              <p className="text-gray-600">We may collect the following:</p>
              <ul className="text-gray-600 list-disc pl-6 space-y-1">
                <li>Your name and email (when subscribing or purchasing)</li>
                <li>Billing address (if applicable)</li>
                <li>Transaction details (via secure payment processor)</li>
                <li>Contact messages or queries sent to us</li>
                <li className="font-medium">✅ We do NOT store credit/debit card numbers.</li>
              </ul>

              <h3 className="text-lg font-semibold text-green-700">2. How We Use Your Data</h3>
              <p className="text-gray-600">We use your information to:</p>
              <ul className="text-gray-600 list-disc pl-6 space-y-1">
                <li>Process payments securely via UBL Payment Gateway</li>
                <li>Deliver download links and order confirmations</li>
                <li>Send you product updates or newsletters (if opted in)</li>
                <li>Respond to customer support messages</li>
                <li>
                  We do not sell, rent, or share your data with any third parties outside of secure processing and legal
                  requirements.
                </li>
              </ul>

              <h3 className="text-lg font-semibold text-green-700">3. Payment Security</h3>
              <p className="text-gray-600">
                All transactions are processed via UBL’s PCI-compliant payment system. Your payment details are encrypted
                and handled with the highest security standards.
              </p>
              <p className="text-gray-600 font-medium">We never see or store your card data on our servers.</p>

              <h3 className="text-lg font-semibold text-green-700">4. Cookies & Analytics</h3>
              <p className="text-gray-600">We may use:</p>
              <ul className="text-gray-600 list-disc pl-6 space-y-1">
                <li>Cookies to improve website experience</li>
                <li>Anonymous analytics (like Google Analytics) to improve our services</li>
                <li>You can disable cookies in your browser anytime.</li>
              </ul>

              <h3 className="text-lg font-semibold text-green-700">5. Your Rights</h3>
              <p className="text-gray-600">You have the right to:</p>
              <ul className="text-gray-600 list-disc pl-6 space-y-1">
                <li>Access, update, or delete your personal information</li>
                <li>Unsubscribe from our newsletter at any time</li>
                <li>Request a copy of your stored data by contacting: <a href="mailto:info@khanqahsaifia.com" className="text-green-600 hover:underline">info@khanqahsaifia.com</a></li>
              </ul>

              <h3 className="text-lg font-semibold text-green-700">6. Updates to This Policy</h3>
              <p className="text-gray-600">
                We may update this Privacy Policy from time to time. Please check this page periodically.
              </p>
              <p className="text-gray-600 font-medium">Last updated: June 2025</p>
            </div>
          </div>

          {/* Need Help */}
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gold-700 mb-4">🛡️ Need Help?</h2>
            <p className="text-gray-600 mb-4">
              Contact our support team for any privacy or policy questions:
            </p>
            <a
              href="mailto:info@khanqahsaifia.com"
              className="flex items-center justify-center gap-2 text-green-600 hover:underline"
            >
              <FaEnvelope /> Email: info@khanqahsaifia.com
            </a>
          </div>
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