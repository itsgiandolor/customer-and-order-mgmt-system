// frontend/src/components/Navbar.tsx
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="relative z-10 flex items-center justify-between px-8 py-6">
      {/* Logo */}
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
        <Link 
          href="/dashboard" 
          className="border border-white hover:bg-white/10 text-white text-sm font-semibold px-6 py-2 rounded-lg transition flex items-center gap-2"
        >
          Dashboard ↗
        </Link>
      </div>
    </nav>
  );
}