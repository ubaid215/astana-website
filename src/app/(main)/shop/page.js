"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaSearch, FaFilter, FaStar, FaShoppingCart, FaSyncAlt } from 'react-icons/fa';
import { useCart } from '@/context/cartContext';

// export const metadata = {
//   title: 'Khanqah Saifia Digital Store - Shop',
//   description: 'Explore digital Islamic products including PDFs, audio bayanaat, and calligraphy art.',
//   keywords: 'Islamic digital products, books, audio lectures, Islamic art',
// };

export default function ShopPage() {
  const { addToCart, getCartCount } = useCart();
  const [filters, setFilters] = useState({
    search: '',
    categories: [],
    priceRange: [100, 2000],
    languages: [],
    fileTypes: [],
    sort: 'newest',
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;

  // Sample product data (30 products)
  const products = [
    { id: 1, title: '40 Hadith Nawawi – Urdu PDF', price: 450, category: 'Digital Books', fileType: 'PDF', language: 'Urdu', badge: 'Bestseller', image: 'https://i.pinimg.com/736x/c8/d7/83/c8d7831e2a1b5d41dd093425714d91fd.jpg' },
    { id: 2, title: 'Tasawwuf Series Vol. 1 – Audio', price: 650, category: 'Audio Bayanaat', fileType: 'MP3', language: 'Urdu', image: 'https://images.unsplash.com/photo-1566346289693-a555ded1b37d?q=80&w=2100&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
    { id: 3, title: 'Ayat al-Kursi Calligraphy – PNG', price: 500, category: 'Islamic Art', fileType: 'PNG', language: 'Arabic', badge: 'New', image: 'https://i.pinimg.com/736x/ef/19/ce/ef19ce2be31dfd0c45921cfee71ba549.jpg' },
    { id: 4, title: 'Tafseer-e-Mazhari Vol. 1 – PDF', price: 700, category: 'Digital Books', fileType: 'PDF', language: 'Urdu', image: 'https://i.pinimg.com/736x/b4/44/4b/b4444b0543022c797cdd5ec25b07a6f4.jpg' },
    { id: 5, title: 'Seerah of Prophet – Audio', price: 600, category: 'Audio Bayanaat', fileType: 'MP3', language: 'English', image: 'https://i.pinimg.com/736x/1a/7f/f5/1a7ff5576f5b4a21a953eb0ea1b8521f.jpg' },
    { id: 6, title: 'Dua-e-Qunoot Poster – PNG', price: 400, category: 'Islamic Art', fileType: 'PNG', language: 'Arabic', image: 'https://i.pinimg.com/736x/a4/77/64/a477642aa5f99a4ccf961173886300a1.jpg' },
    { id: 7, title: 'Hadith Collection – Urdu PDF', price: 550, category: 'Digital Books', fileType: 'PDF', language: 'Urdu', badge: 'Bestseller', image: 'https://i.pinimg.com/736x/92/bf/eb/92bfeb6c3549bb7bb93316cee3dcb0c8.jpg' },
    { id: 8, title: 'Spiritual Growth Series – Audio', price: 800, category: 'Audio Bayanaat', fileType: 'MP3', language: 'Urdu', image: 'https://i.pinimg.com/736x/0a/39/1d/0a391d130b1cc79a24e262b753ca75a0.jpg' },
    { id: 9, title: 'Asma-ul-Husna Art – PNG', price: 450, category: 'Islamic Art', fileType: 'PNG', language: 'Arabic', image: 'https://images.unsplash.com/photo-1589571350710-b26d6d105f71' },
    { id: 10, title: 'Fiqh Essentials – English PDF', price: 600, category: 'Digital Books', fileType: 'PDF', language: 'English', image: 'https://images.unsplash.com/photo-1599669454699-248893623440' },
    { id: 11, title: 'Ramadan Reflections – Audio', price: 500, category: 'Audio Bayanaat', fileType: 'MP3', language: 'English', image: 'https://images.unsplash.com/photo-1616436143603-3dd64ab2466f' },
    { id: 12, title: 'Surah Yasin Calligraphy – PNG', price: 350, category: 'Islamic Art', fileType: 'PNG', language: 'Arabic', badge: 'New', image: 'https://images.unsplash.com/photo-1589571350710-b26d6d105f71' },
    { id: 13, title: 'Tafsir Ibn Kathir – Urdu PDF', price: 900, category: 'Digital Books', fileType: 'PDF', language: 'Urdu', image: 'https://images.unsplash.com/photo-1587617425953-9075d28b8c46' },
    { id: 14, title: 'Quranic Reflections – Audio', price: 700, category: 'Audio Bayanaat', fileType: 'MP3', language: 'Urdu', image: 'https://images.unsplash.com/photo-1616436143603-3dd64ab2466f' },
    { id: 15, title: 'Islamic Patterns Bundle – PNG', price: 1200, category: 'Islamic Art', fileType: 'PNG', language: 'Arabic', badge: 'Limited', image: 'https://images.unsplash.com/photo-1589571350710-b26d6d105f71' },
    { id: 16, title: 'Essentials Bundle – PDF+MP3', price: 1500, category: 'Bundles', fileType: 'PDF, MP3', language: 'Urdu', image: 'https://images.unsplash.com/photo-1599669454699-248893623440' },
    { id: 17, title: 'Aqeedah Basics – English PDF', price: 400, category: 'Digital Books', fileType: 'PDF', language: 'English', image: 'https://images.unsplash.com/photo-1587617425953-9075d28b8c46' },
    { id: 18, title: 'Hajj Guide – Audio', price: 550, category: 'Audio Bayanaat', fileType: 'MP3', language: 'Urdu', image: 'https://images.unsplash.com/photo-1616436143603-3dd64ab2466f' },
    { id: 19, title: '99 Names of Allah Poster – PNG', price: 600, category: 'Islamic Art', fileType: 'PNG', language: 'Arabic', image: 'https://images.unsplash.com/photo-1589571350710-b26d6d105f71' },
    { id: 20, title: 'Sahih Bukhari – Urdu PDF', price: 1100, category: 'Digital Books', fileType: 'PDF', language: 'Urdu', badge: 'Bestseller', image: 'https://images.unsplash.com/photo-1599669454699-248893623440' },
    { id: 21, title: 'Tazkiyah Series – Audio', price: 750, category: 'Audio Bayanaat', fileType: 'MP3', language: 'English', image: 'https://images.unsplash.com/photo-1616436143603-3dd64ab2466f' },
    { id: 22, title: 'Surah Rahman Art – PNG', price: 400, category: 'Islamic Art', fileType: 'PNG', language: 'Arabic', image: 'https://images.unsplash.com/photo-1589571350710-b26d6d105f71' },
    { id: 23, title: 'Islamic History – English PDF', price: 650, category: 'Digital Books', fileType: 'PDF', language: 'English', image: 'https://images.unsplash.com/photo-1587617425953-9075d28b8c46' },
    { id: 24, title: 'Friday Sermons – Audio', price: 600, category: 'Audio Bayanaat', fileType: 'MP3', language: 'Urdu', image: 'https://images.unsplash.com/photo-1616436143603-3dd64ab2466f' },
    { id: 25, title: 'Calligraphy Bundle – PNG', price: 1000, category: 'Islamic Art', fileType: 'PNG', language: 'Arabic', badge: 'Limited', image: 'https://images.unsplash.com/photo-1589571350710-b26d6d105f71' },
    { id: 26, title: 'Spiritual Bundle – PDF+MP3', price: 1800, category: 'Bundles', fileType: 'PDF, MP3', language: 'English', image: 'https://images.unsplash.com/photo-1599669454699-248893623440' },
    { id: 27, title: 'Seerah Stories – Urdu PDF', price: 500, category: 'Digital Books', fileType: 'PDF', language: 'Urdu', image: 'https://images.unsplash.com/photo-1587617425953-9075d28b8c46' },
    { id: 28, title: 'Ethics in Islam – Audio', price: 650, category: 'Audio Bayanaat', fileType: 'MP3', language: 'English', image: 'https://images.unsplash.com/photo-1616436143603-3dd64ab2466f' },
    { id: 29, title: 'Islamic Quotes Poster – PNG', price: 350, category: 'Islamic Art', fileType: 'PNG', language: 'Arabic', image: 'https://images.unsplash.com/photo-1589571350710-b26d6d105f71' },
    { id: 30, title: 'Tafseer Surah Fatiha – PDF', price: 300, category: 'Digital Books', fileType: 'PDF', language: 'Urdu', badge: 'New', image: 'https://images.unsplash.com/photo-1599669454699-248893623440' },
  ];

  // Filter and sort products
  const filteredProducts = products
    .filter((product) =>
      product.title.toLowerCase().includes(filters.search.toLowerCase()) &&
      (filters.categories.length === 0 || filters.categories.includes(product.category)) &&
      product.price >= filters.priceRange[0] && product.price <= filters.priceRange[1] &&
      (filters.languages.length === 0 || filters.languages.includes(product.language)) &&
      (filters.fileTypes.length === 0 || filters.fileTypes.includes(product.fileType.split(', ')[0]))
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
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1); // Reset to first page on filter change
  };

  return (
    <div className="bg-cream-50 font-['Cairo'] text-gray-800 min-h-screen">
      {/* Page Header */}
      <header className="py-8 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="text-sm text-gray-600 mb-4">
            <Link href="/" className="hover:underline">Home</Link>  Shop
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-green-700 mb-2">🛒 All Products</h1>
          <p className="text-gray-600">Explore digital Islamic products including PDFs, audio bayanaat, and calligraphy art.</p>
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
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="md:hidden text-green-600 focus:outline-none"
              >
                <FaFilter className="text-lg" />
              </button>
            </div>
            <div className={`transition-all duration-300 ${isFilterOpen ? 'block' : 'hidden md:block'}`}>
              {/* Search Bar */}
              <div className="mb-4">
                <div className="relative flex items-center">
                  <FaSearch className="absolute left-3 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search products"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full pl-10 p-2 border rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>
              </div>

              {/* Category Filters */}
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Categories</h4>
                {['Digital Books', 'Audio Bayanaat', 'Islamic Art', 'Bundles'].map((category) => (
                  <label key={category} className="flex items-center gap-2 mb-1">
                    <input
                      type="checkbox"
                      value={category}
                      checked={filters.categories.includes(category)}
                      onChange={(e) => {
                        const newCategories = e.target.checked
                          ? [...filters.categories, category]
                          : filters.categories.filter((cat) => cat !== category);
                        handleFilterChange('categories', newCategories);
                      }}
                      className="form-checkbox text-green-600"
                    />
                    <span className="ml-2">{category}</span>
                  </label>
                ))}
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
                  className="w-full accent-green-600 mb-2"
                />
                <input
                  type="range"
                  min="100"
                  max="2000"
                  value={filters.priceRange[1]}
                  onChange={(e) => handleFilterChange('priceRange', [filters.priceRange[0], parseInt(e.target.value)])}
                  className="w-full accent-green-600"
                />
                <p className="flex justify-between items-center text-gray-600 text-sm mt-2">
                  <span>Rs. {filters.priceRange[0]} to Rs. {filters.priceRange[1]}</span>
                </p>
              </div>

              {/* Language Filter */}
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Language</h4>
                {['Urdu', 'English', 'Arabic'].map((language) => (
                  <label key={language} className="flex items-center gap-2 mb-1">
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
                    <span className="ml-2">{language}</span>
                  </label>
                ))}
              </div>

              {/* File Type Filter */}
              <div className="mb-4">
                <h4 className="font-semibold mb-2">File Type</h4>
                {['PDF', 'MP3', 'PNG'].map((type) => (
                  <label key={type} className="flex items-center gap-2 mb-1">
                    <input
                      type="checkbox"
                      value={type}
                      checked={filters.fileTypes.includes(type)}
                      onChange={(e) => {
                        const newFileTypes = e.target.checked
                          ? [...filters.fileTypes, type]
                          : filters.fileTypes.filter((ft) => ft !== type);
                        handleFilterChange('fileTypes', newFileTypes);
                      }}
                      className="form-checkbox text-green-600"
                    />
                    <span className="ml-2">{type}</span>
                  </label>
                ))}
              </div>

              {/* Sort Dropdown */}
              <div>
                <h4 className="font-semibold mb-2">Sort By</h4>
                <select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="form-select w-full p-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-600"
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
                <p className="text-gray-600">🙁 No products found for your selection.</p>
                <button
                  onClick={() => setFilters({
                    search: '',
                    categories: [],
                    priceRange: [100, 2000],
                    languages: [],
                    fileTypes: [],
                    sort: 'newest',
                  })}
                  className="mt-4 px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 flex items-center justify-center gap-2 mx-auto"
                >
                  <FaSyncAlt /> Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {displayedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 group relative"
                  >
                    <Image
                      src={product.image}
                      alt={product.title}
                      width={300}
                      height={300}
                      className="w-full h-48 object-cover"
                      loading="lazy"
                    />
                    <div className="p-4">
                      {product.badge && (
                        <span className={`text-xs font-semibold px-2 py-1 rounded mb-2 inline-block ${
                          product.badge === 'Bestseller' ? 'bg-yellow-500 text-white' : 
                          product.badge === 'New' ? 'bg-green-500 text-white' : 
                          'bg-red-500 text-white'
                        }`}>
                          {product.badge}
                        </span>
                      )}
                      <h3 className="text-lg font-semibold text-green-700 mb-1 truncate">{product.title}</h3>
                      <p className="text-gray-600 font-bold mb-1">Rs. {product.price}</p>
                      <p className="text-gray-500 text-sm mb-2">{product.fileType}</p>
                      <button
                        onClick={() => addToCart(product)}
                        className="w-full py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105"
                      >
                        <FaShoppingCart /> Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination / Load More */}
            {filteredProducts.length > displayedProducts.length && (
              <div className="text-center mt-8">
                <button
                  className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700"
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                >
                  ⬇️ Load More Products
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