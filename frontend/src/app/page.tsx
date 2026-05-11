// frontend/src/app/page.tsx
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';

export default function Home() {
  return (
    <div className="bg-white min-h-screen p-4">
      {/* Sticky Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-slate-800 border-b border-white/30 px-6 lg:px-14 py-4 shadow-lg">
        <div className="flex items-center justify-between max-w-[1920px] mx-auto">
          <div className="flex items-center gap-8 lg:gap-52">
            <Link href="/" className="text-2xl lg:text-4xl font-bold text-white">
              KAM<span className="text-indigo-500">S</span>
            </Link>
            <div className="hidden md:flex items-center gap-6 lg:gap-24">
              <Link href="/catalog" className="text-white text-base lg:text-xl">Shop</Link>
              <Link href="/cart" className="text-white text-base lg:text-xl">Cart</Link>
              <Link href="/track" className="text-white text-base lg:text-xl">Track Order</Link>
              <Link href="#" className="text-white text-base lg:text-xl">About Us</Link>
            </div>
          </div>
        </div>
      </nav>
      <div 
        className="relative bg-slate-900 min-h-[calc(100vh-2rem)] rounded-[2rem] overflow-hidden flex flex-col justify-between"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070&auto=format&fit=crop')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark slate overlay */}
        <div className="absolute inset-0 bg-slate-900/80"></div>

        <Hero />
        
      </div>
    </div>
  );
}