'use client';

import * as React from 'react';
import {
  KeyRound,
  Copy,
  Check,
  AlertTriangle,
  User,
  Mail,
  ShieldAlert,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { AdminUser } from '@/types';

export interface TempPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUser | null;
  temporaryPassword: string;
  isNewUser?: boolean;
}

export function TempPasswordDialog({
  open,
  onOpenChange,
  user,
  temporaryPassword,
  isNewUser = false,
}: TempPasswordDialogProps) {
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setCopied(false);
    }
  }, [open]);

  const handleCopy = async () => {
    if (!temporaryPassword) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(temporaryPassword);
      } else {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = temporaryPassword;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg p-6 sm:p-7 text-right">
        <DialogHeader className="mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200/80 flex items-center justify-center shrink-0 shadow-xs">
              <KeyRound className="w-6 h-6 text-amber-600" aria-hidden="true" />
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-xl font-display font-bold text-candy-ink">
                {isNewUser ? 'تم إنشاء الحساب بنجاح' : 'تمت إعادة تعيين كلمة المرور'}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-candy-muted font-sans mt-0.5">
                {isNewUser
                  ? 'تم تسجيل حساب العضو، يُرجى تزويده ببيانات الاعتماد التالية'
                  : 'تم توليد كلمة مرور مؤقتة جديدة للعضو بنجاح'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* بطاقة معلومات الحساب المستهدف */}
          {user && (
            <div className="p-3.5 rounded-2xl bg-candy-soft/70 border border-candy-line flex items-center justify-between text-xs font-sans">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-white border border-candy-line/60 flex items-center justify-center text-candy-berry shrink-0">
                  <User className="w-4 h-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-candy-ink truncate">{user.fullName}</p>
                  <p className="text-candy-muted flex items-center gap-1 mt-0.5 truncate" dir="ltr">
                    <Mail className="w-3 h-3 text-candy-muted/80 shrink-0" />
                    <span>{user.email}</span>
                  </p>
                </div>
              </div>

              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border shrink-0 ${
                  user.role === 'manager'
                    ? 'bg-candy-berry text-white border-candy-berry-dark'
                    : 'bg-candy-blush text-candy-berry border-candy-rose/30'
                }`}
              >
                {user.role === 'manager' ? 'مدير' : 'موظف'}
              </span>
            </div>
          )}

          {/* صندوق كلمة المرور المؤقتة والنسخ */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-candy-ink font-sans">
              كلمة المرور المؤقتة:
            </label>
            <div className="p-3 sm:p-4 rounded-2xl bg-candy-cream border-2 border-dashed border-amber-300/80 flex items-center justify-between gap-3">
              <code
                dir="ltr"
                className="font-mono text-base sm:text-lg font-bold text-candy-berry tracking-wider select-all"
              >
                {temporaryPassword}
              </code>

              <Button
                type="button"
                variant={copied ? 'secondary' : 'primary'}
                size="sm"
                onClick={handleCopy}
                leftIcon={
                  copied ? (
                    <Check className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                  ) : (
                    <Copy className="w-4 h-4" aria-hidden="true" />
                  )
                }
                className={`font-sans text-xs transition-colors ${
                  copied
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                    : ''
                }`}
              >
                {copied ? 'تم النسخ!' : 'نسخ'}
              </Button>
            </div>
          </div>

          {/* تنبيه أمني إلزامي وفق مواصفات SCR-19 (كلمة مؤقتة تُعرض مرة واحدة فقط) */}
          <div
            role="alert"
            className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs font-sans space-y-1"
          >
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" aria-hidden="true" />
              <span>تنبيه أمني هام:</span>
            </div>
            <p className="leading-relaxed text-amber-800 pr-6">
              تُعرض كلمة المرور المؤقتة هذه <strong>مرة واحدة فقط</strong> ولن يمكن
              استرجاعها لاحقاً. يجب على العضو تغيير كلمة المرور فور أول تسجيل دخول عبر
              قسم حسابي (SCR-12).
            </p>
          </div>
        </div>

        <DialogFooter className="mt-6 flex sm:justify-start">
          <Button
            type="button"
            variant="primary"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto font-sans"
          >
            فهمت ذلك، إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
