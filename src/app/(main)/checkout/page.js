"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaLock, FaCreditCard, FaShoppingCart, FaCheckCircle } from 'react-icons/fa';
import { useCart } from '@/context/cartContext';

// export const metadata = {
//   title: 'Khanqah Saifia Digital Store - Checkout',
//   description: 'Securely complete your purchase of digital Islamic products with instant download access.',
//   keywords: 'checkout, Islamic digital products, secure payment, UBL gateway',
// };

export default function CheckoutPage() {
  const { cart, getCartCount } = useCart();
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    whatsapp: '',
    country: 'Pakistan',
    city: '',
    note: '',
  });
  const [errors, setErrors] = useState({});
  const [termsAgreed, setTermsAgreed] = useState(false);

  // Calculate total
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error on input change
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email Address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }
    if (!termsAgreed) newErrors.terms = 'You must agree to the terms';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Simulate UBL Gateway redirect (replace with actual API integration)
    console.log('Processing payment:', { formData, cart, total });
    router.push('/order-confirmation');
  };

  return (
    <div className="bg-cream-50 font-['Cairo'] text-gray-800 min-h-screen">
      {/* Page Header */}
      <header className="py-8 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="text-sm text-gray-600 mb-4">
            <Link href="/" className="hover:underline">Home</Link> <Link href="/cart" className="hover:underline">Cart</Link>  Checkout
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-green-700 mb-2">🛒 Checkout</h1>
          <p className="text-gray-600">Your order is secure and encrypted. Payments are processed via UBL.</p>
          <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
            <span className="flex items-center gap-2"><FaCheckCircle className="text-green-600" /> UBL Verified</span>
            <span className="flex items-center gap-2"><FaCheckCircle className="text-green-600" /> 100% Digital Products</span>
            <span className="flex items-center gap-2"><FaLock className="text-green-600" /> Secure SSL Encryption</span>
            <span className="flex items-center gap-2"><FaCheckCircle className="text-green-600" /> Instant Access After Payment</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-6">
          {/* Billing Details */}
          <div className="w-full lg:w-2/3 bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gold-700 mb-4">🧾 Billing Details</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Full Name *"
                  className={`w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-green-600 ${errors.fullName ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
              </div>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Email Address *"
                  className={`w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-green-600 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
              <div className="relative">
                <input
                  type="tel"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleInputChange}
                  placeholder="WhatsApp Number (Optional)"
                  className="w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-green-600 border-gray-300"
                />
              </div>
              <div>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-green-600 border-gray-300"
                >
                  <option value="Pakistan">Pakistan</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="relative">
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="City"
                  className="w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-green-600 border-gray-300"
                />
              </div>
              <div className="md:col-span-2">
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleInputChange}
                  placeholder="Short Note (Optional)"
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 border-gray-300 h-24"
                />
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="w-full lg:w-1/3 bg-white rounded-2xl shadow-md p-6 sticky top-4">
            <h2 className="text-2xl font-semibold text-gold-700 mb-4">📦 Order Summary</h2>
            {cart.length === 0 ? (
              <p className="text-gray-600">Your cart is empty. <Link href="/shop" className="text-green-600 hover:underline">Go to Shop</Link></p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-green-100">
                        <th className="p-2 font-semibold text-green-700">Product</th>
                        <th className="p-2 font-semibold text-green-700">Type</th>
                        <th className="p-2 font-semibold text-green-700">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item) => (
                        <tr key={item.id} className="border-b">
                          <td className="p-2">{item.title}</td>
                          <td className="p-2">{item.fileType}</td>
                          <td className="p-2">Rs. {item.price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4">
                  <p className="flex justify-between font-semibold text-gray-600">
                    <span>🧾 Subtotal:</span> <span>Rs. {total}</span>
                  </p>
                  <p className="flex justify-between font-bold text-green-700 mt-2">
                    <span>💵 Total (Incl. Taxes):</span> <span>Rs. {total}</span>
                  </p>
                  <Link
                    href="/cart"
                    className="flex items-center justify-center gap-2 mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300"
                  >
                    <FaShoppingCart /> 🔁 Edit Cart
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Payment Method */}
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gold-700 mb-4">💳 Pay Securely via Debit/Credit Card</h2>
            <p className="text-gray-600 mb-2">UBL Secure Payment Gateway (3D Secure enabled)</p>
            <div className="flex gap-2 mb-4">
              <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-6" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/f/fd/UnionPay_logo.svg" alt="UnionPay" className="h-6" />
            </div>
            <p className="text-gray-600 text-sm">You will be redirected to UBL to complete your secure payment.</p>
          </div>
        </div>
      </section>

      {/* Terms & Pay Button */}
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <label className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={termsAgreed}
                onChange={(e) => setTermsAgreed(e.target.checked)}
                className="form-checkbox text-green-600"
              />
              <span className="text-gray-600">
                I confirm that I’m purchasing digital content and agree to the{' '}
                <Link href="/terms" className="text-green-600 hover:underline">Refund Policy</Link> &{' '}
                <Link href="/terms" className="text-green-600 hover:underline">Terms of Use</Link>.
              </span>
            </label>
            {errors.terms && <p className="text-red-500 text-sm mb-4">{errors.terms}</p>}
            <button
              onClick={handleSubmit}
              disabled={!termsAgreed || cart.length === 0}
              className={`w-full py-3 rounded-full flex items-center justify-center gap-2 ${
                termsAgreed && cart.length > 0
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
            >
              <FaLock /> 🔐 Pay Rs. {total} Securely
            </button>
            <p className="text-gray-600 text-sm mt-2 text-center">Don’t close this tab during payment processing.</p>
          </div>
        </div>
      </section>

      {/* Mini Cart Icon */}
      <div className="fixed top-20 right-4 z-50">
        <Link href="/cart">
          <button className="bg-green-600 text-white p-3 rounded-full shadow-lg flex items-center gap-2">
            <FaShoppingCart className="text-lg" />
            <span className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
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