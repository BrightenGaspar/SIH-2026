'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, ProductItem, BulkPriceTier } from '@/types/consumer';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: ProductItem, quantityKg?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantityKg: number) => void;
  incrementQuantity: (productId: string, amountKg?: number) => void;
  decrementQuantity: (productId: string, amountKg?: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalItemsCount: number;
  totalWeightKg: number;
  totalQuantityKg: number;
  subtotal: number;
  roadLogisticsFee: number;
  platformFee: number;
  total: number;
  estimatedFarmerRealization: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Hydrate from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('agriflow_consumer_cart');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch {
        setItems([]);
      }
    }
  }, []);

  // Save on change
  useEffect(() => {
    localStorage.setItem('agriflow_consumer_cart', JSON.stringify(items));
  }, [items]);

  const getTierPrice = (product: ProductItem, qty: number): number => {
    if (!product.bulkTiers || product.bulkTiers.length === 0) return product.pricePerKg;
    const matched = product.bulkTiers
      .slice()
      .sort((a: BulkPriceTier, b: BulkPriceTier) => b.minKg - a.minKg)
      .find((tier: BulkPriceTier) => qty >= tier.minKg && (tier.maxKg === null || qty <= tier.maxKg));
    return matched ? matched.pricePerKg : product.pricePerKg;
  };

  const addToCart = (product: ProductItem, quantityKg: number = 1) => {
    setItems(prev => {
      const existingIndex = prev.findIndex(item => item.product.id === product.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantityKg + quantityKg;
        const cappedQty = Math.min(newQty, product.availableQuantityKg);
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantityKg: cappedQty,
          selectedTierPricePerKg: getTierPrice(product, cappedQty),
        };
        return updated;
      } else {
        const initialQty = Math.max(quantityKg, product.minOrderQuantityKg || 1);
        return [
          ...prev,
          {
            product,
            quantityKg: initialQty,
            selectedTierPricePerKg: getTierPrice(product, initialQty),
          }
        ];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantityKg: number) => {
    if (quantityKg <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems(prev => prev.map(item => {
      if (item.product.id === productId) {
        const capped = Math.min(quantityKg, item.product.availableQuantityKg);
        return {
          ...item,
          quantityKg: capped,
          selectedTierPricePerKg: getTierPrice(item.product, capped),
        };
      }
      return item;
    }));
  };

  const incrementQuantity = (productId: string, amountKg: number = 1) => {
    setItems(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = Math.min(item.quantityKg + amountKg, item.product.availableQuantityKg);
        return {
          ...item,
          quantityKg: newQty,
          selectedTierPricePerKg: getTierPrice(item.product, newQty),
        };
      }
      return item;
    }));
  };

  const decrementQuantity = (productId: string, amountKg: number = 1) => {
    setItems(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantityKg - amountKg;
        if (newQty <= 0) return null;
        return {
          ...item,
          quantityKg: newQty,
          selectedTierPricePerKg: getTierPrice(item.product, newQty),
        };
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem('agriflow_consumer_cart');
  };

  // Computed values
  const totalItemsCount = items.length;
  const totalQuantityKg = items.reduce((acc, item) => acc + item.quantityKg, 0);
  const subtotal = items.reduce((acc, item) => acc + (item.quantityKg * item.selectedTierPricePerKg), 0);

  // Road logistics: base ₸40 + ‮1.50/kg, capped for bulk
  const roadLogisticsFee = items.length > 0 
    ? Math.min(50000, Math.round(40 + totalQuantityKg * 1.65))
    : 0;

  const platformFee = items.length > 0 ? Math.max(15, Math.round(subtotal * 0.020)) : 0;
  const total = subtotal + roadLogisticsFee + platformFee;
  const estimatedFarmerRealization = Math.round(subtotal * 0.88);

return (
  <CartContext.Provider value={{
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    incrementQuantity,
    decrementQuantity,
    clearCart,
    totalItems: totalItemsCount,
    totalItemsCount,
    totalWeightKg: totalQuantityKg,
    totalQuantityKg,
    subtotal,
    roadLogisticsFee,
    platformFee,
    total,
    estimatedFarmerRealization,
  }}>
    {children}
  </CartContext.Provider>
);
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
