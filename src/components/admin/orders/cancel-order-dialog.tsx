'use client';

import * as React from 'react';
import { AlertTriangle, XCircle, ShieldAlert, Check } from 'lucide-react';
import type { AdminRole } from '@/types';
import { CancelOrderSchema } from '@/lib/validations';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export interface CancelOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmCancel: (reason: string) => Promise<void>;
  orderNumber?: string;
  userRole: AdminRole;
  isSubmitting?: boolean;
}

// أسباب شائعة مقترحة لتسهيل تدوين السبب بسرعة للمدير
const COMMON_REASONS = [
  'الزبون تراجع عن الطلب برغبته',
  'نفاد بعض أصناف الحلويات المطلوبة من المعمل',
  'تعذر الاتصال بالزبون لتأكيد العنوان والموقع',
  'عنوان التوصيل خارج النطاق الجغرافي المتاح',
];

export function CancelOrderDialog({
  isOpen,
  onClose,
  onConfirmCancel,
  orderNumber,
  userRole,
  isSubmitting = false,
}: CancelOrderDialogProps) {
  const [reason, setReason] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = React.useState(false);

  const isManager = userRole === 'manager';

  // إعادة ضبط الحالة عند فتح وإغلاق النافذة
  React.useEffect(() => {
    if (isOpen) {
      setReason('');
      setError(null);
      setHasInteracted(false);
    }
  }, [isOpen]);

  const handleReasonChange = (value: string) => {
    setReason(value);
    if (hasInteracted) {
      const result = CancelOrderSchema.safeParse({ reason: value.trim() });
      if (!result.success) {
        setError(result.error.issues[0]?.message || 'السبب قصير جداً');
      } else {
        setError(null);
      }
    }
  };

  const handlePresetSelect = (preset: string) => {
    setReason(preset);
    setError(null);
    setHasInteracted(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasInteracted(true);

    const trimmed = reason.trim();
    const result = CancelOrderSchema.safeParse({ reason: trimmed });

    if (!result.success) {
      setError(result.error.issues[0]?.message || 'يجب كتابة سبب الإلغاء (5 أحرف على الأقل)');
      return;
    }

    setError(null);
    await onConfirmCancel(trimmed);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="max-w-md sm:max-w-lg p-6">
        {!isManager ? (
          // في حال حاول موظف الوصول بدون صلاحية مدير (FR-018)
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-candy-ink">
                إلغاء الطلب محصور بالمدير
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm text-candy-muted">
                وفق سياسة المتجر وقاعدة العمل (FR-018)، فقط مدير النظام مخوّل بإلغاء الطلبات وتوثيق السبب.
              </DialogDescription>
            </div>
            <DialogFooter className="justify-center sm:justify-center">
              <Button type="button" variant="secondary" onClick={onClose}>
                إغلاق
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-right" dir="rtl">
            <DialogHeader className="space-y-2">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <DialogTitle className="text-lg sm:text-xl font-bold font-sans">
                  إلغاء الطلب {orderNumber ? `(${orderNumber})` : ''}
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs sm:text-sm text-candy-muted leading-relaxed">
                هل أنت متأكد من رغبتك في إلغاء هذا الطلب؟ هذا الإجراء نهائي وسيتم توثيق السبب واسم المدير في سجل تدقيق الطلب (FR-018).
              </DialogDescription>
            </DialogHeader>

            {/* الأسباب المقترحة السريعة */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-candy-ink block">
                أسباب سريعة مقترحة:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_REASONS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handlePresetSelect(preset)}
                    className="text-[11px] font-sans px-2.5 py-1 rounded-full border border-candy-line bg-candy-soft/70 hover:bg-candy-blush/60 hover:border-candy-rose text-candy-ink transition-colors flex items-center gap-1"
                  >
                    {reason === preset && <Check className="w-3 h-3 text-candy-berry" />}
                    <span>{preset}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* حقل سبب الإلغاء الإلزامي */}
            <div className="space-y-1">
              <Textarea
                id="cancel-reason"
                label="سبب الإلغاء (إلزامي)*"
                rows={3}
                placeholder="اكتب سبب إلغاء الطلب هنا بالتفصيل (5 أحرف على الأقل)..."
                value={reason}
                disabled={isSubmitting}
                onChange={(e) => handleReasonChange(e.target.value)}
                error={error || undefined}
                helperText="يجب ألا يقل السبب عن 5 أحرف لضمان توثيق الحالات في السجل."
                className="text-sm"
              />
              <div className="flex justify-between items-center text-[11px] text-candy-muted px-1">
                <span>الحد الأدنى: 5 أحرف</span>
                <span>{reason.trim().length} حرف</span>
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-candy-line/60 flex flex-col-reverse sm:flex-row gap-2 justify-end">
              <Button
                type="button"
                variant="ghost"
                size="md"
                disabled={isSubmitting}
                onClick={onClose}
              >
                تراجع
              </Button>
              <Button
                type="submit"
                variant="danger"
                size="md"
                disabled={isSubmitting}
                isLoading={isSubmitting}
                leftIcon={<XCircle className="w-4 h-4" />}
              >
                تأكيد إلغاء الطلب
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
