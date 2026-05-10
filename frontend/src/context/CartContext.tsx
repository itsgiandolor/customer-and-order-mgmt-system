"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type CartItem = {
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  subtotal: number;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (product: any) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('kams_cart');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const addToCart = (product: any) => {
    setCart((prevCart) => {
      const existing = prevCart.find(item => item.product_id === product.product_id);
      if (existing) {
        return prevCart.map(item => item.product_id === product.product_id
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
          : item
        );
      }
      return [...prevCart, { ...product, quantity: 1, subtotal: product.price }];
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;
    setCart(prev => prev.map(item => item.product_id === id
      ? { ...item, quantity, subtotal: quantity * item.price }
      : item
    ));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.product_id !== id));
  };

  const clearCart = () => setCart([]);

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('kams_cart', JSON.stringify(cart));
  }, [cart]);

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQuantity, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

// Custom hook to use the cart easily in any file
export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}