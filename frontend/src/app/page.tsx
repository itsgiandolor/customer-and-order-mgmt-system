// frontend/src/app/page.tsx
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';

export default function Home() {
  return (
    <div className="bg-white min-h-screen p-4">
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

        <Navbar />
        <Hero />
        
      </div>
    </div>
  );
}