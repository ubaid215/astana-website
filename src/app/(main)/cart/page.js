"use client";

import Link from 'next/link';
import Image from 'next/image';
import { FaShoppingCart, FaTrash, FaMinus, FaPlus } from 'react-icons/fa';
import { useCart } from '@/context/cartContext';

// export const metadata = {
//   title: 'Khanqah Saifia Digital Store - Cart',
//   description: 'Review and manage your cart items before proceeding to checkout.',
//   keywords: 'cart, checkout, Islamic products',
// };

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, getCartCount } = useCart();

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="bg-cream-50 font-['Cairo'] text-gray-800 min-h-screen">
      {/* Page Header */}
      <header className="py-8 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="text-sm text-gray-600 mb-4">
            <Link href="/" className="hover:underline">Home</Link> &gt; <Link href="/shop" className="hover:underline">Shop</Link> &gt; Cart
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-green-700 mb-2">🛒 Your Cart</h1>
          <p className="text-gray-600">Review your selected Islamic products before checkout.</p>
        </div>
      </header>

      {/* Cart Content */}
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {cart.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">🙁 Your cart is empty.</p>
              <Link href="/shop" className="mt-4 inline-block px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700">
                Explore Products
              </Link>
            </div>
          ) : (
            <div>
              <div className="bg-white rounded-2xl shadow-md p-6">
                <div className="hidden md:grid grid-cols-6 gap-4 font-semibold text-green-700 mb-4">
                  <div>Product</div>
                  <div className="col-span-2">Title</div>
                  <div>Price</div>
                  <div>Quantity</div>
                  <div>Total</div>
                </div>
                {cart.map((item) => (
                  <div key={item.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center py-4 border-b">
                    <div>
                      <Image
                        src={item.image}
                        alt={item.title}
                        width={80}
                        height={80}
                        className="w-20 h-20 object-cover rounded-lg"
                        loading="lazy"
                      />
                    </div>
                    <div className="col-span-2">
                      <h3 className="text-lg font-semibold text-green-700 truncate">{item.title}</h3>
                      <p className="text-gray-500 text-sm">{item.fileType}</p>
                    </div>
                    <div>Rs. {item.price}</div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 bg-gray-200 rounded-full hover:bg-gray-300"
                      >
                        <FaMinus className="text-gray-600" />
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 bg-gray-200 rounded-full hover:bg-gray-300"
                      >
                        <FaPlus className="text-gray-600" />
                      </button>
                    </div>
                    <div className="flex items-center gap-4">
                      <span>Rs. {item.price * item.quantity}</span>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-between items-center">
                <Link href="/shop" className="text-green-600 hover:underline">
                  Continue Shopping
                </Link>
                <div className="text-right">
                  <p className="text-lg font-semibold text-green-700">Subtotal: Rs. {total}</p>
                  <Link
                    href="/checkout"
                    className={`mt-4 inline-block px-6 py-2 rounded-xl text-white font-semibold transition-all duration-300 transform hover:scale-105 ${
                      cart.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    Proceed to Checkout
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Mini Cart Icon */}
      <div className="fixed top-20 right-4 z-50">
        <Link href="/cart">
          <button className="bg-green-600 text-white p-3 rounded-full shadow-lg flex items-center gap-2">
            <FaShoppingCart className="text-lg" />
            <span className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">{getCartCount()}</span>
          </button>
        </Link>
      </div>

      {/* Trust Indicators */}
      <div className="bg-white py-4 text-center text-gray-600 text-sm">
        <p>🔐 Secure Meezan Payment | 📥 Instant Download After Checkout</p>
      </div>
    </div>
  );
}