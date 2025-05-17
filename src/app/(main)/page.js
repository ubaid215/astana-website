import Hero from '@/components/layout/Hero';
import PopupCard from '@/components/PopupCard';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import {
  FaCheckCircle,
  FaUsers,
  FaHandHoldingHeart,
  FaHeart,
  FaHandsHelping,
  FaPrayingHands,
  FaMosque,
  FaBookOpen,
  FaScroll
} from 'react-icons/fa';
import Image from 'next/image';

console.log('Rendering HomePage');

export const metadata = {
  title: 'Eid ul Adha Participation System',
  description: 'Join our platform to participate in Eid ul Adha with ease and transparency.',
  keywords: 'Eid ul Adha, participation, sacrifice, qurbani, transparent',
};

export default function HomePage() {
  return (
    <div className="bg-background">
      <Hero />

      {/* Popup Card */}
      <PopupCard />

      {/* New Bento-style Section */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left side - Bento Images */}
          <div className="relative grid grid-cols-2 gap-4 h-full">
            {/* Main large image */}
            <div className="col-span-2 aspect-video relative rounded-xl overflow-hidden shadow-lg">
              <video
                src="/videos/qurbani-intro.mp4" // replace with your actual video path
                className="w-full h-full object-cover"
                controls
                autoPlay
                playsInline
                muted
              />
            </div>


            {/* Two smaller images */}
            <div className="aspect-square relative rounded-xl overflow-hidden shadow-lg">
              <Image
                src="/images/img2.jpg"
                alt="Qurbani preparation"
                fill
                sizes="(max-width: 768px) 100vw, 25vw"
                className="object-cover transform transition-transform hover:scale-105 duration-300"
              />
            </div>
            <div className="aspect-square relative rounded-xl overflow-hidden shadow-lg">
              <Image
                src="/images/img3.jpg"
                alt="Meat distribution"
                fill
                sizes="(max-width: 768px) 100vw, 25vw"
                className="object-cover transform transition-transform hover:scale-105 duration-300"
              />
            </div>
          </div>

          {/* Right side - Content */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-2">Qurbani in Allah&apos;s Name, Delivered with Love</h2>
              <p className="text-lg text-gray-600">Empowering Eid ul Adha Participation &amp; Distribution with Meaning and Impact</p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="mt-1 bg-primary/10 p-3 rounded-full">
                  <FaHeart className="text-xl text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-1">Inclusive Qurbani for All</h3>
                  <p className="text-gray-600">We simplify the process so everyone can easily participate in the sacred act of sacrifice, regardless of location or financial limits.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 bg-primary/10 p-3 rounded-full">
                  <FaHandsHelping className="text-xl text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-1">Meat That Reaches Where It Matters</h3>
                  <p className="text-gray-600">Our organized distribution ensures that fresh, quality meat is delivered to families who need it most — with dignity and care.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 bg-primary/10 p-3 rounded-full">
                  <FaPrayingHands className="text-xl text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-1">Faith-Driven, Transparent System</h3>
                  <p className="text-gray-600">From registration to delivery, every step is designed to reflect the sincerity of your sacrifice for the sake of Allah.</p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button asChild className="bg-primary hover:bg-primary/90 text-white">
                <Link href="/participation">Participate Now</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Our Activities Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-primary mb-3">Here Are Our Activities</h2>
          <p className="text-center text-gray-600 mb-12 max-w-3xl mx-auto">Explore the various Islamic activities and programs we offer to serve our community and strengthen our faith together.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 - Mosque Development */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="p-6">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <FaMosque className="text-3xl text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-center mb-3">Mosque Development</h3>
                <p className="text-gray-600 text-center">Supporting the construction, maintenance, and improvement of mosques as vital centers for worship and community gathering.</p>
              </div>
            </div>

            {/* Card 2 - Charity & Donation */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="p-6">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <FaHandHoldingHeart className="text-3xl text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-center mb-3">Charity &amp; Donation</h3>
                <p className="text-gray-600 text-center">Facilitating zakat, sadaqah, and other charitable giving to help those in need within our community and beyond.</p>
              </div>
            </div>

            {/* Card 3 - Quran Learning */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="p-6">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <FaBookOpen className="text-3xl text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-center mb-3">Quran Learning</h3>
                <p className="text-gray-600 text-center">Offering Quran recitation, memorization, and tafsir classes for all ages to deepen understanding of Allah&apos;s words.</p>
              </div>
            </div>

            {/* Card 4 - Hadith & Sunnah */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="p-6">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <FaScroll className="text-3xl text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-center mb-3">Hadith &amp; Sunnah</h3>
                <p className="text-gray-600 text-center">Educational programs focused on the teachings and traditions of Prophet Muhammad (PBUH) to guide our daily lives.</p>
              </div>
            </div>

            {/* Card 5 - Parent Education */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="p-6">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <FaUsers className="text-3xl text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-center mb-3">Parent Education</h3>
                <p className="text-gray-600 text-center">Workshops and resources for parents on raising children with Islamic values in the modern world.</p>
              </div>
            </div>

            {/* Card 6 - Islamic Teachings */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="p-6">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <FaPrayingHands className="text-3xl text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-center mb-3">Islamic Teachings</h3>
                <p className="text-gray-600 text-center">Regular classes and seminars on fiqh, aqeedah, and other essential Islamic knowledge for spiritual growth.</p>
              </div>
            </div>
          </div>

          <div className="text-center mt-10">
            <Button asChild className="bg-primary hover:bg-primary/90 text-white">
              <Link href="/activities">View All Activities</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}