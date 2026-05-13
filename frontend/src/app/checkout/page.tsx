"use client";

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button, Card, Checkbox } from "@heroui/react";
import { useCart } from '../../context/CartContext';
import apiClient from '../../api/axiosConfig';
import ConfirmModal from '../../components/ConfirmModal';
import OrderSuccessModal from '../../components/OrderSuccessModal';
import Toast from '../../components/Toast';

function CheckoutPageContent() {
  const { cart, clearCart } = useCart();
  const searchParams = useSearchParams();
  const selectedIds = searchParams.get('selected')?.split(',') || [];
  const checkoutItems = selectedIds.length > 0
    ? cart.filter(item => selectedIds.includes(item.product_id))
    : cart;
  const [loading, setLoading] = useState(false);
  const [voucher, setVoucher] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('GCash');
  const [deliveryMethod, setDeliveryMethod] = useState('standard');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const subtotal = checkoutItems.reduce((sum, item) => sum + item.subtotal, 0);
  const shipping = deliveryMethod === 'express' ? 90 : 0;
  const discount = 0;
  const total = subtotal + shipping - discount;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Real-time validation
    validateField(name, value);
  };

  const validateField = (name: string, value: string) => {
    const newErrors: { [key: string]: string } = { ...errors };

    // Clear error when field is cleared
    if (!value.trim()) {
      newErrors[name] = '';
      setErrors(newErrors);
      return;
    }

    switch (name) {
      case 'firstName':
        newErrors.firstName = value.trim() ? '' : 'First name is required';
        break;
      case 'lastName':
        newErrors.lastName = value.trim() ? '' : 'Last name is required';
        break;
      case 'phone':
        if (!/^(09|\+639)\d{9}$/.test(value.replace(/\s/g, ''))) {
          newErrors.phone = 'Invalid Philippine phone number (e.g. 09171234567)';
        } else {
          newErrors.phone = '';
        }
        break;
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = 'Invalid email address';
        } else {
          newErrors.email = '';
        }
        break;
      case 'region':
        newErrors.region = value.trim() ? '' : 'Region is required';
        break;
      case 'city':
        newErrors.city = value.trim() ? '' : 'City is required';
        break;
      case 'address':
        newErrors.address = value.trim() ? '' : 'Address is required';
        break;
      case 'zipCode':
        if (!/^\d+$/.test(value)) {
          newErrors.zipCode = 'Zip code must be numbers only';
        } else {
          newErrors.zipCode = '';
        }
        break;
    }

    setErrors(newErrors);
  };

  const isFormValid = () => {
    const baseValid = (
      formData.firstName.trim() &&
      formData.lastName.trim() &&
      formData.phone.trim() &&
      /^(09|\+639)\d{9}$/.test(formData.phone.replace(/\s/g, '')) &&
      formData.email.trim() &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) &&
      formData.region.trim() &&
      formData.city.trim() &&
      formData.address.trim() &&
      formData.zipCode.trim() &&
      /^\d+$/.test(formData.zipCode) &&
      agreedToTerms
    );

    return baseValid;
  };

  const handleSubmit = () => {
    // Form validation
    const newErrors: any = {};
    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.region) newErrors.region = 'Region is required';
    if (!formData.city) newErrors.city = 'City is required';
    if (!formData.address) newErrors.address = 'Address is required';
    if (!formData.zipCode) newErrors.zipCode = 'Zip code is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!agreedToTerms) { alert('Please agree to data processing terms'); return; }

    // Show confirmation modal
    setShowConfirmModal(true);
  };

  const confirmOrder = async () => {
    setShowConfirmModal(false);
    setLoading(true);

    try {
      // Create order
      const orderData = {
        customer_info: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          contact_number: formData.phone,
          delivery_address: `${formData.address}, ${formData.city}, ${formData.region} ${formData.zipCode}`,
        },
        order_source: 'web',
        items: checkoutItems.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          price: item.price,
        })),
        shipping_fee: shipping,
      };

      console.log('Creating order with data:', orderData);
      const orderResponse = await apiClient.post('/orders', orderData);
      console.log('Order response:', orderResponse.data);
      
      const orderId = orderResponse.data.order.order_id;
      const orderTotal = orderResponse.data.order.total_amount;

      // Submit payment
      const paymentData = {
        order_id: orderId,
        payment_method: paymentMethod,
        payment_amount: orderTotal,
        phone_number: paymentMethod === 'COD' ? null : formData.phone.replace(/\s/g, ''),
      };

      console.log('Submitting payment with data:', paymentData);
      await apiClient.post('/payments/confirm', paymentData);
      console.log('Payment confirmed successfully');

      clearCart();
      setOrderNumber(orderId);

      // Redirect to order success page
      window.location.href = `/order-success?order=${orderId}`;

    } catch (err: any) {
      console.error(err);

      // Redirect to order failure page
      window.location.href = '/order-failure';
    } finally {
      setLoading(false);
    }
  };

  if (checkoutItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <nav className="sticky top-0 z-50 bg-slate-800 border-b border-white/30 px-6 lg:px-14 py-4 shadow-lg">
          <div className="flex items-center justify-between max-w-[1920px] mx-auto">
            <div className="flex items-center gap-8 lg:gap-52">
              <Link href="/" className="text-2xl lg:text-4xl font-bold text-white">
                KAM<span className="text-indigo-500">S</span>
              </Link>
            </div>
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

      <div className="max-w-[1920px] mx-auto px-8 lg:px-12 xl:px-16 py-4 lg:py-8">
        <h1 className="text-3xl lg:text-4xl font-semibold text-black mb-6">Checkout</h1>

        <div className="flex flex-col xl:flex-row gap-8">
          <div className="flex-1 space-y-8">
            <section>
              <h2 className="text-2xl font-medium text-black mb-6">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <div className="border-b border-neutral-300 py-2">
                    <label className="text-sm text-gray-500 block mb-1">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="Juan"
                      className={`w-full outline-none text-black bg-transparent ${errors.firstName ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <div className="border-b border-neutral-300 py-2">
                    <label className="text-sm text-gray-500 block mb-1">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Luna"
                      className={`w-full outline-none text-black bg-transparent ${errors.lastName ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                </div>
                <div>
                  <div className="border-b border-neutral-300 py-2">
                    <label className="text-sm text-gray-500 block mb-1">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="09171234567"
                      className={`w-full outline-none text-black bg-transparent ${errors.phone ? 'border-red-500' : ''}`}
                      pattern="^(09|\+639)\d{9}$"
                    />
                  </div>
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>
                <div>
                  <div className="border-b border-neutral-300 py-2">
                    <label className="text-sm text-gray-500 block mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="JuanLuna@gmail.com"
                      className={`w-full outline-none text-black bg-transparent ${errors.email ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-black mb-6">Shipping Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <div className="border-b border-neutral-300 py-2">
                    <label className="text-sm text-gray-500 block mb-1">Region</label>
                    <input
                      type="text"
                      name="region"
                      value={formData.region}
                      onChange={handleInputChange}
                      placeholder="Metro Manila"
                      className={`w-full outline-none text-black bg-transparent ${errors.region ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.region && <p className="text-red-500 text-sm mt-1">{errors.region}</p>}
                </div>
                <div>
                  <div className="border-b border-neutral-300 py-2">
                    <label className="text-sm text-gray-500 block mb-1">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Manila"
                      className={`w-full outline-none text-black bg-transparent ${errors.city ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                </div>
                <div>
                  <div className="border-b border-neutral-300 py-2">
                    <label className="text-sm text-gray-500 block mb-1">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="123 Main Street"
                      className={`w-full outline-none text-black bg-transparent ${errors.address ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                </div>
                <div>
                  <div className="border-b border-neutral-300 py-2">
                    <label className="text-sm text-gray-500 block mb-1">Zip Code</label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => {
                        // Only allow numbers
                        const numericValue = e.target.value.replace(/\D/g, '');
                        setFormData({ ...formData, zipCode: numericValue });
                        validateField('zipCode', numericValue);
                      }}
                      placeholder="1000"
                      className={`w-full outline-none text-black bg-transparent ${errors.zipCode ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.zipCode && <p className="text-red-500 text-sm mt-1">{errors.zipCode}</p>}
                </div>
              </div>
            </section>

            <div className="flex items-center gap-3">
              <input
                type="radio"
                checked={agreedToTerms}
                onChange={() => setAgreedToTerms(!agreedToTerms)}
                className="w-5 h-5 accent-indigo-500"
              />
              <span className="text-black">I agree to <Link href="#" className="underline">data processing</Link></span>
            </div>

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
                      onChange={(e) => {
                        setPaymentMethod(e.target.value);
                      }}
                      className="w-5 h-5 accent-indigo-500"
                    />
                    <span className="text-xl font-medium text-black">{label}</span>
                  </label>
                ))}
              </div>

              {/* COD Notice */}
              {paymentMethod === 'COD' && (
                <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-800">
                    <strong>Cash on Delivery:</strong> You will pay when the item is delivered to you.
                  </p>
                </div>
              )}
            </section>
          </div>

          <div className="w-full xl:w-150">
            <Card className="rounded-xl border border-neutral-300 shadow-none p-6">
              <h3 className="text-2xl font-medium text-black mb-6">Items ({checkoutItems.length})</h3>

              <div className="space-y-6 mb-6">
                {checkoutItems.map((item: any) => (
                  <div key={item.product_id} className="flex items-center gap-3 pb-3 border-b border-neutral-200">
                    <div className="w-16 h-16 bg-neutral-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {/* Pulls in dynamically spread image_url from Context payload */}
                      <img
                        src={item.image_url || "https://placehold.co/75x53"}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-medium text-black">{item.product_name}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-lg font-semibold text-black">₱{item.subtotal.toLocaleString()}</p>
                  </div>
                ))}
              </div>

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

              <button
                onClick={handleSubmit}
                disabled={loading || !isFormValid()}
                className={`w-full text-white text-xl font-semibold py-4 h-12 rounded-lg transition flex items-center justify-center ${loading || !isFormValid()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-500 hover:bg-indigo-600'
                  }`}
              >
                {loading ? 'Processing...' : 'Pay and Place Order'}
              </button>
            </Card>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        title="Confirm Order"
        message={`Are you sure you want to place this order for ₱${total.toLocaleString()}?`}
        confirmText="Confirm Order"
        cancelText="Cancel"
        onConfirm={confirmOrder}
        onCancel={() => setShowConfirmModal(false)}
      />

      {/* Success Modal */}
      <OrderSuccessModal
        isOpen={showSuccessModal}
        orderNumber={orderNumber}
        onClose={() => window.location.href = '/track'}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={!!toast}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p>Loading...</p></div>}>
      <CheckoutPageContent />
    </Suspense>
  );
}