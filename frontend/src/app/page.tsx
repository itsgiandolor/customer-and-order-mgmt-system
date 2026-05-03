import { Button } from "@heroui/react";
import Link from 'next/link';

export default function Home() {
  return (
    // The outer div uses the clean white from the left side of your palette
    <div className="bg-white min-h-screen p-4">
      
      {/* The main rounded container using the deep slate/navy from the right side */}
      <div 
        className="relative bg-slate-900 min-h-[calc(100vh-2rem)] rounded-[2rem] overflow-hidden flex flex-col justify-between"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070&auto=format&fit=crop')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark slate overlay to blend the image into your new background color */}
        <div className="absolute inset-0 bg-slate-900/80"></div>

        {/* --- NAVBAR --- */}
        <nav className="relative z-10 flex items-center justify-between px-8 py-6">
          {/* Logo with the new Indigo accent */}
          <div className="text-2xl font-black text-white italic tracking-tighter">
            Order<span className="text-[#6366f1]">Mgmt</span>
          </div>

          {/* Center Links */}
          <div className="hidden md:flex gap-8 text-sm font-medium text-slate-300">
            <Link href="#" className="hover:text-white transition">About Us</Link>
            <Link href="#" className="hover:text-white transition">Features</Link>
            <Link href="#" className="hover:text-white transition">Services</Link>
            <Link href="#" className="hover:text-white transition">Contact</Link>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-6">
            <div className="hidden md:block text-right">
              <p className="text-xs font-bold text-slate-300">₱ PHP</p>
              <p className="text-[10px] text-slate-400">System v2.0 | Status: Online</p>
            </div>
            {/* Outline button styled like the "Login" button in your palette */}
            <Link 
              href="/dashboard" 
              className="border border-white hover:bg-white/10 text-white text-sm font-semibold px-6 py-2 rounded-lg transition flex items-center gap-2"
            >
              Dashboard ↗
            </Link>
          </div>
        </nav>

        {/* --- HERO SECTION --- */}
        <main className="relative z-10 flex flex-col items-center justify-center text-center px-4 flex-grow -mt-10">
          
          {/* Top Badge */}
          <div className="border border-white/20 bg-white/5 backdrop-blur-md rounded-full px-4 py-1.5 text-sm text-slate-200 mb-8 flex items-center gap-2">
            <span className="text-[#6366f1]">✦</span> The All-in-One Management System
          </div>

          {/* Headlines */}
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-2">
            Your Business, Simplified.
          </h1>
          <h2 className="text-5xl md:text-7xl font-extrabold text-[#6366f1] tracking-tight mb-6">
            All In One Platform.
          </h2>

          {/* Subheadline */}
          <p className="text-slate-300 max-w-2xl text-lg md:text-xl mb-10 leading-relaxed font-light">
            The unified platform for managing orders, verifying payments, and tracking delivery fulfillment all in one place.
          </p>

          {/* Main CTA styled exactly like the "Register" button in your palette */}
          <Link 
            href="/catalog" 
            className="bg-[#6366f1] hover:bg-[#4f46e5] text-white font-semibold text-lg py-4 px-10 rounded-lg flex items-center gap-2 transition-transform hover:scale-105 shadow-[0_0_30px_-10px_rgba(99,102,241,0.6)]"
          >
            Browse Catalog 
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </main>
      </div>
    </div>
  );
}