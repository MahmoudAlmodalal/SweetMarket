'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { KeyRound, ShieldCheck, CheckCircle2 } from 'lucide-react';
import type { AdminUser } from '@/types';
import { getArabicRoleLabel } from '@/lib/auth/authorization';

interface AccessRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUser;
}

export function AccessRequestDialog({
  open,
  onOpenChange,
  user,
}: AccessRequestDialogProps) {
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleRequestSubmit = async () => {
    setIsSubmitting(true);
    // Simulate brief network submission
    await new Promise((resolve) => setTimeout(resolve, 350));
    setIsSubmitting(false);
    setIsSubmitted(true);

    toast({
      title: 'تم إرسال طلب الصلاحية',
      description: 'تم إرسال طلب الصلاحية إلى مدير النظام بنجاح. سيتم إشعارك فور الاعتماد.',
      variant: 'success',
    });

    setTimeout(() => {
      onOpenChange(false);
      setIsSubmitted(false);
    }, 1200);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
      setIsSubmitted(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-candy-blush/60 text-candy-berry flex items-center justify-center mb-2 mx-auto">
            <KeyRound className="w-6 h-6" aria-hidden="true" />
          </div>
          <DialogTitle className="text-center font-display text-lg text-candy-ink font-bold">
            طلب صلاحية الوصول
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-candy-muted font-sans">
            يمكنك رفع طلب رسمي إلى مدير النظام لترقية صلاحيات حسابك للوصول إلى هذا القسم.
          </DialogDescription>
        </DialogHeader>

        {isSubmitted ? (
          <div
            role="alert"
            className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center space-y-2 animate-in fade-in zoom-in-95"
          >
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" aria-hidden="true" />
            <p className="text-sm font-bold">تم إرسال طلب الصلاحية بنجاح</p>
            <p className="text-xs text-emerald-700">
              سيقوم مدير النظام بمراجعة طلبك وإشعارك فور ترقية الصلاحية.
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-xl bg-candy-soft/80 border border-candy-line/60 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-candy-muted">الموظف:</span>
                <span className="font-bold text-candy-ink">{user.fullName}</span>
              </div>
              {user.jobTitle && (
                <div className="flex justify-between items-center">
                  <span className="text-candy-muted">المسمى الوظيفي:</span>
                  <span className="font-medium text-candy-ink">{user.jobTitle}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-candy-muted">الدور الحالي:</span>
                <span className="font-bold text-candy-berry">
                  {getArabicRoleLabel(user.role)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-candy-line/40">
                <span className="text-candy-muted">الصلاحية المطلوبة:</span>
                <span className="font-bold text-candy-ink bg-white px-2 py-0.5 rounded border border-candy-line">
                  مدير النظام
                </span>
              </div>
            </div>

            <p className="text-xs text-candy-muted leading-relaxed text-right">
              بالنقر على &quot;تأكيد إرسال الطلب&quot;، سيتم تسجيل إشعار لدى مديري النظام لمراجعة منحك الصلاحية الإدارية المطلوبة.
            </p>
          </div>
        )}

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
          {!isSubmitted && (
            <>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleRequestSubmit}
                isLoading={isSubmitting}
                leftIcon={<ShieldCheck className="w-4 h-4" />}
                className="w-full sm:flex-1 min-h-[48px]"
              >
                تأكيد إرسال الطلب
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleClose}
                disabled={isSubmitting}
                className="w-full sm:flex-1 min-h-[48px]"
              >
                إلغاء
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
