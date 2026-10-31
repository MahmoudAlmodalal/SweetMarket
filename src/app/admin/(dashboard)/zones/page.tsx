'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Plus,
  Search,
  DollarSign,
  Truck,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAdminAuth } from '@/context/admin-auth-context';
import { ZonesTable, ZoneEditDialog, type ZoneFormData } from '@/components/admin/zones';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/toast';
import {
  STORAGE_KEYS,
  getStorageItem,
  setStorageItem,
} from '@/lib/storage';
import { MOCK_DELIVERY_ZONES } from '@/data/mock/zones';
import { MOCK_ORDERS } from '@/data/mock/orders';
import type { DeliveryZone, Order } from '@/types';

export default function AdminZonesPage() {
  const { user, isManager } = useAdminAuth();

  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // حالة نافذة إضافة / تعديل المنطقة
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);

  // حالة نافذة تأكيد الحذف
  const [deleteTarget, setDeleteTarget] = useState<DeliveryZone | null>(null);

  // استرجاع مناطق التوصيل والطلبات
  const loadData = useCallback(() => {
    setIsLoading(true);
    try {
      // 1. مناطق التوصيل (جميع المناطق النشطة وغير النشطة)
      const storedZones = getStorageItem(STORAGE_KEYS.MOCK_ZONES, null);
      if (storedZones && storedZones.length > 0) {
        setZones(storedZones);
      } else {
        setStorageItem(STORAGE_KEYS.MOCK_ZONES, MOCK_DELIVERY_ZONES);
        setZones(MOCK_DELIVERY_ZONES);
      }

      // 2. الطلبات (لحساب الطلبات النشطة في كل منطقة وفحص EC-09)
      const storedOrders = getStorageItem(STORAGE_KEYS.MOCK_ORDERS, null);
      if (storedOrders && storedOrders.length > 0) {
        setOrders(storedOrders);
      } else {
        setStorageItem(STORAGE_KEYS.MOCK_ORDERS, MOCK_ORDERS);
        setOrders(MOCK_ORDERS);
      }
    } catch (err) {
      console.error('Failed to load zones or orders:', err);
      toast.error('حدث خطأ أثناء تحميل بيانات مناطق التوصيل');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // حساب الطلبات النشطة (التي لم تُسلَّم ولم تُتلغَ بعد) لكل منطقة توصيل
  const activeOrdersCountByZone = useMemo(() => {
    const counts: Record<string, number> = {};
    const activeStatuses = ['new', 'accepted', 'in_preparation', 'out_for_delivery'];

    for (const order of orders) {
      if (activeStatuses.includes(order.status) && order.customer?.zoneId) {
        counts[order.customer.zoneId] = (counts[order.customer.zoneId] || 0) + 1;
      }
    }
    return counts;
  }, [orders]);

  // حفظ المناطق في التخزين المحلي وتحديث الحالة فوراً (BR-003, FR-014)
  const persistZones = (updated: DeliveryZone[]) => {
    setZones(updated);
    setStorageItem(STORAGE_KEYS.MOCK_ZONES, updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
  };

  // فلترة المناطق بالبحث
  const filteredZones = useMemo(() => {
    if (!searchQuery.trim()) return zones;
    const q = searchQuery.trim().toLowerCase();
    return zones.filter((z) => z.name.toLowerCase().includes(q));
  }, [zones, searchQuery]);

  // حفظ منطقة (إنشاء جديد أو تعديل حالي)
  const handleSaveZone = async (data: ZoneFormData) => {
    if (!isManager) {
      toast.error('عذراً، تعديل مناطق ورسوم التوصيل مخصص لمدير النظام فقط');
      return;
    }

    if (data.id) {
      // تعديل منطقة حالية
      const updated = zones.map((z) => {
        if (z.id === data.id) {
          return {
            ...z,
            name: data.name,
            deliveryFee: data.deliveryFee,
            minOrderAmount: data.minOrderAmount,
            estimatedTimeMin: data.estimatedTimeMin,
            estimatedTimeMax: data.estimatedTimeMax,
            isActive: data.isActive,
          };
        }
        return z;
      });

      persistZones(updated);
      toast.success(
        `تم تحديث منطقة "${data.name}" بنجاح`,
        'تم تطبيق الرسوم الجديدة فوراً على صفحة إتمام الطلب'
      );
    } else {
      // إضافة منطقة جديدة
      const newZone: DeliveryZone = {
        id: `zone-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: data.name,
        deliveryFee: data.deliveryFee,
        minOrderAmount: data.minOrderAmount,
        estimatedTimeMin: data.estimatedTimeMin,
        estimatedTimeMax: data.estimatedTimeMax,
        isActive: data.isActive,
      };

      const updated = [...zones, newZone];
      persistZones(updated);
      toast.success(`تمت إضافة منطقة التوصيل "${data.name}" بنجاح`);
    }
  };

  // تبديل حالة تفعيل المنطقة
  const handleToggleActive = (zone: DeliveryZone) => {
    if (!isManager) {
      toast.error('فقط المدير يملك صلاحية تفعيل أو تعطيل مناطق التوصيل');
      return;
    }

    const updated = zones.map((z) =>
      z.id === zone.id ? { ...z, isActive: !z.isActive } : z
    );
    persistZones(updated);
    toast.info(
      zone.isActive
        ? `تم تعطيل منطقة "${zone.name}" وإيقاف استقبال طلبات التوصيل إليها مؤقتاً`
        : `تم تفعيل منطقة "${zone.name}" وإتاحة التوصيل إليها في المتجر`
    );
  };

  // طلب حذف منطقة توصيل مع فحص قواعد العمل (EC-09)
  const handleDeleteRequest = (zone: DeliveryZone) => {
    if (!isManager) {
      toast.error('فقط المدير يملك صلاحية حذف مناطق التوصيل');
      return;
    }

    const activeCount = activeOrdersCountByZone[zone.id] ?? 0;
    if (activeCount > 0) {
      toast.error(
        'لا يمكن حذف منطقة مرتبطة بطلبات نشطة',
        `يوجد ${activeCount} طلبات نشطة حالياً في هذه المنطقة (EC-09). يمكنك تعطيل المنطقة بدلاً من حذفها.`
      );
      return;
    }

    setDeleteTarget(zone);
  };

  // تأكيد الحذف النهائي
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    const targetName = deleteTarget.name;
    const updated = zones.filter((z) => z.id !== deleteTarget.id);
    persistZones(updated);
    setDeleteTarget(null);
    toast.success(`تم حذف منطقة "${targetName}" بنجاح`);
  };

  // إحصائيات سريعة
  const totalZones = zones.length;
  const activeZones = zones.filter((z) => z.isActive).length;
  const freeZones = zones.filter((z) => z.deliveryFee === 0).length;
  const avgFee =
    totalZones > 0
      ? (zones.reduce((sum, z) => sum + z.deliveryFee, 0) / totalZones).toFixed(1)
      : '0';

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12" dir="rtl">
      {/* مسار التصفح (Breadcrumb) */}
      <nav aria-label="مسار التصفح" className="flex items-center gap-2 text-xs text-candy-muted font-sans">
        <Link href="/admin/orders" className="hover:text-candy-berry transition-colors">
          لوحة الإدارة
        </Link>
        <span>/</span>
        <span className="font-bold text-candy-ink">مناطق التوصيل (SCR-18)</span>
      </nav>

      {/* ترويسة الصفحة مع زر الإضافة */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-candy-soft border border-candy-blush text-candy-berry flex items-center justify-center shadow-candy-1 shrink-0">
              <MapPin className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl sm:text-2xl text-candy-ink">
                مناطق التوصيل والرسوم
              </h1>
              <p className="font-sans text-xs sm:text-sm text-candy-muted mt-0.5">
                تحديد المحافظات والمدن المتاحة وتكلفة التوصيل بالشيكل (ILS ₪) والحد الأدنى للطلب (SCR-18)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              setSelectedZone(null);
              setDialogOpen(true);
            }}
            disabled={!isManager}
            leftIcon={<Plus className="w-4 h-4" />}
            className="shadow-candy-cta font-sans font-bold"
          >
            إضافة منطقة جديدة
          </Button>
        </div>
      </div>

      {/* تنبيه صلاحيات الموظف (إذا كان المستخدم موظفاً وليس مديراً) */}
      {!isManager && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 text-xs sm:text-sm font-sans"
        >
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <span className="font-bold block">وضع العرض فقط (صلاحية موظف تشغيل)</span>
            <p className="text-amber-800 text-xs">
              أنت مسجل حالياً بحساب موظف، تعديل رسوم التوصيل والحد الأدنى للمناطق مخصص لمدير النظام (FR-013).
            </p>
          </div>
        </div>
      )}

      {/* شريط الإحصائيات السريعة */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
        <Card elevation="sm" className="border-candy-line">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-candy-muted font-sans block mb-1">
                إجمالي المناطق
              </span>
              <span className="font-display font-bold text-2xl text-candy-ink">
                {totalZones}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-candy-soft border border-candy-blush text-candy-berry flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card elevation="sm" className="border-candy-line">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-candy-muted font-sans block mb-1">
                المناطق المفعّلة
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-2xl text-emerald-700">
                  {activeZones}
                </span>
                <span className="text-xs text-candy-muted">من {totalZones}</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card elevation="sm" className="border-candy-line">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-candy-muted font-sans block mb-1">
                متوسط رسوم التوصيل
              </span>
              <span className="font-display font-bold text-2xl text-candy-ink font-mono">
                {avgFee} <span className="font-sans text-xs text-candy-muted">₪</span>
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-candy-soft border border-candy-blush text-candy-berry flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card elevation="sm" className="border-candy-line">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-candy-muted font-sans block mb-1">
                توصيل مجاني (0 ₪)
              </span>
              <span className="font-display font-bold text-2xl text-candy-berry">
                {freeZones}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-candy-soft border border-candy-blush text-candy-berry flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* شريط البحث والتحديث */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="البحث باسم المنطقة أو المدينة..."
            iconPrefix={<Search className="w-4 h-4 text-candy-muted" />}
            className="text-xs sm:text-sm bg-white"
          />
        </div>

        <button
          type="button"
          onClick={loadData}
          title="إعادة تحميل المناطق"
          className="p-2.5 rounded-xl border border-candy-line bg-white hover:bg-candy-soft text-candy-muted hover:text-candy-berry transition-colors text-xs flex items-center gap-1.5 font-sans"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline">تحديث</span>
        </button>
      </div>

      {/* جدول وبطاقات مناطق التوصيل */}
      <section aria-label="مناطق التوصيل والرسوم">
        <ZonesTable
          zones={filteredZones}
          activeOrdersCountByZone={activeOrdersCountByZone}
          onEdit={(zone) => {
            setSelectedZone(zone);
            setDialogOpen(true);
          }}
          onDelete={handleDeleteRequest}
          onToggleActive={handleToggleActive}
          onAddNew={() => {
            setSelectedZone(null);
            setDialogOpen(true);
          }}
          isLoading={isLoading}
          canManage={isManager}
        />
      </section>

      {/* نافذة إضافة / تعديل المنطقة */}
      <ZoneEditDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        zone={selectedZone}
        existingZones={zones}
        onSave={handleSaveZone}
      />

      {/* نافذة تأكيد حذف المنطقة */}
      {deleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="fixed inset-0 bg-candy-ink/40 backdrop-blur-sm"
            onClick={() => setDeleteTarget(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white border border-candy-line shadow-candy-3 p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-display font-bold text-lg text-candy-ink">
                تأكيد حذف منطقة التوصيل
              </h3>
              <p className="font-sans text-xs text-candy-muted">
                هل أنت متأكد من حذف منطقة{' '}
                <span className="font-bold text-candy-ink">"{deleteTarget.name}"</span>؟
                لن يتمكن الزبائن من طلب التوصيل إليها بعد الحذف.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDeleteTarget(null)}
                className="flex-1"
              >
                إلغاء
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={handleConfirmDelete}
                className="flex-1"
              >
                تأكيد الحذف
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
