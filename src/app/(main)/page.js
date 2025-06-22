import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import Image from 'next/image';
import { FaBook, FaHeadphones, FaImage, FaPlayCircle, FaEnvelope, FaPhone, FaMapMarkerAlt, FaFacebookF, FaInstagram, FaYoutube, FaWhatsapp } from 'react-icons/fa';

export const metadata = {
  title: 'Khanqah Saifia Digital Store',
  description: 'Explore authentic Islamic PDFs, audio lectures, and exclusive art to enrich your spiritual journey.',
  keywords: 'Islamic knowledge, digital books, audio bayanat, Islamic art, Tasawwuf',
};

export default function HomePage() {
  return (
    <div className="bg-white font-['Cairo'] text-gray-800">
      {/* Hero Banner Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1612019750679-55aaf2e0d1bb?q=80&w=2070&auto=format&fit=crop)' }}>
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 text-center text-white px-4 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">KHANQAH SAIFIA DIGITAL STORE</h1>
          <p className="text-xl md:text-2xl mb-6 italic">Authentic Knowledge, Delivered Digitally.</p>
          <p className="text-lg mb-8">Explore high-quality Islamic PDFs, audio lectures, and exclusive art to enrich your spiritual journey — right from your device.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="bg-green-600 hover:bg-green-700 text-white rounded-full px-6 py-3 text-lg shadow-md hover:shadow-lg transition-all">
              <Link href="/shop">🛒 Start Exploring</Link>
            </Button>
            <Button asChild className="bg-amber-600 hover:bg-amber-700 text-white rounded-full px-6 py-3 text-lg shadow-md hover:shadow-lg transition-all">
              <Link href="/shop">📘 View Collections</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Highlight Strip */}
      <section className="bg-green-100 py-4 text-center text-gray-700">
        <p className="text-sm md:text-base">Trusted by hundreds of seekers of knowledge across the world 🌍 | 100% Digital | Secure Payments via Meezan | Instant Downloads After Purchase</p>
      </section>

      {/* What We Offer Section */}
      <section className="py-16 bg-beige-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-green-800 mb-12">What We Offer</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: FaBook, title: 'Digital Books', desc: 'Download authentic Islamic books on Tafseer, Hadith, Tasawwuf, and Seerah in PDF format.' },
              { icon: FaHeadphones, title: 'Audio Lectures', desc: 'Gain spiritual insights through categorized bayanat and lecture series, instantly downloadable.' },
              { icon: FaImage, title: 'Islamic Art', desc: 'Access high-resolution Arabic calligraphy and spiritual posters for personal digital use.' },
              { icon: FaPlayCircle, title: 'Courses (Coming Soon)', desc: 'Structured Islamic learning experiences with downloadable course material.' },
            ].map((item, idx) => (
              <div key={idx} className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-green-100">
                <item.icon className="text-4xl text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-green-800 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-green-800 mb-12">Featured Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { img: 'https://images.unsplash.com/photo-1587617425953-9075d28b8c46', name: '40 Hadith Nawawi – Urdu PDF', price: 'Rs. 450', tag: 'Bestseller' },
              { img: 'https://images.pexels.com/photos/29717080/pexels-photo-29717080.jpeg', name: 'Tasawwuf Series Vol. 1 – Audio', price: 'Rs. 650' },
              { img: 'https://i.pinimg.com/736x/ef/19/ce/ef19ce2be31dfd0c45921cfee71ba549.jpg', name: 'Ayat al-Kursi Calligraphy Poster (Digital)', price: 'Rs. 500' },
              { img: 'https://images.pexels.com/photos/8164399/pexels-photo-8164399.jpeg', name: 'Tafseer-e-Mazhari – Volume 1 PDF', price: 'Rs. 700' },
            ].map((product, idx) => (
              <div key={idx} className="bg-beige-50 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
                <Image src={product.img} alt={product.name} width={300} height={200} className="w-full h-48 object-cover" />
                <div className="p-4">
                  {product.tag && <span className="text-xs font-semibold text-amber-600 bg-amber-100 px-2 py-1 rounded mb-2 inline-block">{product.tag}</span>}
                  <h3 className="text-lg font-semibold text-green-800">{product.name}</h3>
                  <p className="text-gray-600 font-bold">{product.price}</p>
                  <Button className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white rounded-full">Add to Cart</Button>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Button asChild className="bg-green-600 hover:bg-green-700 text-white rounded-full px-6 py-3">
              <Link href="/shop">View Full Shop</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Digital Books Section */}
      <section className="py-16 bg-beige-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-green-800 mb-12">Digital Books Collection</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { img: 'https://i.pinimg.com/736x/42/f2/4d/42f24d920778fe1cc1b9ee803bbf3a41.jpg', name: 'Sahih Bukhari Complete - Urdu', price: 'Rs. 1,250', tag: 'Premium' },
              { img: 'https://i.pinimg.com/736x/58/da/50/58da5022df6d5f0df895d907b50a9fc7.jpg', name: 'Tafseer Ibn Kathir - Volume Set', price: 'Rs. 2,100', tag: 'Complete Set' },
              { img: 'https://i.pinimg.com/736x/22/87/75/22877590f29cbcb82a9f5e978d52a1e9.jpg', name: 'Riyadh us Saliheen - Annotated', price: 'Rs. 850' },
              { img: 'https://i.pinimg.com/736x/fd/75/f9/fd75f95b43cc92d9d0d27c2d5cd157cd.jpg', name: 'Ihya Ulum al-Din - Imam Ghazali', price: 'Rs. 1,750' },
              { img: 'https://i.pinimg.com/736x/cb/95/0d/cb950d920ce6dae3611d470ca00b4ec4.jpg', name: 'Qasas ul Anbiya - Stories of Prophets', price: 'Rs. 950' },
              { img: 'https://i.pinimg.com/736x/05/6e/89/056e89f774fb28e3300d263b315b1567.jpg', name: 'Mishkat al-Masabih - Complete', price: 'Rs. 1,450' },
              { img: 'https://i.pinimg.com/736x/e1/c4/52/e1c45257ab85f772396f355324e125ca.jpg', name: 'Seerat-un-Nabi - Shibli Nomani', price: 'Rs. 1,150' },
              { img: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570', name: 'Tanbih al-Ghafilin - Fiqh Guide', price: 'Rs. 750' },
            ].map((book, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-green-100">
                <Image src={book.img} alt={book.name} width={250} height={180} className="w-full h-44 object-cover" />
                <div className="p-4">
                  {book.tag && <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded mb-2 inline-block">{book.tag}</span>}
                  <h3 className="text-md font-semibold text-green-800 mb-2 leading-tight">{book.name}</h3>
                  <p className="text-gray-700 font-bold text-lg">{book.price}</p>
                  <Button className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white rounded-full text-sm py-2">Add to Cart</Button>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Button asChild className="bg-green-600 hover:bg-green-700 text-white rounded-full px-6 py-3">
              <Link href="/digital-books">View All Digital Books</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Islamic Art Products Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-green-800 mb-12">Islamic Art Collection</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { img: 'https://i.pinimg.com/736x/13/3e/f1/133ef17d8eb6c50d3c904fb124472924.jpg', name: 'Bismillah Calligraphy - Gold Foil', price: 'Rs. 1,200', tag: 'Premium' },
              { img: 'https://i.pinimg.com/736x/ef/19/ce/ef19ce2be31dfd0c45921cfee71ba549.jpg', name: 'Ayat al-Kursi - Ornate Design', price: 'Rs. 950' },
              { img: 'https://i.pinimg.com/736x/74/b1/9d/74b19d08413a53b6624351cd96576a70.jpg', name: '99 Names of Allah - Complete Set', price: 'Rs. 1,850', tag: 'Complete Set' },
              { img: 'https://i.pinimg.com/736x/5e/53/05/5e5305ee1e52e2484888eef7b5568d49.jpg', name: 'Surah Al-Fatiha - Decorative', price: 'Rs. 750' },
              { img: 'https://i.pinimg.com/736x/79/b9/4e/79b94e63d1b4936fea1da1075acdf62b.jpg', name: 'Islamic Geometric Patterns', price: 'Rs. 850' },
              { img: 'https://i.pinimg.com/736x/6b/d3/e2/6bd3e20b975063132fe4c3a03f87cfc8.jpg', name: 'Masjid al-Haram Illustration', price: 'Rs. 1,100' },
              { img: 'https://i.pinimg.com/736x/57/6b/64/576b6421ebee0ad3187eafa8535db637.jpg', name: 'Durood Sharif - Elegant Script', price: 'Rs. 650' },
              { img: 'https://i.pinimg.com/736x/7a/43/ba/7a43bafa149c7af27d7abdc4b2b4fc11.jpg', name: 'Islamic Mandala Art - HD', price: 'Rs. 900' },
            ].map((art, idx) => (
              <div key={idx} className="bg-beige-50 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-green-100">
                <Image src={art.img} alt={art.name} width={250} height={180} className="w-full h-44 object-cover" />
                <div className="p-4">
                  {art.tag && <span className="text-xs font-semibold text-amber-600 bg-amber-100 px-2 py-1 rounded mb-2 inline-block">{art.tag}</span>}
                  <h3 className="text-md font-semibold text-green-800 mb-2 leading-tight">{art.name}</h3>
                  <p className="text-gray-700 font-bold text-lg">{art.price}</p>
                  <Button className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white rounded-full text-sm py-2">Add to Cart</Button>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Button asChild className="bg-green-600 hover:bg-green-700 text-white rounded-full px-6 py-3">
              <Link href="/islamic-art">View All Islamic Art</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Browse by Category Section */}
      <section className="py-16 bg-beige-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-green-800 mb-12">Browse by Category</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: FaBook, name: 'Digital Books', desc: 'Authentic texts on Islamic sciences.' },
              { icon: FaHeadphones, name: 'Audio Bayanat', desc: 'Inspiring lectures for spiritual growth.' },
              { icon: FaImage, name: 'Islamic Art', desc: 'High-quality digital calligraphy.' },
              { icon: FaPlayCircle, name: 'Course Material (Coming Soon)', desc: 'Structured learning resources.' },
            ].map((category, idx) => (
              <Link key={idx} href={`/category/${category.name.toLowerCase().replace(/\s+/g, '-')}`} className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-green-100">
                <category.icon className="text-4xl text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-green-800 mb-2">{category.name}</h3>
                <p className="text-gray-600 text-sm">{category.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Khanqah Saifia Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-green-800 mb-6">Rooted in Tradition. Digitally Delivered.</h2>
              <p className="text-gray-600 mb-4">Khanqah Saifia is committed to spreading timeless Islamic knowledge using modern tools. Our content is hand-selected for authenticity and formatted for easy digital access.</p>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li>Curated by authentic scholars and khulafa of traditional khanqahs</li>
                <li>Available in Urdu and English</li>
                <li>Downloadable formats: PDF, MP3, HD PNG</li>
                <li>Designed for personal study, spiritual growth, and ease of access</li>
              </ul>
              <Button asChild className="mt-6 bg-green-600 hover:bg-green-700 text-white rounded-full px-6 py-3">
                <Link href="/shop">📘 Start Your Spiritual Journey</Link>
              </Button>
            </div>
            <div className="relative">
              <Image src="https://images.unsplash.com/photo-1612019750679-55aaf2e0d1bb" alt="Quranic background" width={500} height={400} className="rounded-lg object-cover" />
              <div className="absolute inset-0 bg-green-600/20 rounded-lg"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-8 flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1">
              <h3 className="text-2xl font-semibold text-green-800 mb-4">📬 Receive New Releases & Resources</h3>
              <p className="text-gray-600 mb-4">Be the first to know when we publish new bayanaat, digital posters, and classical Islamic texts.</p>
            </div>
            <div className="flex-1 w-full">
              <div className="flex flex-col gap-4">
                <input type="text" placeholder="Name" className="w-full border border-gray-300 rounded-full p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-600" />
                <input type="email" placeholder="Email" className="w-full border border-gray-300 rounded-full p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-600" />
                <label className="flex items-center gap-2 text-gray-600">
                  <input type="checkbox" className="form-checkbox text-green-600" />
                  I agree to receive updates from Khanqah Saifia.
                </label>
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white rounded-full py-3">Subscribe</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                {['Home', 'Shop', 'Digital Books', 'Audio Lectures', 'About Us', 'Contact'].map((link) => (
                  <li key={link}>
                    <Link href={`/${link.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-green-400">{link}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <FaEnvelope className="text-green-600" />
                  <span>info@khanqahsaifia.com</span>
                </li>
                <li className="flex items-center gap-2">
                  <FaPhone className="text-green-600" />
                  <span>+92-3xx-xxxxxxx</span>
                </li>
                <li className="flex items-center gap-2">
                  <FaMapMarkerAlt className="text-green-600" />
                  <span>Faisalabad, Pakistan</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
              <div className="flex gap-4">
                <a href="#" className="text-green-600 hover:text-green-400"><FaFacebookF className="text-2xl" /></a>
                <a href="#" className="text-green-600 hover:text-green-400"><FaInstagram className="text-2xl" /></a>
                <a href="#" className="text-green-600 hover:text-green-400"><FaYoutube className="text-2xl" /></a>
                <a href="#" className="text-green-600 hover:text-green-400"><FaWhatsapp className="text-2xl" /></a>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                {['Privacy Policy', 'Refund Policy', 'Terms & Conditions'].map((link) => (
                  <li key={link}>
                    <Link href={`/${link.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-green-400">{link}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}