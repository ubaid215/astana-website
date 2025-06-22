"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaSearch, FaFilter, FaShoppingCart, FaSyncAlt } from 'react-icons/fa';
import { useCart } from '@/context/cartContext';

// export const metadata = {
//   title: 'Khanqah Saifia Digital Store - Audio Lectures',
//   description: 'Gain spiritual insights through categorized bayanat and lecture series, instantly downloadable.',
//   keywords: 'Islamic audio, bayanaat, lectures, MP3',
// };

export default function AudioLecturesPage() {
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

  // Audio Lectures products
  const products = [
    { id: 2, title: 'Tasawwuf Series Vol. 1 – Audio', price: 650, fileType: 'MP3', language: 'Urdu', image: 'https://images.unsplash.com/photo-1566346289693-a555ded1b37d?q=80&w=2100&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
    { id: 5, title: 'Seerah of Prophet – Audio', price: 600, fileType: 'MP3', language: 'English', image: 'https://i.pinimg.com/736x/1a/7f/f5/1a7ff5576f5b4a21a953eb0ea1b8521f.jpg' },
    { id: 8, title: 'Spiritual Growth Series – Audio', price: 800, fileType: 'MP3', language: 'Urdu', image: 'https://i.pinimg.com/736x/0a/39/1d/0a391d130b1cc79a24e262b753ca75a0.jpg' },
    { id: 11, title: 'Ramadan Reflections – Audio', price: 500, fileType: 'MP3', language: 'English', image: 'https://i.pinimg.com/736x/0a/39/1d/0a391d130b1cc79a24e262b753ca75a0.jpg' },
    { id: 14, title: 'Quranic Reflections – Audio', price: 700, fileType: 'MP3', language: 'Urdu', image: 'https://i.pinimg.com/736x/0a/39/1d/0a391d130b1cc79a24e262b753ca75a0.jpg' },
    { id: 18, title: 'Hajj Guide – Audio', price: 550, fileType: 'MP3', language: 'Urdu', image: 'https://i.pinimg.com/736x/35/5c/86/355c862128c1589e6f145d5afb93e1dd.jpg' },
    { id: 21, title: 'Tazkiyah Series – Audio', price: 750, fileType: 'MP3', language: 'English', image: 'https://i.pinimg.com/736x/1a/bb/f6/1abbf695d69fba5abb15144bb32a56a8.jpg' },
    { id: 24, title: 'Friday Sermons – Audio', price: 600, fileType: 'MP3', language: 'Urdu', image: 'https://i.pinimg.com/736x/b9/8d/37/b98d375387c8f1682e155acc00a1af8e.jpg' },
    { id: 28, title: 'Ethics in Islam – Audio', price: 650, fileType: 'MP3', language: 'English', image: 'https://i.pinimg.com/736x/a6/8c/f4/a68cf443f2e767949fa325e29aca2b7f.jpg' },
    { id: 32, title: 'Prophetic Stories – Audio', price: 500, fileType: 'MP3', language: 'Urdu', image: 'https://i.pinimg.com/736x/1a/7f/f5/1a7ff5576f5b4a21a953eb0ea1b8521f.jpg' },
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
            <Link href="/" className="hover:underline">Home</Link>  <Link href="/shop" className="hover:underline">Shop</Link>  Audio Lectures
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-green-700 mb-2">🎧 Audio Lectures</h1>
          <p className="text-gray-600">Gain spiritual insights through categorized bayanat and lecture series, instantly downloadable.</p>
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
                    placeholder="Search lectures"
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
                <p className="text-gray-600">🙁 No lectures found for your selection.</p>
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
                  ⬇️ Load More Lectures
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
        <p>🔐 Secure UBL Payment | 📥 Instant Download After Checkout</p>
      </div>
    </div>
  );
}