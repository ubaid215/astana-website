import { CartProvider } from '@/context/cartContext';
import Header from '@/components/layout/Header';
// import Footer from '@/components/layout/Footer';

export default function MainLayout({ children }) {
  return (
    <CartProvider>
      <Header />
      <main className="min-h-screen bg-cream-50 font-['Cairo']">{children}</main>
      {/* <Footer /> */}
    </CartProvider>
  );
}