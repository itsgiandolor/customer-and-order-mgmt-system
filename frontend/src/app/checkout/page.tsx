"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button, Card, Checkbox } from "@heroui/react";
import { useCart } from '../../context/CartContext';
import apiClient from '../../api/axiosConfig';

export default function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [voucher, setVoucher] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('GCash');
  const [deliveryMethod, setDeliveryMethod] = useState('standard');

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    region: '',
    city: '',
    address: '',
    zipCode: '',
  });

  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const shipping = deliveryMethod === 'express' ? 90 : 0;
  const discount = 0; // Calculate based on voucher
  const total = subtotal + shipping - discount;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    // --- Validation ---
    if (!agreedToTerms) { alert('Please agree to the data processing terms'); return; }
    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.email) {
      alert('Please fill in all personal information fields.'); return;
    }
    if (!formData.region || !formData.city || !formData.address || !formData.zipCode) {
      alert('Please fill in all shipping information fields.'); return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) { alert('Please enter a valid email address.'); return; }
    const phoneRegex = /^(09|\+639)\d{9}$/;
    if (!phoneRegex.test(formData.phone)) { alert('Please enter a valid Philippine phone number (e.g. 09171234567).'); return; }

    setLoading(true);
    try {
      // STEP 1: Create the order (this also checks inventory)
      const orderData = {
        customer_info: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          contact_number: formData.phone,
          delivery_address: `${formData.address}, ${formData.city}, ${formData.region} ${formData.zipCode}`,
        },
        order_source: 'web',
        items: cart.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          price: item.price,
        })),
        shipping_fee: shipping,
      };

      const orderResponse = await apiClient.post('/orders', orderData);
      const orderId = orderResponse.data.order.order_id;
      const orderTotal = orderResponse.data.order.total_amount;

      // STEP 2: Confirm payment (simulate for now; replace with real gateway later)
      const paymentData = {
        order_id: orderId,
        payment_method: paymentMethod,  // from your state
        payment_amount: orderTotal,
        payment_status: 'Confirmed',
        transaction_reference: 'TXN-' + Date.now(), // real gateway provides this
      };

      await apiClient.post('/payments/confirm', paymentData);

      clearCart();
      // Redirect to a success page with the order ID
      window.location.href = `/track?order_id=${orderId}&contact=${encodeURIComponent(formData.phone)}`;

    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to place order. Please try again.';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-slate-800 border-b border-white/30 px-6 lg:px-14 py-5">
          <div className="flex items-center justify-between max-w-[1920px] mx-auto">
            <Link href="/" className="text-2xl lg:text-4xl font-bold text-white">
              KAM<span className="text-indigo-500">S</span>
            </Link>
          </div>
        </nav>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
          <h1 className="text-4xl font-semibold text-slate-800 mb-4">Your Cart is Empty</h1>
          <Link href="/catalog" className="text-indigo-600 hover:underline">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <nav className="bg-slate-800 border-b border-white/30 px-6 lg:px-14 py-5">
        <div className="flex items-center justify-between max-w-[1920px] mx-auto">
          <div className="flex items-center gap-8 lg:gap-52">
            <Link href="/" className="text-2xl lg:text-4xl font-bold text-white">
              KAM<span className="text-indigo-500">S</span>
            </Link>
            <div className="hidden md:flex items-center gap-6 lg:gap-24">
              <Link href="/catalog" className="text-white text-base lg:text-xl">Shop</Link>
              <Link href="/track" className="text-white text-base lg:text-xl font-semibold">Track Order</Link>
              <Link href="/cart" className="text-white text-base lg:text-xl">Cart</Link>
              <Link href="#" className="text-white text-base lg:text-xl">About Us</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto px-4 lg:px-8 xl:px-20 py-8 lg:py-12">
        <h1 className="text-3xl lg:text-4xl font-semibold text-black mb-8">Checkout</h1>

        <div className="flex flex-col xl:flex-row gap-8">
          {/* Left Side - Forms */}
          <div className="flex-1 space-y-8">
            {/* Personal Information */}
            <section>
              <h2 className="text-2xl font-medium text-black mb-6">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="border-b border-neutral-300 py-2">
                  <label className="text-sm text-gray-500 block mb-1">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Juan"
                    className="w-full outline-none text-black bg-transparent"
                  />
                </div>
                <div className="border-b border-neutral-300 py-2">
                  <label className="text-sm text-gray-500 block mb-1">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Luna"
                    className="w-full outline-none text-black bg-transparent"
                  />
                </div>
                <div className="border-b border-neutral-300 py-2">
                  <label className="text-sm text-gray-500 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="09171234567"
                    className="w-full outline-none text-black bg-transparent"
                  />
                </div>
                <div className="border-b border-neutral-300 py-2">
                  <label className="text-sm text-gray-500 block mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="JuanLuna@gmail.com"
                    className="w-full outline-none text-black bg-transparent"
                  />
                </div>
              </div>
            </section>

            {/* Shipping Information */}
            <section>
              <h2 className="text-2xl font-medium text-black mb-6">Shipping Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="border-b border-neutral-300 py-2">
                  <label className="text-sm text-gray-500 block mb-1">Region</label>
                  <input
                    type="text"
                    name="region"
                    value={formData.region}
                    onChange={handleInputChange}
                    placeholder="Metro Manila"
                    className="w-full outline-none text-black bg-transparent"
                  />
                </div>
                <div className="border-b border-neutral-300 py-2">
                  <label className="text-sm text-gray-500 block mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Manila"
                    className="w-full outline-none text-black bg-transparent"
                  />
                </div>
                <div className="border-b border-neutral-300 py-2">
                  <label className="text-sm text-gray-500 block mb-1">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="123 Main Street"
                    className="w-full outline-none text-black bg-transparent"
                  />
                </div>
                <div className="border-b border-neutral-300 py-2">
                  <label className="text-sm text-gray-500 block mb-1">Zip Code</label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    placeholder="1000"
                    className="w-full outline-none text-black bg-transparent"
                  />
                </div>
              </div>
            </section>

            {/* Data Consent */}
            <div className="flex items-center gap-3">
              <Checkbox
                isSelected={agreedToTerms}
                onChange={() => setAgreedToTerms(!agreedToTerms)}
              />
              <span className="text-black">I agree to <Link href="#" className="underline">data processing</Link></span>
            </div>

            {/* Delivery Options */}
            <section>
              <h2 className="text-3xl font-medium text-black mb-6">Delivery</h2>
              <div className="space-y-4">
                <label className="flex items-center justify-between border-b border-neutral-300 pb-4 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="delivery"
                      value="standard"
                      checked={deliveryMethod === 'standard'}
                      onChange={(e) => setDeliveryMethod(e.target.value)}
                      className="w-5 h-5 accent-indigo-500"
                    />
                    <div>
                      <div className="text-xl font-medium text-black">Standard Delivery</div>
                      <div className="text-base text-gray-500">Delivery within 5-7 days</div>
                    </div>
                  </div>
                  <span className="text-xl font-medium text-black">Free</span>
                </label>
                <label className="flex items-center justify-between border-b border-neutral-300 pb-4 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="delivery"
                      value="express"
                      checked={deliveryMethod === 'express'}
                      onChange={(e) => setDeliveryMethod(e.target.value)}
                      className="w-5 h-5 accent-indigo-500"
                    />
                    <div>
                      <div className="text-xl font-medium text-black">Express Shipping</div>
                      <div className="text-base text-gray-500">Delivery within 1-3 days</div>
                    </div>
                  </div>
                  <span className="text-xl font-medium text-black">₱90</span>
                </label>
              </div>
            </section>

            {/* Payment Options */}
            <section>
              <h2 className="text-3xl font-medium text-black mb-6">Payment</h2>
              <div className="space-y-4">
                {[
                  { value: 'GCash', label: 'GCash' },
                  { value: 'Maya', label: 'Maya' },
                  { value: 'COD', label: 'Cash on Delivery (COD)' },
                ].map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-3 border-b border-neutral-300 pb-4 cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      value={value}
                      checked={paymentMethod === value}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-5 h-5 accent-indigo-500"
                    />
                    <span className="text-xl font-medium text-black">{label}</span>
                  </label>
                ))}
              </div>
            </section>

            {/* Pay Button */}
            <Button
              onClick={handleSubmit}
              isDisabled={loading || !agreedToTerms}
              className="w-full bg-indigo-500 text-white text-xl font-medium py-4 h-12 rounded-lg data-[disabled=true]:bg-gray-400"
            >
              {loading ? 'Processing...' : 'Pay and Place Order'}
            </Button>
          </div>

          {/* Right Side - Order Summary */}
          <div className="w-full xl:w-[600px]">
            <Card className="rounded-xl border border-neutral-300 shadow-none p-6">
              <h3 className="text-2xl font-medium text-black mb-6">Items ({cart.length})</h3>

              {/* Cart Items */}
              <div className="space-y-6 mb-6">
                {cart.map((item) => (
                  <div key={item.product_id} className="flex items-center gap-4 pb-4 border-b border-neutral-200">
                    <div className="w-24 h-24 bg-neutral-100 rounded-xl flex items-center justify-center">
                      <img src="https://placehold.co/75x53" alt={item.product_name} className="w-20 h-14 object-contain" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xl font-medium text-black">{item.product_name}</p>
                      <p className="text-base text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-2xl font-semibold text-black">₱{item.subtotal.toLocaleString()}</p>
                  </div>
                ))}
              </div>

              {/* Voucher */}
              <div className="flex gap-3 mb-6">
                <input
                  type="text"
                  placeholder="Enter Discount Voucher"
                  value={voucher}
                  onChange={(e) => setVoucher(e.target.value)}
                  className="flex-1 border border-neutral-400 rounded-xl px-4 py-2 text-black outline-none"
                />
                <Button
                  className="bg-indigo-500 text-white font-semibold px-6 rounded-xl"
                >
                  Apply
                </Button>
              </div>

              {/* Summary */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-xl font-medium text-black">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'Free' : `₱${shipping}`}</span>
                </div>
                <div className="flex justify-between text-xl font-medium text-black">
                  <span>Discount</span>
                  <span>₱{discount}</span>
                </div>
              </div>

              <div className="h-px bg-neutral-300 mb-6" />

              <div className="flex justify-between items-center">
                <span className="text-2xl font-medium text-black">Total:</span>
                <span className="text-4xl font-semibold text-black">₱{total.toLocaleString()}</span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
