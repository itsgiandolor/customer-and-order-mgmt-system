"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import apiClient from '../../../api/axiosConfig';
import { useCart } from '../../../context/CartContext';

export default function ProductDetails() {
  const params = useParams();
  const [product, setProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

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
    <div className="min-h-screen bg-gray-50 pt-8 pb-16">
      <div className="max-w-6xl mx-auto px-6">
        
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
              <span className="text-sm font-medium text-emerald-600">In Stock ({product.stock})</span>
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
                  onClick={() => addToCart({ ...product, quantity })}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-lg transition shadow-lg shadow-indigo-200"
                >
                  Add to Cart
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}