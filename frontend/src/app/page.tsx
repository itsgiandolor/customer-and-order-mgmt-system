// frontend/src/app/page.tsx
import Link from 'next/link';
import Hero from '@/components/Hero';

export default function Home() {
  return (
    <div 
      className="relative bg-slate-900 min-h-screen overflow-hidden flex flex-col justify-between"
      style={{
        backgroundImage: "url('https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070&auto=format&fit=crop')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Sticky Navigation Bar - Flush to sides */}
      <nav className="sticky top-0 z-50 bg-slate-800 border-b border-white/30 px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8 lg:gap-52">
            <Link href="/" className="text-2xl lg:text-4xl font-bold text-white">
              KAM<span className="text-indigo-500">S</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Dark slate overlay */}
      <div className="absolute inset-0 bg-slate-900/80"></div>

      <Hero />
      
    </div>
  );
}