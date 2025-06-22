"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaSearch, FaFilter, FaShoppingCart, FaSyncAlt } from 'react-icons/fa';
import { useCart } from '@/context/cartContext';

// export const metadata = {
//   title: 'Khanqah Saifia Digital Store - Islamic Art',
//   description: 'Access high-resolution Arabic calligraphy and spiritual posters for personal digital use.',
//   keywords: 'Islamic art, calligraphy, digital posters, PNG',
// };

export default function IslamicArtPage() {
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

  // Islamic Art products
  const products = [
    { id: 3, title: 'Ayat al-Kursi Calligraphy – PNG', price: 500, fileType: 'PNG', language: 'Arabic', badge: 'New', image: 'https://i.pinimg.com/736x/ef/19/ce/ef19ce2be31dfd0c45921cfee71ba549.jpg' },
    { id: 6, title: 'Dua-e-Qunoot Poster – PNG', price: 400, fileType: 'PNG', language: 'Arabic', image: 'https://i.pinimg.com/736x/a4/77/64/a477642aa5f99a4ccf961173886300a1.jpg' },
    { id: 9, title: 'Asma-ul-Husna Art – PNG', price: 450, fileType: 'PNG', language: 'Arabic', image: 'https://i.pinimg.com/736x/51/88/2c/51882c0619cd5cd860ec249476217094.jpg' },
    { id: 12, title: 'Surah Yasin Calligraphy – PNG', price: 350, fileType: 'PNG', language: 'Arabic', badge: 'New', image: 'https://i.pinimg.com/736x/88/31/1a/88311a19f4c7f69aff78e6ed54c8acb6.jpg' },
    { id: 15, title: 'Islamic Patterns Bundle – PNG', price: 1200, fileType: 'PNG', language: 'Arabic', badge: 'Limited', image: 'https://i.pinimg.com/736x/34/c0/37/34c0379d7c48670b4e7e20c27e9dd623.jpg' },
    { id: 19, title: '99 Names of Allah Poster – PNG', price: 600, fileType: 'PNG', language: 'Arabic', image: 'https://i.pinimg.com/736x/74/b1/9d/74b19d08413a53b6624351cd96576a70.jpg' },
    { id: 22, title: 'Surah Rahman Art – PNG', price: 400, fileType: 'PNG', language: 'Arabic', image: 'https://i.pinimg.com/736x/2c/d2/a8/2cd2a875c1268555690ef94411efda49.jpg' },
    { id: 25, title: 'Calligraphy Bundle – PNG', price: 1000, fileType: 'PNG', language: 'Arabic', badge: 'Limited', image: 'https://i.pinimg.com/736x/79/b9/4e/79b94e63d1b4936fea1da1075acdf62b.jpg' },
    { id: 29, title: 'Islamic Quotes Poster – PNG', price: 350, fileType: 'PNG', language: 'Arabic', image: 'https://i.pinimg.com/736x/c9/09/0f/c9090fa36cdc8cc10dd7026a899c431d.jpg' },
    { id: 31, title: 'Surah Ikhlas Art – PNG', price: 450, fileType: 'PNG', language: 'Arabic', image: 'https://i.pinimg.com/736x/c8/cc/41/c8cc4161050137968fd37f6a114dd5f2.jpg' },
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
            <Link href="/" className="hover:underline">Home</Link>  <Link href="/shop" className="hover:underline">Shop</Link> Islamic Art
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-green-700 mb-2">🖼️ Islamic Art</h1>
          <p className="text-gray-600">Access high-resolution Arabic calligraphy and spiritual posters for personal digital use.</p>
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
                    placeholder="Search art"
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
                {['Arabic'].map((language) => (
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
                <p className="text-gray-600">🙁 No art found for your selection.</p>
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
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${product.badge === 'Bestseller' ? 'bg-yellow-100 text-yellow-800' : product.badge === 'New' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} mb-2 inline-block`}>
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
                  ⬇️ Load More Art
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