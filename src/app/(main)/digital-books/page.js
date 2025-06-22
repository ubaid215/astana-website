"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaSearch, FaFilter, FaShoppingCart, FaSyncAlt } from 'react-icons/fa';
import { useCart } from '@/context/cartContext';

// export const metadata = {
//   title: 'Khanqah Saifia Digital Store - Digital Books',
//   description: 'Explore authentic Islamic books in PDF format on Tafseer, Hadith, Tasawwuf, and Seerah.',
//   keywords: 'Islamic books, digital books, PDF, Islamic education',
// };

export default function DigitalBooksPage() {
  const { addToCart, getCartCount } = useCart();
  const [filters, setFilters] = useState({
    search: '',
    priceRange: [100, 2000],
    languages: [],
    sort: 'newest',
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;

  // Digital Books products
  const products = [
    { id: 1, title: '40 Hadith Nawawi – Urdu PDF', price: 450, fileType: 'PDF', language: 'Urdu', badge: 'Bestseller', image: 'https://i.pinimg.com/736x/c8/d7/83/c8d7831e2a1b5d41dd093425714d91fd.jpg' },
    { id: 4, title: 'Tafseer-e-Mazhari Vol. 1 – PDF', price: 700, fileType: 'PDF', language: 'Urdu', image: 'https://i.pinimg.com/736x/b4/44/4b/b4444b0543022c797cdd5ec25b07a6f4.jpg' },
    { id: 7, title: 'Hadith Collection – Urdu PDF', price: 550, fileType: 'PDF', language: 'Urdu', badge: 'Bestseller', image: 'https://i.pinimg.com/736x/92/bf/eb/92bfeb6c3549bb7bb93316cee3dcb0c8.jpg' },
    { id: 10, title: 'Fiqh Essentials – English PDF', price: 600, fileType: 'PDF', language: 'English', image: 'https://images.unsplash.com/photo-1587617425953-9075d28b8c46' },
    { id: 13, title: 'Tafsir Ibn Kathir – Urdu PDF', price: 900, fileType: 'PDF', language: 'Urdu', image: 'https://i.pinimg.com/736x/58/da/50/58da5022df6d5f0df895d907b50a9fc7.jpg' },
    { id: 17, title: 'Aqeedah Basics – English PDF', price: 400, fileType: 'PDF', language: 'English', image: 'https://images.unsplash.com/photo-1587617425953-9075d28b8c46' },
    { id: 20, title: 'Sahih Bukhari – Urdu PDF', price: 1100, fileType: 'PDF', language: 'Urdu', badge: 'Bestseller', image: 'https://i.pinimg.com/736x/42/f2/4d/42f24d920778fe1cc1b9ee803bbf3a41.jpg' },
    { id: 23, title: 'Islamic History – English PDF', price: 650, fileType: 'PDF', language: 'English', image: 'https://images.pexels.com/photos/8164399/pexels-photo-8164399.jpeg' },
    { id: 27, title: 'Seerah Stories – Urdu PDF', price: 500, fileType: 'PDF', language: 'Urdu', image: 'https://i.pinimg.com/736x/3f/83/95/3f83950e52f7b227bb82ede5ce57a266.jpg' },
    { id: 30, title: 'Tafseer Surah Fatiha – PDF', price: 300, fileType: 'PDF', language: 'Urdu', badge: 'New', image: 'https://i.pinimg.com/736x/73/d1/49/73d14985ba1e0c37203910eb72c5e666.jpg' },
  ];

  // Filter and sort products
  const filteredProducts = products
    .filter((product) =>
      product.title.toLowerCase().includes(filters.search.toLowerCase()) &&
      product.price >= filters.priceRange[0] && product.price <= filters.priceRange[1] &&
      (filters.languages.length === 0 || filters.languages.includes(product.language))
    )
    .sort((a, b) => {
      if (filters.sort === 'price-low-high') return a.price - b.price;
      if (filters.sort === 'price-high-low') return b.price - a.price;
      if (filters.sort === 'most-popular') return (b.badge === 'Bestseller' ? 1 : 0) - (a.badge === 'Bestseller' ? 1 : 0);
      return 0; // Newest (default)
    });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const displayedProducts = filteredProducts.slice(0, currentPage * productsPerPage);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  return (
    <div className="bg-cream-50 font-['Cairo'] text-gray-800 min-h-screen">
      {/* Page Header */}
      <header className="py-8 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="text-sm text-gray-600 mb-4">
            <Link href="/" className="hover:underline">Home</Link>  <Link href="/shop" className="hover:underline">Shop</Link>  Digital Books
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-green-700 mb-2">📚 Digital Books</h1>
          <p className="text-gray-600">Explore authentic Islamic books in PDF format on Tafseer, Hadith, Tasawwuf, and Seerah.</p>
        </div>
      </header>

      {/* Main Content */}
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-6">
          {/* Filter Sidebar */}
          <aside className="w-full md:w-1/4 bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-green-600">Filters</h3>
              <button
                className="md:hidden text-green-600"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                <FaFilter className="text-lg" />
              </button>
            </div>
            <div className={`transition-all duration-300 ${isFilterOpen ? 'block' : 'hidden md:block'}`}>
              {/* Search Bar */}
              <div className="mb-4">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-3 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search books"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full pl-10 p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>
              </div>
              {/* Price Range */}
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Price Range</h4>
                <input
                  type="range"
                  min="100"
                  max="2000"
                  value={filters.priceRange[0]}
                  onChange={(e) => handleFilterChange('priceRange', [parseInt(e.target.value), filters.priceRange[1]])}
                  className="w-full accent-green-600"
                />
                <input
                  type="range"
                  min="100"
                  max="2000"
                  value={filters.priceRange[1]}
                  onChange={(e) => handleFilterChange('priceRange', [filters.priceRange[0], parseInt(e.target.value)])}
                  className="w-full accent-green-600"
                />
                <p className="text-gray-600 text-sm mt-2">Rs. {filters.priceRange[0]} - Rs. {filters.priceRange[1]}</p>
              </div>
              {/* Language Filter */}
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Language</h4>
                {['Urdu', 'English'].map((language) => (
                  <label key={language} className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      value={language}
                      checked={filters.languages.includes(language)}
                      onChange={(e) => {
                        const newLanguages = e.target.checked
                          ? [...filters.languages, language]
                          : filters.languages.filter((lang) => lang !== language);
                        handleFilterChange('languages', newLanguages);
                      }}
                      className="form-checkbox text-green-600"
                    />
                    <span>{language}</span>
                  </label>
                ))}
              </div>
              {/* Sort Dropdown */}
              <div>
                <h4 className="font-semibold mb-2">Sort By</h4>
                <select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-green-600"
                >
                  <option value="newest">Newest</option>
                  <option value="price-low-high">Price Low to High</option>
                  <option value="price-high-low">Price High to Low</option>
                  <option value="most-popular">Most Popular</option>
                </select>
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <main className="w-full md:w-3/4">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">🙁 No books found for your selection.</p>
                <button
                  onClick={() => setFilters({ search: '', priceRange: [100, 2000], languages: [], sort: 'newest' })}
                  className="mt-4 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 flex items-center gap-2 mx-auto"
                >
                  <FaSyncAlt /> Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedProducts.map((product) => (
                  <div key={product.id} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
                    <Image
                      src={product.image}
                      alt={product.title}
                      width={300}
                      height={200}
                      className="w-full h-48 object-cover"
                      loading="lazy"
                    />
                    <div className="p-4">
                      {product.badge && (
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${product.badge === 'Bestseller' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'} mb-2 inline-block`}>
                          {product.badge}
                        </span>
                      )}
                      <h3 className="text-lg font-semibold text-green-700 truncate">{product.title}</h3>
                      <p className="text-gray-600 font-bold">Rs. {product.price}</p>
                      <p className="text-gray-500 text-sm mb-2">{product.fileType}</p>
                      <button
                        onClick={() => addToCart(product)}
                        className="w-full py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 flex items-center justify-center gap-2"
                      >
                        <FaShoppingCart /> Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {filteredProducts.length > displayedProducts.length && (
              <div className="text-center mt-8">
                <button
                  className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                >
                  ⬇️ Load More Books
                </button>
              </div>
            )}
          </main>
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