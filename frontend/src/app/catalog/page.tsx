"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@heroui/react";
import apiClient from '../../api/axiosConfig';
import { useCart } from '../../context/CartContext';

// Safe cart count hook to prevent hydration mismatch
function useSafeCartCount() {
  const [count, setCount] = useState(0);
  const { cart } = useCart();
  
  useEffect(() => {
    setCount(cart.reduce((sum, item) => sum + item.quantity, 0));
  }, [cart]);
  
  return count;
}

const getStockBadge = (status: string, stock: number | null) => {
  if (stock === null) return null; // Inventory API was down, show nothing
  if (status === 'ERROR' || stock === 0) return (
    <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">Out of Stock</span>
  );
  if (status === 'LOW_STOCK') return (
    <span className="px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded-full">Only {stock} left</span>
  );
  return null; // In Stock - don't show badge
};

export default function ProductCatalog() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { cart, addToCart } = useCart();

  const categories = ['Clothing & Apparel', 'Home & Living', 'Electronics'];

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Utilizing the backend's ?category query parameter
        const endpoint = selectedCategory 
          ? `/products?category=${encodeURIComponent(selectedCategory)}` 
          : '/products';
        const response = await apiClient.get(endpoint);
        setProducts(response.data);
        setError(null);
      } catch (err) {
        setError("Could not load products from the inventory system.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedCategory]);

  const totalItems = useSafeCartCount();

  return (
    <div className="min-h-screen bg-gray-50 scrollbar-hide">
      {/* Sticky Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-slate-800 border-b border-white/30 px-6 lg:px-14 py-4 shadow-lg">
        <div className="flex items-center justify-between max-w-[1920px] mx-auto">
          <div className="flex items-center gap-8 lg:gap-52">
            <Link href="/" className="text-2xl lg:text-4xl font-bold text-white">
              KAM<span className="text-indigo-500">S</span>
            </Link>
            <div className="hidden md:flex items-center gap-6 lg:gap-24">
              <Link href="/catalog" className="text-white text-base lg:text-xl font-semibold">Shop</Link>
              <Link href="/cart" className="text-white text-base lg:text-xl">Cart</Link>
              <Link href="/track" className="text-white text-base lg:text-xl">Track Order</Link>
              <Link href="#" className="text-white text-base lg:text-xl">About Us</Link>
            </div>
          </div>
          {/* Search Component */}
          <div className="hidden md:flex items-center">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[200px] lg:w-[280px] bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:bg-white/20 focus:border-white/40 transition-all"
              />
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </nav>

      {/* Shop Banner - Only show when no category selected */}
      {!selectedCategory && (
        <div
          className="relative w-full h-32 md:h-40 bg-slate-900 flex items-center justify-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-slate-900/60"></div>
          <h1 className="relative z-10 text-4xl md:text-5xl font-black text-white/90 tracking-tighter uppercase">Shop</h1>
        </div>
      )}

      {/* Content Area - Sticky container like main shop page */}
      <div className={`flex flex-col md:flex-row max-w-[1920px] mx-auto ${selectedCategory ? 'sticky top-[72px] z-40 bg-gray-50' : ''}`}>
        {/* Left Sidebar - Sticky below navbar */}
        <aside className="hidden md:block w-64 shrink-0 bg-gray-50 border-r border-gray-200 p-6 sticky top-[72px] h-fit">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Categories</h2>
          <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-4">
            <div 
              className={`font-semibold cursor-pointer flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 ${!selectedCategory ? 'text-indigo-600' : 'text-slate-800'}`}
              onClick={() => setSelectedCategory(null)}
            >
              <span>🛍️</span> All Products
            </div>
            <ul className="space-y-3 pl-2 text-sm font-medium">
              {categories.map(cat => (
                <li 
                  key={cat}
                  onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                  className={`cursor-pointer transition flex items-center gap-2 ${selectedCategory === cat ? 'text-indigo-600 font-bold' : 'text-slate-600 hover:text-indigo-600'}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${selectedCategory === cat ? 'bg-indigo-600' : 'bg-indigo-200'}`}></span> {cat}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Right Main Area */}
        <main className="flex-1 flex flex-col">
          {/* Header Row - Sticky below navbar */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-[72px] z-30">
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

          {/* Product Grid - Scrollable when category selected */}
          <div className={`flex-1 p-6 ${selectedCategory ? 'overflow-y-auto' : ''}`} style={selectedCategory ? { maxHeight: 'calc(100vh - 200px)' } : undefined}>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                Loading catalog...
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12 text-red-500">{error}</div>
            ) : products.filter(p => 
                searchQuery === '' || 
                p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.description?.toLowerCase().includes(searchQuery.toLowerCase())
              ).length === 0 ? (
              <div className="flex items-center justify-center py-12 text-slate-500">
                {searchQuery ? `No products found for "${searchQuery}"` : 'No products found in this category.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products
                  .filter(product => 
                    searchQuery === '' || 
                    product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    product.description?.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((product) => (
                  <div key={product.product_id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col" >

                    {/* Image Area mapped to Backend image_url */}
                    <Link href={`/products/${product.product_id}`} className="relative aspect-square bg-slate-50 rounded-lg mb-4 flex items-center justify-center overflow-hidden cursor-pointer">
                      <img 
                        src={product.image_url || 'https://placehold.co/300x200'} 
                        alt={product.product_name} 
                        className="w-full h-full object-cover"
                      />
                    </Link>

                    <h3 className="font-bold text-slate-800 text-lg mb-1 truncate" title={product.product_name}>
                      {product.product_name}
                    </h3>
                    
                    {/* Surfaced the product description from the backend schema */}
                    <p className="text-xs text-slate-500 mb-2 line-clamp-2" title={product.description}>
                      {product.description}
                    </p>

                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1">
                        <span className="text-amber-400 text-xs">★</span>
                        <span className="text-xs text-slate-600 font-medium">{product.rating} <span className="text-slate-400 font-normal">({product.reviews} Ratings)</span></span>
                      </div>
                      <p className="text-xl font-extrabold text-indigo-600">₱{product.price}</p>
                    </div>

                    <div className="mb-2">
                      {getStockBadge(product.stock_status, product.current_stock)}
                    </div>

                    <div className="mt-auto flex justify-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => addToCart(product)}
                        isDisabled={product.stock_status === 'ERROR' || product.current_stock === 0}
                        className="font-semibold text-xs border-2 border-slate-300 bg-slate-100 text-slate-700 hover:bg-white hover:border-slate-400 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex-[1.5]"
                      >
                        Add to Cart
                      </Button>
                      <Button
                        onClick={() => { addToCart(product); window.location.href = '/checkout'; }}
                        isDisabled={product.stock_status === 'ERROR' || product.current_stock === 0}
                        className="font-semibold text-xs bg-indigo-500 text-white shadow-md shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex-1"
                      >
                        Buy Now
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}