'use client';

import * as React from 'react';
import { AlertTriangle, Check, ShieldAlert } from 'lucide-react';
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

export interface UndeliveredOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmUndelivered: (reason: string) => Promise<void>;
  orderNumber?: string;
  userRole: AdminRole;
  isSubmitting?: boolean;
}

const COMMON_REASONS = [
  'تعذر التواصل مع الزبون عند الوصول',
  'عنوان التوصيل غير واضح أو خارج النطاق',
  'لم يكن الزبون متاحاً لاستلام الطلب',
];

export function UndeliveredOrderDialog({
  isOpen,
  onClose,
  onConfirmUndelivered,
  orderNumber,
  userRole,
  isSubmitting = false,
}: UndeliveredOrderDialogProps) {
  const [reason, setReason] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = React.useState(false);
  const isManager = userRole === 'manager' || userRole === 'admin';

  React.useEffect(() => {
    if (isOpen) {
      setReason('');
      setError(null);
      setHasInteracted(false);
    }
  }, [isOpen]);

  const validate = (value: string) => {
    const result = CancelOrderSchema.safeParse({ reason: value.trim() });
    return result.success ? null : result.error.issues[0]?.message || 'اكتب سبباً واضحاً (5 أحرف على الأقل)';
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setHasInteracted(true);
    const trimmed = reason.trim();
    const validationError = validate(trimmed);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    await onConfirmUndelivered(trimmed);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="max-w-md sm:max-w-lg p-6">
        {!isManager ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 mx-auto flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-candy-ink">هذا الإجراء محصور بالمدير</DialogTitle>
              <DialogDescription className="mt-2 text-sm text-candy-muted">
                لا يمكن تسجيل تعذر التسليم دون صلاحية مدير وتدوين السبب في سجل الطلب.
              </DialogDescription>
            </div>
            <DialogFooter className="justify-center sm:justify-center">
              <Button type="button" variant="secondary" onClick={onClose}>إغلاق</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-right" dir="rtl">
            <DialogHeader className="space-y-2">
              <div className="flex items-center gap-2 text-amber-700">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <DialogTitle className="text-lg sm:text-xl font-bold font-sans">
                  تسجيل تعذر التسليم {orderNumber ? `(${orderNumber})` : ''}
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs sm:text-sm text-candy-muted leading-relaxed">
                سجّل سبباً واضحاً قبل حفظ الحالة؛ سيظهر السبب واسم المدير في سجل الطلب.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <span className="text-xs font-bold text-candy-ink block">أسباب شائعة:</span>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_REASONS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      setReason(preset);
                      setError(null);
                      setHasInteracted(true);
                    }}
                    className="text-[11px] font-sans px-2.5 py-1.5 rounded-full border border-candy-line bg-candy-soft/70 hover:bg-candy-blush/60 hover:border-candy-rose text-candy-ink transition-colors flex items-center gap-1"
                  >
                    {reason === preset && <Check className="w-3 h-3 text-candy-berry" />}
                    <span>{preset}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <Textarea
                id="undelivered-reason"
                label="سبب تعذر التسليم (إلزامي)*"
                rows={3}
                placeholder="اكتب ما حدث (5 أحرف على الأقل)..."
                value={reason}
                disabled={isSubmitting}
                onChange={(event) => {
                  const value = event.target.value;
                  setReason(value);
                  if (hasInteracted) setError(validate(value));
                }}
                error={error || undefined}
                helperText="يُحفظ السبب ضمن سجل الطلب لتسهيل المتابعة."
                className="text-sm"
              />
              <div className="flex justify-between items-center text-[11px] text-candy-muted px-1">
                <span>الحد الأدنى: 5 أحرف</span>
                <span>{reason.trim().length} حرف</span>
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-candy-line/60 flex flex-col-reverse sm:flex-row gap-2 justify-end">
              <Button type="button" variant="ghost" size="md" disabled={isSubmitting} onClick={onClose}>تراجع</Button>
              <Button type="submit" variant="primary" size="md" disabled={isSubmitting} isLoading={isSubmitting} leftIcon={<AlertTriangle className="w-4 h-4" />}>
                حفظ سبب تعذر التسليم
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
