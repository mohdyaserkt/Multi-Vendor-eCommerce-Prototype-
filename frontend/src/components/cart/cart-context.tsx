'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';

interface CartItem {
  id: string;
  productSellerId: string;
  productName: string;
  sellerName: string;
  price: number;
  quantity: number;
  total: number;
}

interface CartContextType {
  cartItems: CartItem[];
  cartTotal: number;
  addToCart: (productSellerId: string, quantity: number) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartTotal, setCartTotal] = useState(0);

  const fetchCart = async () => {
    try {
      if (!isAuthenticated()) {
        
        setCartItems([]);
        setCartTotal(0);
        return;
      }

      const response = await api.get('/cart');
      setCartItems(response.data.items || []);
      setCartTotal(response.data.cartTotal || 0);
    } catch (error: any) {
      if (error.response?.status === 401) {
        //
        setCartItems([]);
        setCartTotal(0);
      } else {
        console.error('Error fetching cart:', error);
      }
    }
  };

  const addToCart = async (productSellerId: string, quantity: number) => {
    await api.post('/cart', { productSellerId, quantity });
    await fetchCart();
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    await api.patch(`/cart/${cartItemId}`, { quantity });
    await fetchCart();
  };

  const removeFromCart = async (cartItemId: string) => {
    await api.delete(`/cart/${cartItemId}`);
    await fetchCart();
  };

  const clearCart = async () => {
    await api.delete('/cart');
    await fetchCart();
  };

  const refreshCart = async () => {
    await fetchCart();
  };

  useEffect(() => {
    fetchCart();
  }, []); // runs only on mount

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartTotal,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
