"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button, Card, Checkbox } from "@heroui/react";
import { useCart } from '../../context/CartContext';

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart } = useCart();
  const [voucher, setVoucher] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const selectedCartItems = cart.filter(item => selectedItems.includes(item.product_id));
  const subtotal = selectedCartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const discount = 0;
  const total = subtotal - discount;

  const toggleItemSelection = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleQuantityChange = (id: string, newQty: number) => {
    if (newQty >= 1) {
      updateQuantity(id, newQty);
    }
  };

  if (cart.length === 0) {
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
                <Link href="/cart" className="text-white text-base lg:text-xl font-semibold">Cart</Link>
                <Link href="/track" className="text-white text-base lg:text-xl">Track Order</Link>
                <Link href="#" className="text-white text-base lg:text-xl">About Us</Link>
              </div>
            </div>
          </div>
        </nav>

        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
          <h1 className="text-4xl font-semibold text-slate-800 mb-4">Your Cart is Empty</h1>
          <p className="text-slate-500 mb-8">Looks like you haven't added anything yet.</p>
          <Link 
            href="/catalog"
            className="inline-flex items-center justify-center px-6 py-3 bg-indigo-500 text-white font-semibold rounded-lg"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

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
                <Link href="/cart" className="text-white text-base lg:text-xl font-semibold">Cart</Link>
                <Link href="/track" className="text-white text-base lg:text-xl">Track Order</Link>
                <Link href="#" className="text-white text-base lg:text-xl">About Us</Link>
              </div>
            </div>
          </div>
        </nav>

      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto px-6 py-4 lg:py-8">
        <h1 className="text-3xl lg:text-4xl font-semibold text-black mb-6">Shopping Cart</h1>

        <div className="flex flex-col xl:flex-row gap-8">
          {/* Cart Items Table */}
          <Card className="flex-1 rounded-xl border border-black/50 shadow-none">
            <div className="px-3 lg:px-4 pt-2">
              {/* Table Header */}
              <div className="hidden lg:grid grid-cols-12 gap-2 pb-2 border-b border-black/50 text-lg font-semibold text-black">
                <div className="col-span-1"></div>
                <div className="col-span-5">Product</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-2 text-center">Total</div>
                <div className="col-span-1 text-center">Action</div>
              </div>

              {/* Cart Items */}
              <div className="divide-y divide-black/20">
                {cart.map((item, index) => (
                  <div key={item.product_id} className={`py-3 lg:py-4 ${index === cart.length - 1 ? 'pb-0' : ''}`}>
                    {/* Mobile Layout */}
                    <div className="lg:hidden space-y-4">
                      <div className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.product_id)}
                          onChange={() => toggleItemSelection(item.product_id)}
                          className="w-5 h-5 accent-indigo-500 cursor-pointer"
                        />
                        <div className="w-20 h-20 bg-neutral-100 rounded-xl flex items-center justify-center">
                          <img src="https://placehold.co/75x53" alt={item.product_name} className="w-16 h-12 object-contain" />
                        </div>
                        <div>
                          <p className="font-bold text-black">{item.product_name}</p>
                          <p className="text-sm text-gray-500">Color: White</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pl-12">
                        <div className="flex items-center">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="rounded-l-md rounded-r-none h-9 min-w-0 border-black/50"
                            onPress={() => handleQuantityChange(item.product_id, item.quantity - 1)}
                          >
                            -
                          </Button>
                          <div className="w-10 h-9 flex items-center justify-center border-t border-b border-black/50 bg-white text-lg font-medium">
                            {item.quantity}
                          </div>
                          <Button 
                            size="sm" 
                            className="rounded-r-md rounded-l-none h-9 min-w-0 bg-indigo-500 text-white"
                            onPress={() => handleQuantityChange(item.product_id, item.quantity + 1)}
                          >
                            +
                          </Button>
                        </div>
                        <p className="text-xl font-semibold text-black">₱{item.subtotal.toLocaleString()}</p>
                        <button 
                          onClick={() => removeFromCart(item.product_id)}
                          className="p-2 hover:bg-red-50 text-black hover:text-red-500 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden lg:grid grid-cols-12 gap-2 items-center">
                      {/* Checkbox */}
                      <div className="col-span-1 flex justify-center">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.product_id)}
                          onChange={() => toggleItemSelection(item.product_id)}
                          className="w-5 h-5 accent-indigo-500 cursor-pointer"
                        />
                      </div>
                      {/* Product */}
                      <div className="col-span-5 flex items-center gap-4">
                        <div className="w-20 h-20 bg-neutral-100 rounded-xl flex items-center justify-center">
                          <img src="https://placehold.co/75x53" alt={item.product_name} className="w-16 h-12 object-contain" />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-black leading-tight">{item.product_name}</p>
                          <p className="text-sm font-light text-black">Color: White</p>
                        </div>
                      </div>

                      {/* Quantity */}
                      <div className="col-span-2 flex justify-center">
                        <div className="flex items-center">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="rounded-l-md rounded-r-none h-10 w-9 min-w-0 border-black/50"
                            onPress={() => handleQuantityChange(item.product_id, item.quantity - 1)}
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </Button>
                          <div className="w-12 h-10 flex items-center justify-center border-t border-b border-black/50 bg-white text-lg font-medium text-black">
                            {item.quantity}
                          </div>
                          <Button 
                            size="sm" 
                            className="rounded-r-md rounded-l-none h-10 w-9 min-w-0 bg-indigo-500 text-white"
                            onPress={() => handleQuantityChange(item.product_id, item.quantity + 1)}
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </Button>
                        </div>
                      </div>

                      {/* Total */}
                      <div className="col-span-2 text-center">
                        <p className="text-xl font-semibold text-black">₱{item.subtotal.toLocaleString()}</p>
                      </div>

                      {/* Action */}
                      <div className="col-span-1 flex justify-center">
                        <button 
                          onClick={() => removeFromCart(item.product_id)}
                          className="p-1 hover:bg-red-50 text-black hover:text-red-500 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-6" viewBox="0 0 20 24" fill="currentColor">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Order Summary */}
          <Card className="w-full xl:w-[420px] bg-indigo-500 rounded-xl border-none shadow-none shrink-0 self-start">
            <div className="p-6 lg:p-8 text-white">
              <h2 className="text-2xl font-medium mb-8">Order Summary</h2>

              {/* Voucher Input */}
              <div className="flex gap-3 mb-10">
                <input
                  type="text"
                  placeholder="Enter Discount Voucher"
                  value={voucher}
                  onChange={(e) => setVoucher(e.target.value)}
                  className="flex-1 bg-transparent border border-white rounded-[20px] px-4 py-2 text-white placeholder:text-white/70 outline-none"
                />
                <Button 
                  variant="outline" 
                  className="rounded-[20px] border-white text-white font-semibold px-6 py-2 h-auto hover:bg-white/10"
                >
                  Apply
                </Button>
              </div>

              {/* Summary Details */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-medium">Subtotal</span>
                  <span className="text-xl font-medium">₱{subtotal.toLocaleString()}.00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-medium">Shipping</span>
                  <span className="text-xl font-medium">Free</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-medium">Discount (10%)</span>
                  <span className="text-xl font-medium w-16">-₱{discount.toLocaleString()}</span>
                </div>
              </div>

              <div className="h-px bg-white/40 mb-6" />

              {/* Total */}
              <div className="flex justify-between items-center mb-8">
                <span className="text-xl font-medium">Total ({selectedItems.length} items):</span>
                <span className="text-2xl font-semibold">₱{total.toLocaleString()}.00</span>
              </div>

              {/* Checkout Button */}
              <Link 
                href={selectedItems.length > 0 ? `/checkout?selected=${selectedItems.join(',')}` : "#"}
                onClick={(e) => {
                  if (selectedItems.length === 0) {
                    e.preventDefault();
                    alert('Please select at least one item to checkout');
                  }
                }}
                className={`w-full font-semibold rounded-xl py-3 h-12 flex items-center justify-center ${selectedItems.length > 0 ? 'bg-white text-black' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
              >
                Proceed to Checkout
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
