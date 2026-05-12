"use client";

import { useState } from 'react';
import apiClient from '../api/axiosConfig';

interface AddProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onProductAdded: () => void;
    onError: (message: string) => void;
    onSuccess: (message: string) => void;
}

export default function AddProductModal({
    isOpen,
    onClose,
    onProductAdded,
    onError,
    onSuccess,
}: AddProductModalProps) {
    const [formData, setFormData] = useState({
        product_name: '',
        description: '',
        price: '',
        category: '',
        image_url: '',
        initial_stock: '50',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const categories = ['Clothing & Apparel', 'Home & Living', 'Electronics'];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: '',
            }));
        }
    };

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: '',
            }));
        }
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.product_name.trim()) {
            newErrors.product_name = 'Product name is required';
        }
        if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
            newErrors.price = 'Valid price is required';
        }
        if (!formData.category) {
            newErrors.category = 'Category is required';
        }
        if (formData.initial_stock && (isNaN(parseInt(formData.initial_stock)) || parseInt(formData.initial_stock) < 0)) {
            newErrors.initial_stock = 'Stock must be a non-negative number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const payload = {
                product_name: formData.product_name,
                description: formData.description,
                price: parseFloat(formData.price),
                category: formData.category,
                image_url: formData.image_url || 'https://placehold.co/300x200',
                initial_stock: parseInt(formData.initial_stock) || 50,
                rating: 5.0,
                reviews: '0',
            };

            const response = await apiClient.post('/products', payload);

            if (response.status === 201) {
                onSuccess(`Product "${formData.product_name}" added successfully and synced to inventory!`);

                // Reset form
                setFormData({
                    product_name: '',
                    description: '',
                    price: '',
                    category: '',
                    image_url: '',
                    initial_stock: '50',
                });

                // Notify parent to refresh products
                onProductAdded();
                onClose();
            }
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || 'Failed to add product. Please try again.';
            onError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-40"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-slate-800">Add New Product</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                            aria-label="Close modal"
                        >
                            ×
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        {/* Product Name */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">
                                Product Name *
                            </label>
                            <input
                                type="text"
                                name="product_name"
                                value={formData.product_name}
                                onChange={handleInputChange}
                                placeholder="Enter product name"
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.product_name
                                    ? 'border-red-500 focus:ring-red-200'
                                    : 'border-gray-300 focus:ring-indigo-200'
                                    }`}
                            />
                            {errors.product_name && (
                                <p className="text-red-500 text-xs mt-1">{errors.product_name}</p>
                            )}
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Enter product description"
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none"
                            />
                        </div>

                        {/* Price */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">
                                Price (₱) *
                            </label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleInputChange}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.price
                                    ? 'border-red-500 focus:ring-red-200'
                                    : 'border-gray-300 focus:ring-indigo-200'
                                    }`}
                            />
                            {errors.price && (
                                <p className="text-red-500 text-xs mt-1">{errors.price}</p>
                            )}
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">
                                Category *
                            </label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleSelectChange}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.category
                                    ? 'border-red-500 focus:ring-red-200'
                                    : 'border-gray-300 focus:ring-indigo-200'
                                    }`}
                            >
                                <option value="">Select a category</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </select>
                            {errors.category && (
                                <p className="text-red-500 text-xs mt-1">{errors.category}</p>
                            )}
                        </div>

                        {/* Image URL */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">
                                Image URL
                            </label>
                            <input
                                type="url"
                                name="image_url"
                                value={formData.image_url}
                                onChange={handleInputChange}
                                placeholder="https://example.com/image.jpg"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            />
                            <p className="text-xs text-gray-500 mt-1">Leave empty for placeholder image</p>
                        </div>

                        {/* Initial Stock */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">
                                Initial Stock
                            </label>
                            <input
                                type="number"
                                name="initial_stock"
                                value={formData.initial_stock}
                                onChange={handleInputChange}
                                placeholder="50"
                                min="0"
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.initial_stock
                                    ? 'border-red-500 focus:ring-red-200'
                                    : 'border-gray-300 focus:ring-indigo-200'
                                    }`}
                            />
                            {errors.initial_stock && (
                                <p className="text-red-500 text-xs mt-1">{errors.initial_stock}</p>
                            )}
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        Adding...
                                    </>
                                ) : (
                                    '+ Add Product'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
