"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@heroui/react";
import apiClient from '../../api/axiosConfig';
import { useCart } from '../../context/CartContext';

export default function ProductCatalog() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { cart, addToCart } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await apiClient.get('/products');
        setProducts(response.data);
        setLoading(false);
      } catch (err) {
        setError("Could not load products from the inventory system.");
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      {/* Hero Banner Area */}
      <div 
        className="relative w-full h-48 md:h-64 bg-slate-900 flex items-center justify-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-slate-900/60"></div>
        <h1 className="relative z-10 text-6xl md:text-8xl font-black text-white/90 tracking-tighter uppercase">Shop</h1>
      </div>

      {/* Main Content & Sidebar Container */}
      <div className="flex flex-col md:flex-row max-w-[1400px] mx-auto w-full p-6 gap-8 flex-grow">
        
        {/* Left Sidebar */}
        <aside className="w-full md:w-64 shrink-0">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Categories</h2>
          <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 mb-4">
            <div className="font-semibold text-slate-800 flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <span>🛍️</span> All Products
            </div>
            <ul className="space-y-3 pl-2 text-sm text-slate-600 font-medium">
              <li className="hover:text-indigo-600 cursor-pointer transition flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-200"></span> Clothing & Apparel
              </li>
              <li className="hover:text-indigo-600 cursor-pointer transition flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-200"></span> Home & Living
              </li>
              <li className="hover:text-indigo-600 cursor-pointer transition flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-200"></span> Electronics
              </li>
            </ul>
          </div>
        </aside>

        {/* Right Main Area */}
        <main className="flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
            <Link href="/" className="text-sm font-medium text-indigo-600 hover:underline">← Back to Home</Link>
            <div className="flex items-center gap-4">
              <Link href="/cart" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition">
                Cart: {totalItems} items
              </Link>
              <Link 
                href={cart.length === 0 ? "#" : "/checkout"}
                className={`inline-flex items-center px-4 py-2 rounded-lg font-bold shadow-md shadow-indigo-200 ${cart.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white'}`}
              >
                Checkout ↗
              </Link>
            </div>
          </div>

          {loading ? (
             <div className="flex-grow flex flex-col items-center justify-center text-slate-500">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                Loading catalog...
             </div>
          ) : error ? (
            <div className="flex-grow flex items-center justify-center text-red-500">{error}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <div key={product.product_id} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col">
                  
                  {/* Image Area */}
                  <Link href={`/products/${product.product_id}`} className="relative aspect-square bg-slate-50 rounded-lg mb-4 flex items-center justify-center overflow-hidden cursor-pointer">
                    <span className="absolute top-2 left-2 bg-[#a3ff12] text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide shadow-sm">New</span>
                    <span className="text-gray-400 text-sm">Image Placeholder</span>
                  </Link>

                  <h3 className="font-bold text-slate-800 text-sm mb-1 truncate" title={product.product_name}>
                    {product.product_name}
                  </h3>
                  
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-amber-400 text-xs">★</span>
                    <span className="text-xs text-slate-600 font-medium">{product.rating} <span className="text-slate-400 font-normal">({product.reviews})</span></span>
                  </div>
                  
                  <p className="text-lg font-extrabold text-indigo-600 mb-5">₱{product.price}</p>
                  
                  {/* Action Buttons using HeroUI */}
                  <div className="mt-auto grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => addToCart(product)} 
                      className="font-semibold text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
                    >
                      Add to Cart
                    </Button>
                    <Button 
                      onClick={() => { addToCart(product); window.location.href = '/checkout'; }}
                      className="font-semibold text-xs bg-indigo-500 text-white shadow-md shadow-indigo-200"
                    >
                      Buy Now
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}