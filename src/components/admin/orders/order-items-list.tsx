'use client';

import * as React from 'react';
import Image from 'next/image';
import { ShoppingBag, PackageOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CartItem } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export interface OrderItemsListProps {
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  className?: string;
}

export function OrderItemsList({
  items,
  subtotal,
  deliveryFee,
  total,
  className,
}: OrderItemsListProps) {
  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Card className={cn('bg-white border border-candy-line shadow-candy-1', className)}>
      <CardHeader className="pb-3 border-b border-candy-line/60 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-candy-blush text-candy-berry flex items-center justify-center">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-candy-ink font-sans">
              أصناف الطلب ({items.length} صنف / {totalItemsCount} قطعة)
            </CardTitle>
            <p className="text-[11px] text-candy-muted">
              تفاصيل المنتجات والكميات والأوزان المختارة
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {items.length === 0 ? (
          <div className="p-8 text-center text-candy-muted space-y-2">
            <PackageOpen className="w-8 h-8 mx-auto text-candy-muted/60" />
            <p className="text-sm">لا توجد أصناف في هذا الطلب.</p>
          </div>
        ) : (
          <div>
            {/* جدول الأصناف للشاشات المتوسطة والكبيرة */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-right text-xs sm:text-sm font-sans" dir="rtl">
                <thead>
                  <tr className="bg-candy-soft/60 border-b border-candy-line/60 text-candy-muted text-xs">
                    <th scope="col" className="py-3 px-4 font-bold">المنتج</th>
                    <th scope="col" className="py-3 px-4 font-bold text-center">الوزن / الحجم</th>
                    <th scope="col" className="py-3 px-4 font-bold text-center">سعر الوحدة</th>
                    <th scope="col" className="py-3 px-4 font-bold text-center">الكمية</th>
                    <th scope="col" className="py-3 px-4 font-bold text-left">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-candy-line/40">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-candy-soft/30 transition-colors">
                      {/* بيانات المنتج والصورة */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-candy-soft border border-candy-line shrink-0">
                            <Image
                              src={item.imageUrl}
                              alt={item.productName}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <span className="font-bold text-candy-ink block text-sm">
                              {item.productName}
                            </span>
                            <span className="text-[11px] text-candy-muted font-mono">
                              كود: {item.productId}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* الوزن المختار */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block bg-candy-soft text-candy-ink font-medium px-2.5 py-1 rounded-lg text-xs border border-candy-line/60">
                          {item.selectedWeightLabel || item.unit}
                        </span>
                      </td>

                      {/* سعر الوحدة */}
                      <td className="py-3 px-4 text-center font-mono font-semibold text-candy-ink">
                        {item.unitPrice.toFixed(2)} ₪
                      </td>

                      {/* الكمية */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-candy-blush text-candy-berry font-bold text-xs">
                          {item.quantity}
                        </span>
                      </td>

                      {/* إجمالي السطر */}
                      <td className="py-3 px-4 text-left font-mono font-bold text-candy-ink text-sm">
                        {item.lineTotal.toFixed(2)} ₪
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* عرض بطاقات الأصناف على الجوال */}
            <div className="sm:hidden divide-y divide-candy-line/50">
              {items.map((item) => (
                <div key={item.id} className="p-4 flex gap-3 items-center">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-candy-soft border border-candy-line shrink-0">
                    <Image
                      src={item.imageUrl}
                      alt={item.productName}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-candy-ink text-sm truncate">
                      {item.productName}
                    </h4>
                    <div className="text-xs text-candy-muted mt-0.5">
                      <span>{item.selectedWeightLabel || item.unit}</span>
                      <span className="mx-1">•</span>
                      <span className="font-mono">{item.unitPrice.toFixed(2)} ₪</span>
                    </div>
                  </div>
                  <div className="text-left shrink-0">
                    <span className="text-xs text-candy-muted block">× {item.quantity}</span>
                    <span className="font-mono font-bold text-candy-ink text-sm">
                      {item.lineTotal.toFixed(2)} ₪
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* تفصيل الحسابات المالية (الملخص المالي) */}
            <div className="p-4 sm:p-5 bg-candy-soft/50 border-t border-candy-line space-y-2 text-xs sm:text-sm font-sans">
              <div className="flex justify-between items-center text-candy-muted">
                <span>المجموع الفرعي للأصناف</span>
                <span className="font-mono font-semibold text-candy-ink">
                  {subtotal.toFixed(2)} ₪
                </span>
              </div>

              <div className="flex justify-between items-center text-candy-muted">
                <span>رسوم التوصيل</span>
                <span className="font-mono font-semibold text-candy-ink">
                  {deliveryFee.toFixed(2)} ₪
                </span>
              </div>

              <div className="pt-2 border-t border-candy-line/60 flex justify-between items-center">
                <span className="font-bold text-candy-ink text-base">
                  الإجمالي النهائي المطلوب
                </span>
                <span className="font-mono font-black text-candy-berry text-lg sm:text-xl">
                  {total.toFixed(2)} ₪
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
