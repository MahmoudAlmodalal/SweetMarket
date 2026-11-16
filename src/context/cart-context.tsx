"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import type { CartItem, CartSummary, Product, ProductWeightOption } from "@/types";
import { STORAGE_KEYS } from "@/lib/storage";
import { MAX_CART_QTY } from "@/lib/tokens";
import {
  computeLinePrice,
  getDefaultWeightOption,
  DEFAULT_PACKAGING_OPTION_ID,
  PACKAGING_OPTIONS,
  type PackagingOptionId,
} from "@/lib/pricing";

export const CART_STORAGE_KEY = STORAGE_KEYS.CART_ITEMS;

export interface CartContextType {
  items: CartItem[];
  summary: CartSummary;
  distinctItemsCount: number;
  totalUnitsCount: number;
  selectedZoneId?: string;
  isHydrated: boolean;
  addItem: (
    product: Product,
    quantity?: number,
    selectedWeightMultiplier?: number,
    selectedWeightLabel?: string,
    packagingOptionId?: PackagingOptionId,
    giftMessage?: string
  ) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  restoreCartItems: (items: CartItem[]) => void;
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
            const normalized = parsed.map((item: CartItem) => ({
              ...item,
              packagingOptionId: item.packagingOptionId ?? DEFAULT_PACKAGING_OPTION_ID,
              packagingLabel: item.packagingLabel ?? PACKAGING_OPTIONS[0].label,
              packagingFee: item.packagingFee ?? 0,
            }));
            setItems(normalized);
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
        window.dispatchEvent(new Event("candy_cart_updated"));
      }
    } catch (error) {
      console.error("[CartContext] Failed to persist cart to localStorage:", error);
    }
  }, [items, isHydrated]);

  // Keep the cart badge and other tabs synchronized after cart mutations.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncFromStorage = () => {
      try {
        const stored = window.localStorage.getItem(CART_STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) : [];
        if (Array.isArray(parsed)) setItems(parsed);
      } catch (error) {
        console.error("[CartContext] Failed to sync cart from localStorage:", error);
      }
    };
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === CART_STORAGE_KEY) syncFromStorage();
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const addItem = useCallback(
    (
      product: Product,
      quantity = 1,
      selectedWeightMultiplier?: number,
      selectedWeightLabel?: string,
      packagingOptionId?: PackagingOptionId,
      giftMessage?: string
    ) => {
      const qty = typeof quantity === "number" && quantity > 0 ? Math.floor(quantity) : 1;
      const cleanGiftMessage = giftMessage?.trim() ? giftMessage.trim().slice(0, 120) : undefined;

      // Find matching weight option from product if available
      let matchedWeight: ProductWeightOption | undefined;
      if (product.availableWeights && product.availableWeights.length > 0) {
        if (selectedWeightMultiplier !== undefined) {
          matchedWeight = product.availableWeights.find((w) => {
            if (w.multiplier === selectedWeightMultiplier) {
              if (selectedWeightLabel !== undefined) {
                return w.label === selectedWeightLabel;
              }
              return true;
            }
            return false;
          });
        } else if (selectedWeightLabel !== undefined) {
          matchedWeight = product.availableWeights.find((w) => w.label === selectedWeightLabel);
        }

        if (!matchedWeight) {
          matchedWeight = getDefaultWeightOption(product);
        }
      }

      const finalMultiplier = matchedWeight?.multiplier ?? selectedWeightMultiplier;
      const finalLabel = matchedWeight?.label ?? selectedWeightLabel;

      const resolvedPackagingId: PackagingOptionId =
        packagingOptionId ?? DEFAULT_PACKAGING_OPTION_ID;
      const packagingOption =
        PACKAGING_OPTIONS.find((pkg) => pkg.id === resolvedPackagingId) ?? PACKAGING_OPTIONS[0];

      const pricing = computeLinePrice({
        product,
        weightOption: matchedWeight,
        packagingOptionId: packagingOption.id,
        quantity: qty,
      });

      const generatedId = [
        product.id,
        finalMultiplier !== undefined ? `${finalMultiplier}` : undefined,
        finalLabel ? finalLabel : undefined,
        packagingOption.id !== DEFAULT_PACKAGING_OPTION_ID ? packagingOption.id : undefined,
        cleanGiftMessage ? cleanGiftMessage : undefined,
      ]
        .filter(Boolean)
        .join("-");

      setItems((prevItems) => {
        const existingIndex = prevItems.findIndex((item) => {
          if (item.id === generatedId) return true;
          return (
            item.productId === product.id &&
            (item.selectedWeightMultiplier ?? null) === (finalMultiplier ?? null) &&
            (item.selectedWeightLabel ?? null) === (finalLabel ?? null) &&
            (item.packagingOptionId ?? DEFAULT_PACKAGING_OPTION_ID) === packagingOption.id &&
            (item.giftMessage ?? null) === (cleanGiftMessage ?? null)
          );
        });

        if (existingIndex > -1) {
          const existingItem = prevItems[existingIndex];
          const newQty = Math.min(existingItem.quantity + qty, MAX_CART_QTY);
          const linePricing = computeLinePrice({
            product,
            weightOption: matchedWeight,
            packagingOptionId: packagingOption.id,
            quantity: newQty,
          });
          const updatedItem: CartItem = {
            ...existingItem,
            unitPrice: linePricing.unitPrice,
            listUnitPrice: linePricing.listUnitPrice,
            packagingOptionId: packagingOption.id,
            packagingLabel: packagingOption.label,
            packagingFee: packagingOption.fee,
            giftMessage: cleanGiftMessage ?? existingItem.giftMessage,
            quantity: newQty,
            lineTotal: linePricing.lineTotal,
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
          unitPrice: pricing.unitPrice,
          listUnitPrice: pricing.listUnitPrice,
          packagingOptionId: packagingOption.id,
          packagingLabel: packagingOption.label,
          packagingFee: packagingOption.fee,
          giftMessage: cleanGiftMessage,
          unit: product.unit,
          selectedWeightMultiplier: finalMultiplier,
          selectedWeightLabel: finalLabel,
          quantity: Math.min(qty, MAX_CART_QTY),
          lineTotal: pricing.lineTotal,
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
    // Decrementing at 1 must not silently zero or drop the line.
    // Line removal must be done explicitly via confirmation dialog and removeItem().
    if (quantity < 1) {
      return;
    }

    const validQty = Math.min(Math.floor(quantity), MAX_CART_QTY);
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

  const restoreCartItems = useCallback((itemsToRestore: CartItem[]) => {
    if (!itemsToRestore || itemsToRestore.length === 0) return;
    setItems((prev) => {
      const newItems = itemsToRestore.map((item) => ({
        ...item,
        id: `${item.productId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      }));
      return [...prev, ...newItems];
    });
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
    const totalUnitsCount = items.reduce((acc, item) => acc + item.quantity, 0);
    const distinctItemsCount = items.length;

    return {
      subtotal,
      deliveryFee: fee,
      total,
      itemsCount: totalUnitsCount,
      distinctItemsCount,
      totalUnitsCount,
      selectedZoneId,
    };
  }, [items, deliveryFee, selectedZoneId]);

  const value = useMemo<CartContextType>(
    () => ({
      items,
      summary,
      distinctItemsCount: summary.distinctItemsCount ?? items.length,
      totalUnitsCount: summary.totalUnitsCount ?? items.reduce((acc, item) => acc + item.quantity, 0),
      selectedZoneId,
      isHydrated,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      restoreCartItems,
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
      restoreCartItems,
      setDeliveryZone,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

const defaultCartContext: CartContextType = {
  items: [],
  summary: {
    subtotal: 0,
    deliveryFee: 0,
    total: 0,
    itemsCount: 0,
    distinctItemsCount: 0,
    totalUnitsCount: 0,
    selectedZoneId: undefined,
  },
  distinctItemsCount: 0,
  totalUnitsCount: 0,
  selectedZoneId: undefined,
  isHydrated: false,
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  restoreCartItems: () => {},
  setDeliveryZone: () => {},
};

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    return defaultCartContext;
  }
  return context;
}
