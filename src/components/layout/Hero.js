"use client";

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function Hero() {
  return (
    <div className="relative h-[60vh] md:h-[80vh]">
      <Swiper
        modules={[Autoplay, Pagination]}
        autoplay={{ delay: 5000 }}
        pagination={{ clickable: true }}
        className="w-full h-full"
      >
        <SwiperSlide>
          <div
            className="h-full bg-cover bg-center flex items-center justify-center"
            style={{ backgroundImage: 'url(/images/hero1.jpg)' }}
          >
            <div className="text-center text-white bg-black/50 bg-opacity-50 p-6 rounded-lg">
              <h1 className="text-3xl md:text-5xl font-bold mb-4">Join Eid ul Adha Participation</h1>
              <p className="text-lg md:text-xl mb-6">Contribute to a meaningful tradition with ease.</p>
              <Button asChild className="bg-primary text-white">
                <Link href="/participation">Participate Now</Link>
              </Button>
            </div>
          </div>
        </SwiperSlide>
        <SwiperSlide>
          <div
            className="h-full bg-cover bg-center flex items-center justify-center"
            style={{ backgroundImage: 'url(/images/hero2.jpg)' }}
          >
            <div className="text-center text-white bg-black/50 bg-opacity-50 p-6 rounded-lg">
              <h1 className="text-3xl md:text-5xl font-bold mb-4">Transparent and Trustworthy</h1>
              <p className="text-lg md:text-xl mb-6">Organize your participation seamlessly.</p>
              <Button asChild className="bg-primary text-white">
                <Link href="/participation">Get Started</Link>
              </Button>
            </div>
          </div>
        </SwiperSlide>
      </Swiper>
    </div>
  );
}