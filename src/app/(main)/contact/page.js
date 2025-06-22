"use client";

import { useState } from 'react';
import Link from 'next/link';
import { FaShoppingCart, FaMosque, FaEnvelope, FaWhatsapp, FaGlobe, FaMapMarkerAlt, FaFacebook, FaInstagram, FaYoutube } from 'react-icons/fa';
import { useCart } from '@/context/cartContext';

// export const metadata = {
//   title: 'Khanqah Saifia Digital Store - Contact',
//   description: 'Contact Khanqah Saifia for support, inquiries, or collaborations. Reach us via email, WhatsApp, or our contact form.',
//   keywords: 'contact, Khanqah Saifia, support, Islamic digital products',
// };

export default function ContactPage() {
  const { getCartCount } = useCart();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    whatsapp: '',
    subject: 'General',
    message: '',
  });
  const [formStatus, setFormStatus] = useState({ type: '', message: '' });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.message) {
      setFormStatus({ type: 'error', message: '❌ Please complete required fields before submitting.' });
      return;
    }
    if (formData.message.length > 1000) {
      setFormStatus({ type: 'error', message: '❌ Message must be 1000 characters or less.' });
      return;
    }
    // Simulate form submission (replace with backend API call)
    console.log('Form submitted:', formData);
    setFormStatus({ type: 'success', message: '✅ Your message has been sent. We’ll respond shortly, inshaAllah.' });
    setFormData({ fullName: '', email: '', whatsapp: '', subject: 'General', message: '' });
  };

  return (
    <div className="bg-cream-50 font-['Cairo'] text-gray-800 min-h-screen">
      {/* Page Header */}
      <header className="py-8 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="text-sm text-gray-600 mb-4">
            <Link href="/" className="hover:underline">Home</Link>  Contact
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-green-700 mb-2">Contact Us</h1>
          <p className="text-gray-600">We’re here to assist with any questions or support needs.</p>
        </div>
      </header>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* We’re Here to Help */}
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gold-700 mb-4 flex items-center justify-center gap-2">
              <FaMosque /> 🕌 We’re Here to Help
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto">
              Whether you have a question about a digital product, need support after purchase, or simply want to connect —
              we’re here for you.
            </p>
            <p className="text-gray-600 max-w-3xl mx-auto mt-4">
              Please feel free to reach out using the methods below, and we’ll respond as soon as possible, typically
              within 24 hours (Mon–Sat).
            </p>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gold-700 mb-4">📩 Contact Form</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-3 text-gray-500" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Full Name *"
                  className="w-full pl-10 p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-green-600"
                  required
                />
              </div>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-3 text-gray-500" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Email Address *"
                  className="w-full pl-10 p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-green-600"
                  required
                />
              </div>
              <div className="relative">
                <FaWhatsapp className="absolute left-3 top-3 text-gray-500" />
                <input
                  type="tel"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleInputChange}
                  placeholder="WhatsApp Number (Optional)"
                  className="w-full pl-10 p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>
              <div>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-green-600"
                >
                  <option value="General">General</option>
                  <option value="Product Issue">Product Issue</option>
                  <option value="Feedback">Feedback</option>
                  <option value="Business Inquiry">Business Inquiry</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Your Message * (1000 characters max)"
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 h-32"
                  maxLength={1000}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="w-full py-2 bg-green-600 text-white rounded-full hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <FaEnvelope /> 📨 Submit Message
                </button>
              </div>
            </form>
            {formStatus.message && (
              <p
                className={`mt-4 text-center ${
                  formStatus.type === 'success' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formStatus.message}
              </p>
            )}
            <p className="text-gray-600 text-sm mt-4 text-center">
              We typically reply within 24 hours. For urgent issues, please contact via WhatsApp.
            </p>
          </div>

          {/* Contact Information */}
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gold-700 mb-4">📍 Our Contact Information</h2>
            <p className="text-gray-600 mb-4">You can also reach us directly via:</p>
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
              <a
                href="https://www.khanqahsaifia.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-green-600 hover:underline"
              >
                <FaGlobe /> Website: www.khanqahsaifia.com
              </a>
              <p className="flex items-center gap-2 text-gray-600">
                <FaMapMarkerAlt /> Location: Faisalabad, Punjab, Pakistan
              </p>
            </div>
            <p className="text-gray-600 text-sm mt-4">
              Note: We are a digital platform. All products are delivered online. No physical shop is open at this time.
            </p>
          </div>

          {/* Office Hours */}
          <div>
            <h2 className="text-2xl font-semibold text-gold-700 mb-4 text-center">🕰️ Office Hours</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-green-100">
                    <th className="p-4 font-semibold text-green-700">Day</th>
                    <th className="p-4 font-semibold text-green-700">Time</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white border-b">
                    <td className="p-4 font-medium">Monday–Saturday</td>
                    <td className="p-4 text-gray-600">10:00 AM – 6:00 PM (PKT)</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="p-4 font-medium">Sunday</td>
                    <td className="p-4 text-gray-600">Closed</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-gray-600 text-sm mt-4 text-center">
              ⏱️ Orders & downloads work 24/7. You can purchase anytime!
            </p>
          </div>

          {/* Business or Collaboration Inquiry */}
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gold-700 mb-4">🤝 Business or Collaboration Inquiry?</h2>
            <p className="text-gray-600 max-w-3xl mx-auto">
              If you are an organization, scholar, designer, or publisher who would like to collaborate, license content,
              or join our platform, please reach out with the subject line:
            </p>
            <p className="text-gray-600 font-medium mt-2">
              “Partnership Inquiry – [Your Name/Org]”
            </p>
            <p className="text-gray-600 mt-2">
              We welcome collaborations that align with our mission to spread authentic Islamic knowledge.
            </p>
          </div>

          {/* Support for Paid Products */}
          <div className="bg-white rounded-2xl shadow-md p-6 text-center">
            <h2 className="text-2xl font-semibold text-gold-700 mb-4">🔐 Support for Paid Products</h2>
            <p className="text-gray-600 mb-4">
              If you’ve purchased a product and:
            </p>
            <ul className="text-gray-600 list-disc pl-6 mx-auto max-w-2xl text-left space-y-1">
              <li>Did not receive a download link</li>
              <li>Found an issue with the file format</li>
              <li>Want to ask about license or usage</li>
            </ul>
            <p className="text-gray-600 mt-4">
              Please email us at{' '}
              <a href="mailto:support@khanqahsaifia.com" className="text-green-600 hover:underline">
                support@khanqahsaifia.com
              </a>{' '}
              or use the contact form above with your order ID. We’ll make it right, inshaAllah.
            </p>
          </div>

          {/* Follow Us */}
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gold-700 mb-4">📡 Follow Us</h2>
            <p className="text-gray-600 mb-4">
              Stay updated with new releases and spiritual resources:
            </p>
            <div className="flex flex-col items-center gap-4">
              <a
                href="https://facebook.com/khanqahsaifia"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-green-600 hover:underline"
              >
                <FaFacebook /> Facebook: facebook.com/khanqahsaifia
              </a>
              <a
                href="https://instagram.com/khanqahsaifia"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-green-600 hover:underline"
              >
                <FaInstagram /> Instagram: instagram.com/khanqahsaifia
              </a>
              <a
                href="https://youtube.com/@khanqahsaifia"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-green-600 hover:underline"
              >
                <FaYoutube /> YouTube: youtube.com/@khanqahsaifia
              </a>
              <a
                href="https://wa.me/+923xxxxxxxxx?text=Join%20Khanqah%20Saifia%20WhatsApp%20Broadcast"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-green-600 hover:underline"
              >
                <FaWhatsapp /> WhatsApp Updates: Click to Join WhatsApp Broadcast
              </a>
            </div>
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