"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@heroui/react";
import apiClient from '../../api/axiosConfig';
import AddProductModal from '../../components/AddProductModal';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products'>('overview');
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);

  // Fetch all admin data on mount
  useEffect(() => {
    const fetchAdminData = async () => {
      setLoading(true);
      try {
        const [ordersRes, productsRes] = await Promise.all([
          apiClient.get('/orders'),
          apiClient.get('/products') // Gets merged catalog + inventory data
        ]);
        setOrders(ordersRes.data);
        setProducts(productsRes.data);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  // Handlers for Admin Actions
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      // Assuming your route is set up to accept a PATCH or PUT to update status
      await apiClient.put(`/orders/${orderId}/status`, { order_status: newStatus });
      // Update local state instantly to reflect change
      setOrders(orders.map(o => o.order_id === orderId ? { ...o, order_status: newStatus } : o));
    } catch (error) {
      alert("Failed to update order status.");
    }
  };

  const handleDeactivateProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to deactivate this product? It will be removed from the store.")) return;
    try {
      await apiClient.patch(`/products/${productId}/deactivate`);
      // Update local state
      setProducts(products.map(p => p.product_id === productId ? { ...p, is_active: false, current_stock: 0 } : p));
    } catch (error) {
      alert("Failed to deactivate product.");
    }
  };

  const handleProductAdded = async () => {
    // Refresh the products list
    try {
      const response = await apiClient.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to refresh products:', error);
    }
  };

  // Calculated Stats
  const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
  const pendingOrders = orders.filter(o => o.order_status === 'Processing' || o.order_status === 'Pending').length;
  const lowStockProducts = products.filter(p => p.stock_status === 'LOW_STOCK' || p.current_stock === 0).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center flex-col">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-600 font-medium">Loading Admin Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-slate-300 hidden md:flex md:flex-col shrink-0">
        <div className="h-20 flex items-center px-8 border-b border-slate-800">
          <Link href="/" className="text-2xl font-bold text-white tracking-wide">
            KAM<span className="text-indigo-500">S</span> <span className="text-sm font-normal text-slate-400 ml-2">Admin</span>
          </Link>
        </div>
        <nav className="flex-1 py-6 px-4 space-y-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            📊 Dashboard Overview
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'orders' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            📦 Order Management
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'products' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            🏷️ Product Catalog
          </button>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <Link href="/catalog" className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm transition">
            ← Back to Store
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <h1 className="text-2xl font-semibold text-slate-800 capitalize">{activeTab}</h1>
          <div className="flex items-center gap-4">
            <span className="w-10 h-10 bg-indigo-100 text-indigo-700 font-bold rounded-full flex items-center justify-center">AD</span>
          </div>
        </header>

        {/* Scrollable Workspace */}
        <div className="flex-1 overflow-auto p-8">

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-sm font-medium text-slate-500 mb-1">Total Revenue</p>
                  <p className="text-3xl font-bold text-slate-800">₱{totalRevenue.toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-sm font-medium text-slate-500 mb-1">Total Orders</p>
                  <p className="text-3xl font-bold text-slate-800">{orders.length}</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-sm font-medium text-slate-500 mb-1">Pending Orders</p>
                  <p className="text-3xl font-bold text-amber-600">{pendingOrders}</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-sm font-medium text-slate-500 mb-1">Inventory Alerts</p>
                  <p className="text-3xl font-bold text-red-600">{lowStockProducts}</p>
                </div>
              </div>

              {/* Recent Activity Quick View */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-slate-800">Recent Orders</h2>
                  <button onClick={() => setActiveTab('orders')} className="text-sm text-indigo-600 font-medium hover:underline">View All</button>
                </div>
                <div className="p-6">
                  {orders.length === 0 ? <p className="text-slate-500">No orders yet.</p> : (
                    <div className="space-y-4">
                      {orders.slice(0, 5).map(order => (
                        <div key={order.order_id} className="flex justify-between items-center pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                          <div>
                            <p className="font-medium text-slate-800">{order.order_id} - {order.customer_info?.name}</p>
                            <p className="text-sm text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-slate-800">₱{order.total_amount.toLocaleString()}</p>
                            <span className={`text-xs px-2 py-1 rounded-full ${order.order_status === 'Processing' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                              {order.order_status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="px-6 py-4">Order ID</th>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Total</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {orders.map((order) => (
                      <tr key={order.order_id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-indigo-600">{order.order_id}</td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-900">{order.customer_info?.name}</p>
                          <p className="text-xs text-slate-500">{order.customer_info?.email}</p>
                        </td>
                        <td className="px-6 py-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4 font-semibold">₱{order.total_amount.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full 
                            ${order.order_status === 'Processing' ? 'bg-amber-100 text-amber-700' :
                              order.order_status === 'In Transit' ? 'bg-blue-100 text-blue-700' :
                                order.order_status === 'Delivered' ? 'bg-green-100 text-green-700' :
                                  'bg-slate-100 text-slate-700'}`}>
                            {order.order_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <select
                            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2 ml-auto outline-none"
                            value={order.order_status}
                            onChange={(e) => handleUpdateOrderStatus(order.order_id, e.target.value)}
                          >
                            <option value="Processing">Processing</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Ready for Fulfillment">Ready</option>
                            <option value="In Transit">In Transit</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PRODUCTS TAB */}
          {activeTab === 'products' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Product Inventory</h2>
                <Button onClick={() => setIsAddProductModalOpen(true)} className="bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-indigo-700 transition">
                  + Add New Product
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-white border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="px-6 py-4 w-16">Image</th>
                      <th className="px-6 py-4">Product Details</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Price</th>
                      <th className="px-6 py-4">Stock Level</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {products.map((product) => (
                      <tr key={product.product_id} className={`hover:bg-slate-50 transition-colors ${!product.is_active ? 'opacity-50 grayscale' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                            <img src={product.image_url || 'https://placehold.co/100x100'} alt="product" className="w-full h-full object-cover" />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900 truncate max-w-50">{product.product_name}</p>
                          <p className="text-xs text-slate-500">ID: {product.product_id}</p>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{product.category}</td>
                        <td className="px-6 py-4 font-semibold text-indigo-600">₱{product.price}</td>
                        <td className="px-6 py-4">
                          {product.current_stock === null ? (
                            <span className="text-slate-400 text-xs">Syncing...</span>
                          ) : product.current_stock === 0 ? (
                            <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full font-medium">Out of Stock</span>
                          ) : (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full font-medium">{product.current_stock} in stock</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            isDisabled={!product.is_active}
                            onClick={() => handleDeactivateProduct(product.product_id)}
                            className="bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold px-3 py-1.5 rounded-lg data-[disabled=true]:opacity-50"
                          >
                            Deactivate
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={isAddProductModalOpen}
        onClose={() => setIsAddProductModalOpen(false)}
        onProductAdded={handleProductAdded}
        onError={(message) => alert(message)}
        onSuccess={(message) => alert(message)}
      />
    </div>
  );
}