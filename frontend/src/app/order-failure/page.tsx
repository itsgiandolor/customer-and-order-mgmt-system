"use client";

import Link from 'next/link';

export default function OrderFailure() {
  return (
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

      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto px-8 lg:px-12 xl:px-16 py-4 lg:py-8">
        <div className="text-center">
          {/* Failure Animation */}
          <div className="mb-8">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l6 6M9 18V6" />
              </svg>
            </div>
          </div>

          {/* Failure Message */}
          <h1 className="text-4xl font-bold text-red-600 mb-4">Order Failed</h1>
          <p className="text-lg text-gray-600 mb-8">
            We're sorry, but your order could not be processed. Please try again or contact our support team for assistance.
          </p>

          {/* Action Button */}
          <div className="flex justify-center">
            <Link
              href="/catalog"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
            >
              Go Back to Catalog
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
