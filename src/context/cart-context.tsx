"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import type { CartItem, CartSummary, Product } from "@/types";
import { STORAGE_KEYS } from "@/lib/storage";

export const CART_STORAGE_KEY = STORAGE_KEYS.CART_ITEMS;

export interface CartContextType {
  items: CartItem[];
  summary: CartSummary;
  selectedZoneId?: string;
  isHydrated: boolean;
  addItem: (
    product: Product,
    quantity?: number,
    selectedWeightMultiplier?: number,
    selectedWeightLabel?: string
  ) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  setDeliveryZone: (zoneId: string, deliveryFee: number) => void;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export interface CartProviderProps {
  children: React.ReactNode;
  initialItems?: CartItem[];
}

export function CartProvider({ children, initialItems }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>(initialItems || []);
  const [selectedZoneId, setSelectedZoneId] = useState<string | undefined>(undefined);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  // Safe client-side hydration check
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const stored = window.localStorage.getItem(CART_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setItems(parsed);
          }
        }
      }
    } catch (error) {
      console.error("[CartContext] Failed to hydrate cart from localStorage:", error);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Synchronize items to localStorage
  useEffect(() => {
    if (!isHydrated) return;
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      }
    } catch (error) {
      console.error("[CartContext] Failed to persist cart to localStorage:", error);
    }
  }, [items, isHydrated]);

  const addItem = useCallback(
    (
      product: Product,
      quantity = 1,
      selectedWeightMultiplier?: number,
      selectedWeightLabel?: string
    ) => {
      const qty = typeof quantity === "number" && quantity > 0 ? Math.floor(quantity) : 1;

      // Find matching weight option from product if available
      const matchedWeight = product.availableWeights?.find((w) => {
        if (selectedWeightMultiplier !== undefined && w.multiplier === selectedWeightMultiplier) {
          if (selectedWeightLabel !== undefined) {
            return w.label === selectedWeightLabel;
          }
          return true;
        }
        if (selectedWeightLabel !== undefined && w.label === selectedWeightLabel) {
          return true;
        }
        return false;
      });

      const finalMultiplier = selectedWeightMultiplier ?? matchedWeight?.multiplier;
      const finalLabel = selectedWeightLabel ?? matchedWeight?.label;

      const basePrice = product.salePrice ?? product.price;
      let unitPrice: number;

      if (matchedWeight) {
        if (
          matchedWeight.multiplier === 1 &&
          product.salePrice !== undefined &&
          product.salePrice < product.price
        ) {
          unitPrice = product.salePrice;
        } else {
          unitPrice = matchedWeight.price;
        }
      } else if (finalMultiplier !== undefined && finalMultiplier > 0) {
        unitPrice = Math.round(basePrice * finalMultiplier * 100) / 100;
      } else {
        unitPrice = basePrice;
      }

      const generatedId =
        finalMultiplier !== undefined
          ? finalLabel
            ? `${product.id}-${finalMultiplier}-${finalLabel}`
            : `${product.id}-${finalMultiplier}`
          : product.id;

      setItems((prevItems) => {
        const existingIndex = prevItems.findIndex((item) => {
          if (item.id === generatedId) return true;
          return (
            item.productId === product.id &&
            (item.selectedWeightMultiplier ?? null) === (finalMultiplier ?? null) &&
            (item.selectedWeightLabel ?? null) === (finalLabel ?? null)
          );
        });

        if (existingIndex > -1) {
          const existingItem = prevItems[existingIndex];
          const newQty = existingItem.quantity + qty;
          const updatedItem: CartItem = {
            ...existingItem,
            quantity: newQty,
            lineTotal: Math.round(existingItem.unitPrice * newQty * 100) / 100,
          };
          const updatedList = [...prevItems];
          updatedList[existingIndex] = updatedItem;
          return updatedList;
        }

        const newItem: CartItem = {
          id: generatedId,
          productId: product.id,
          productName: product.name,
          productSlug: product.slug,
          imageUrl: product.imageUrl,
          unitPrice,
          unit: product.unit,
          selectedWeightMultiplier: finalMultiplier,
          selectedWeightLabel: finalLabel,
          quantity: qty,
          lineTotal: Math.round(unitPrice * qty * 100) / 100,
        };

        return [...prevItems, newItem];
      });
    },
    []
  );

  const removeItem = useCallback((itemId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
      return;
    }

    const validQty = Math.floor(quantity);
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            quantity: validQty,
            lineTotal: Math.round(item.unitPrice * validQty * 100) / 100,
          };
        }
        return item;
      })
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([]));
      } catch (err) {
        console.error("[CartContext] Failed to clear cart items in localStorage:", err);
      }
    }
  }, []);

  const setDeliveryZone = useCallback((zoneId: string, fee: number) => {
    setSelectedZoneId(zoneId);
    setDeliveryFee(typeof fee === "number" && fee >= 0 ? fee : 0);
  }, []);

  const summary = useMemo<CartSummary>(() => {
    const subtotal =
      Math.round(items.reduce((acc, item) => acc + item.lineTotal, 0) * 100) / 100;
    const fee = Math.round((deliveryFee || 0) * 100) / 100;
    const total = Math.round((subtotal + fee) * 100) / 100;
    const itemsCount = items.reduce((acc, item) => acc + item.quantity, 0);

    return {
      subtotal,
      deliveryFee: fee,
      total,
      itemsCount,
      selectedZoneId,
    };
  }, [items, deliveryFee, selectedZoneId]);

  const value = useMemo<CartContextType>(
    () => ({
      items,
      summary,
      selectedZoneId,
      isHydrated,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      setDeliveryZone,
    }),
    [
      items,
      summary,
      selectedZoneId,
      isHydrated,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      setDeliveryZone,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
