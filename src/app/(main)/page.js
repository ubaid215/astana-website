import Hero from '@/components/layout/Hero';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { FaCheckCircle, FaUsers, FaHandHoldingHeart } from 'react-icons/fa';

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
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-primary mb-8">Why Choose Us</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <FaCheckCircle className="text-4xl text-secondary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Transparent Process</h3>
            <p className="text-gray-600">Clear and open participation system for trust and reliability.</p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <FaUsers className="text-4xl text-secondary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Community Driven</h3>
            <p className="text-gray-600">Join a community dedicated to meaningful contributions.</p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <FaHandHoldingHeart className="text-4xl text-secondary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Easy Participation</h3>
            <p className="text-gray-600">Simple and secure form to participate in Eid ul Adha.</p>
          </div>
        </div>
      </section>
      <section className="py-12 bg-gray-100">
        <h2 className="text-3xl font-bold text-center text-primary mb-8">How It Works</h2>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary mb-2">1. Register</div>
            <p className="text-gray-600">Create an account or log in to start.</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary mb-2">2. Submit Form</div>
            <p className="text-gray-600">Fill out the participation form with your details.</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary mb-2">3. Confirm</div>
            <p className="text-gray-600">Receive confirmation and track your participation.</p>
          </div>
        </div>
      </section>
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-primary mb-8">Testimonials</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <p className="text-gray-600 mb-4">This platform made my Eid ul Adha participation so easy and transparent!</p>
            <p className="font-semibold">Ahmed, Saudi Arabia</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <p className="text-gray-600 mb-4">I felt confident knowing exactly how my contribution was used.</p>
            <p className="font-semibold">Fatima, UAE</p>
          </div>
        </div>
        <div className="text-center mt-8">
          <Button asChild className="bg-primary text-white">
            <Link href="/participation">Join Now</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}