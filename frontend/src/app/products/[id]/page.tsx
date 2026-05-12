"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import apiClient from '../../../api/axiosConfig';
import { useCart } from '../../../context/CartContext';
import Toast from '../../../components/Toast';

const getStockBadge = (status: string, stock: number | null) => {
  if (stock === null) return null; // Inventory API was down, show nothing
  if (status === 'ERROR' || stock === 0) return (
    <span className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-full font-semibold">Out of Stock</span>
  );
  if (status === 'LOW_STOCK') return (
    <span className="px-3 py-1 text-sm bg-amber-100 text-amber-700 rounded-full font-semibold">Only {stock} left</span>
  );
  return (
    <span className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-full font-semibold">In Stock</span>
  );
};

export default function ProductDetails() {
  const params = useParams();
  const [product, setProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const { addToCart } = useCart();

  const handleAddToCart = (product: any) => {
    try {
      addToCart(product);
      setToast({ message: 'Successfully added to cart!', type: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to add to cart. Please try again.', type: 'error' });
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await apiClient.get(`/products/${params.id}`);
        setProduct(response.data);
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };

    if (params?.id) fetchProduct();
  }, [params]);

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-slate-500">Loading product details...</div>;
  }

  if (!product) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-500">Product not found.</div>;
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
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

        <div className="pt-8 pb-16 px-6 max-w-6xl mx-auto">
          {/* Breadcrumbs */}
          <nav className="text-sm font-medium text-slate-500 mb-8">
            <Link href="/" className="hover:text-indigo-600 transition">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/catalog" className="hover:text-indigo-600 transition">Catalog</Link>
            <span className="mx-2">/</span>
            <span className="text-slate-800">{product.product_name}</span>
          </nav>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row gap-12">

            {/* Left: Product Image */}
            <div className="w-full md:w-1/2">
              <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
                <span className="text-gray-400">Product Image Placeholder</span>
              </div>
            </div>

            {/* Right: Product Info */}
            <div className="w-full md:w-1/2 flex flex-col">
              <span className="text-sm font-bold text-indigo-500 tracking-widest uppercase mb-2">{product.category}</span>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">{product.product_name}</h1>

              <div className="flex items-center gap-2 mb-6">
                <div className="flex text-amber-400">★★★★★</div>
                <span className="text-sm text-slate-600">({product.reviews} Customer Reviews)</span>
                <span className="mx-2 text-gray-300">|</span>
                {getStockBadge(product.stock_status, product.current_stock)}
              </div>

              <p className="text-3xl font-black text-slate-900 mb-6">₱{product.price}</p>

              <p className="text-slate-600 leading-relaxed mb-8 border-b border-gray-100 pb-8">
                {product.description}
              </p>

              {/* Quantity & Actions */}
              <div className="flex items-center gap-6 mb-8 mt-auto">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-3 text-slate-600 hover:bg-gray-100 transition rounded-l-lg font-bold"
                  >−</button>
                  <span className="px-4 py-3 font-semibold text-slate-800 border-x border-gray-300 min-w-[50px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-4 py-3 text-slate-600 hover:bg-gray-100 transition rounded-r-lg font-bold"
                  >+</button>
                </div>

                <div className="flex-1 flex gap-3">
                  <button
                    onClick={() => handleAddToCart({ ...product, quantity })}
                    disabled={product.stock_status === 'ERROR' || product.current_stock === 0}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-lg transition shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {product.stock_status === 'ERROR' || product.current_stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={!!toast}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}