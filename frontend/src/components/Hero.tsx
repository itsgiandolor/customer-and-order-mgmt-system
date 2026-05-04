import Link from 'next/link';

export default function Hero() {
  return (
    <main className="relative z-10 flex flex-col items-center justify-center text-center px-4 flex-grow -mt-10">
      {/* Top Badge */}
      <div className="border border-white/20 bg-white/5 backdrop-blur-md rounded-full px-4 py-1.5 text-sm text-slate-200 mb-8 flex items-center gap-2">
        <span className="text-[#6366f1]">✦</span> Intelligent Smart Retail & Supply Chain Ecosystem
      </div>

      {/* Headlines */}
      <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-2">
        Transforming Retail with Intelligence.
      </h1>
      <h2 className="text-4xl md:text-6xl font-extrabold text-[#6366f1] tracking-tight mb-6">
        One Connected Ecosystem.
      </h2>

      {/* Subheadline */}
      <p className="text-slate-300 max-w-2xl text-lg md:text-xl mb-10 leading-relaxed font-light">
        The all-in-one smart platform for retail management, supply chain visibility, and efficient fulfillment tracking.
      </p>

      {/* Main CTA */}
      <Link 
        href="/catalog" 
        className="bg-[#6366f1] hover:bg-[#4f46e5] text-white font-semibold text-lg py-4 px-10 rounded-full flex items-center gap-2 transition-transform hover:scale-105 shadow-[0_0_30px_-10px_rgba(99,102,241,0.6)]"
      >
        Browse Catalog 
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </Link>
    </main>
  );
}