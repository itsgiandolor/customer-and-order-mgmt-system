"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { Button, Card } from "@heroui/react";
import apiClient from '../../api/axiosConfig';

interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface Order {
  order_id: string;
  customer_name?: string;
  customer_info?: {
    name: string;
    contact_number: string;
  };
  payment_status: string;
  order_status: string;
  total_amount: number;
  items: OrderItem[];
  delivery_address?: string;
  createdAt: string;
}

const orderStatusSteps = [
  { status: "Processing", label: "Order Placed", icon: "📝" },
  { status: "Confirmed", label: "Confirmed", icon: "✅" },
  { status: "Ready for Fulfillment", label: "Ready to Ship", icon: "📦" },
  { status: "In Transit", label: "In Transit", icon: "🚚" },
  { status: "Delivered", label: "Delivered", icon: "🏠" },
];

function TrackOrderPageInner() {
  const [contactNumber, setContactNumber] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const searchParams = useSearchParams();

  // Load from URL params on mount, fallback to localStorage
  useEffect(() => {
    const urlContact = searchParams.get('contact');
    const urlOrderId = searchParams.get('order_id');
    const savedContact = urlContact || localStorage.getItem('customerContact');

    if (savedContact) {
      setContactNumber(savedContact);
      fetchOrders(savedContact);
    }
  }, []);

  const fetchOrders = async (contact: string) => {
    if (!contact) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const response = await apiClient.get(`/orders/customer/${encodeURIComponent(contact)}`);
      setOrders(response.data);
      localStorage.setItem('customerContact', contact);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch orders.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactNumber) {
      setError("Please enter your contact number");
      return;
    }
    fetchOrders(contactNumber);
  };

  const selectOrder = (order: Order) => {
    setSelectedOrder(order);
  };

  const clearSelection = () => {
    setSelectedOrder(null);
  };

  const getCurrentStep = (status: string) => {
    const index = orderStatusSteps.findIndex(step => step.status === status);
    return index === -1 ? 0 : index;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered": return "text-green-600 bg-green-100";
      case "In Transit": return "text-blue-600 bg-blue-100";
      case "Cancelled": return "text-red-600 bg-red-100";
      case "Rejected": return "text-red-600 bg-red-100";
      default: return "text-amber-600 bg-amber-100";
    }
  };

  // Filter in-transit orders
  const inTransitOrders = orders.filter(o => o.order_status === "In Transit" || o.order_status === "Confirmed" || o.order_status === "Ready for Fulfillment");
  const otherOrders = orders.filter(o => !inTransitOrders.includes(o));

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
              <Link href="/track" className="text-white text-base lg:text-xl font-semibold">Track Order</Link>
              <Link href="#" className="text-white text-base lg:text-xl">About Us</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-12">
        <h1 className="text-4xl font-semibold text-black mb-2">Track Your Order</h1>
        <p className="text-gray-500 mb-8">Enter your contact number to see your orders</p>

        {/* Search Form */}
        <Card className="rounded-xl border border-gray-200 shadow-none p-6 mb-8">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 block mb-2">Contact Number</label>
              <input
                type="text"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="e.g., 09171234567"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                isDisabled={loading}
                className="bg-indigo-600 text-white font-semibold py-3 px-8 rounded-lg"
              >
                {loading ? 'Searching...' : 'Find My Orders'}
              </Button>
            </div>
          </form>
          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg mt-4">{error}</div>
          )}
        </Card>

        {selectedOrder ? (
          /* Selected Order Details View */
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-4">
              <Button
                onClick={clearSelection}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg"
              >
                ← Back to Orders
              </Button>
            </div>

            {/* Order Header */}
            <Card className="rounded-xl border border-gray-200 shadow-none p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Order ID</p>
                  <p className="text-xl font-bold text-black">{selectedOrder.order_id}</p>
                </div>
                <div className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(selectedOrder.order_status)}`}>
                  {selectedOrder.order_status}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Customer</p>
                  <p className="font-medium text-black">{selectedOrder.customer_info?.name || selectedOrder.customer_name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Order Date</p>
                  <p className="font-medium text-black">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Payment</p>
                  <p className="font-medium text-black">{selectedOrder.payment_status}</p>
                </div>
                <div>
                  <p className="text-gray-500">Total</p>
                  <p className="font-medium text-indigo-600">₱{selectedOrder.total_amount.toLocaleString()}</p>
                </div>
              </div>
            </Card>

            {/* Progress Tracker */}
            <Card className="rounded-xl border border-gray-200 shadow-none p-6">
              <h3 className="text-lg font-semibold text-black mb-6">Order Progress</h3>
              <div className="relative">
                <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 rounded">
                  <div
                    className="h-full bg-indigo-500 rounded transition-all duration-500"
                    style={{ width: `${(getCurrentStep(selectedOrder.order_status) / (orderStatusSteps.length - 1)) * 100}%` }}
                  />
                </div>
                <div className="relative flex justify-between">
                  {orderStatusSteps.map((step, index) => {
                    const currentStep = getCurrentStep(selectedOrder.order_status);
                    const isCompleted = index <= currentStep;
                    const isCurrent = index === currentStep;
                    return (
                      <div key={step.status} className="flex flex-col items-center">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-lg mb-2 z-10 transition-colors ${isCompleted ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-400'
                            } ${isCurrent ? 'ring-4 ring-indigo-200' : ''}`}
                        >
                          {isCompleted ? '✓' : step.icon}
                        </div>
                        <span className={`text-xs text-center max-w-[80px] ${isCompleted ? 'text-black font-medium' : 'text-gray-400'}`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            {/* Order Items */}
            <Card className="rounded-xl border border-gray-200 shadow-none p-6">
              <h3 className="text-lg font-semibold text-black mb-4">Order Items</h3>
              <div className="space-y-4">
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
                    <div className="w-16 h-16 bg-neutral-100 rounded-lg flex items-center justify-center">
                      <img src="https://placehold.co/60x60" alt={item.product_name} className="w-12 h-12 object-contain" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-black">{item.product_name}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity} × ₱{item.price.toLocaleString()}</p>
                    </div>
                    <p className="font-semibold text-black">₱{item.subtotal.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ) : (
          /* Orders List View */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: In Transit Orders */}
            <div className="lg:col-span-2 space-y-6">
              {/* Active Orders Section */}
              <div>
                <h2 className="text-2xl font-semibold text-black mb-4 flex items-center gap-2">
                  <span className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span>
                  Active Orders ({inTransitOrders.length})
                </h2>

                {inTransitOrders.length === 0 ? (
                  <Card className="rounded-xl border border-gray-200 shadow-none p-8 text-center">
                    <div className="text-5xl mb-4">🚚</div>
                    <p className="text-gray-500">No orders currently in transit</p>
                    <Link href="/catalog" className="text-indigo-600 hover:underline mt-2 inline-block">
                      Start shopping →
                    </Link>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {inTransitOrders.map((order) => (
                      <Card
                        key={order.order_id}
                        onClick={() => selectOrder(order)}
                        className="rounded-xl border border-gray-200 shadow-none p-5 cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-sm text-gray-500">Order ID</p>
                            <p className="font-bold text-black">{order.order_id}</p>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.order_status)}`}>
                            {order.order_status}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex-1">
                            <p className="text-gray-500">Items</p>
                            <p className="font-medium text-black">{order.items.length} items</p>
                          </div>
                          <div className="flex-1">
                            <p className="text-gray-500">Order Date</p>
                            <p className="font-medium text-black">{new Date(order.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-500">Total</p>
                            <p className="font-semibold text-indigo-600">₱{order.total_amount.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span>🚚</span>
                              <span>Click to track this order</span>
                            </div>
                            <span className="text-indigo-600 text-sm font-medium">View Details →</span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Other Orders Section */}
              {otherOrders.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-700 mb-4">Other Orders ({otherOrders.length})</h2>
                  <div className="space-y-3">
                    {otherOrders.slice(0, 5).map((order) => (
                      <Card
                        key={order.order_id}
                        onClick={() => selectOrder(order)}
                        className="rounded-xl border border-gray-200 shadow-none p-4 cursor-pointer hover:border-gray-400 transition-all opacity-75 hover:opacity-100"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-black">{order.order_id}</p>
                            <p className="text-sm text-gray-500">{order.items.length} items • {new Date(order.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.order_status)}`}>
                              {order.order_status}
                            </span>
                            <span className="font-semibold text-black">₱{order.total_amount.toLocaleString()}</span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Help Section */}
            <div className="space-y-6">
              <Card className="rounded-xl border border-gray-200 shadow-none p-6">
                <h3 className="font-semibold text-black mb-4">Need Help?</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">📧</div>
                    <div>
                      <p className="font-medium text-black">Email Support</p>
                      <p className="text-sm text-gray-500">support@kams.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">📞</div>
                    <div>
                      <p className="font-medium text-black">Phone Support</p>
                      <p className="text-sm text-gray-500">+63 2 8123 4567</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">💬</div>
                    <div>
                      <p className="font-medium text-black">Live Chat</p>
                      <p className="text-sm text-gray-500">9AM - 6PM</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="rounded-xl border border-gray-200 shadow-none p-6 bg-indigo-50">
                <h3 className="font-semibold text-indigo-900 mb-2">Quick Tip</h3>
                <p className="text-sm text-indigo-700">
                  Your contact number is saved for convenience. You can track all your orders by entering the same phone number used during checkout.
                </p>
              </Card>
            </div>
          </div>
        )}

        {/* Empty State */}
        {searched && !loading && orders.length === 0 && !error && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-black mb-2">No Orders Found</h3>
            <p className="text-gray-500 mb-4">We couldn't find any orders for this contact number</p>
            <Link href="/catalog" className="text-indigo-600 hover:underline">
              Start Shopping →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center">Loading...</div>}>
      <TrackOrderPageInner />
    </Suspense>
  );
}
