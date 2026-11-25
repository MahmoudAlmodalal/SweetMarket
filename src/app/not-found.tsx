import type { Metadata } from "next";
import { NotFoundRecovery } from "@/components/not-found-recovery";

export const metadata: Metadata = {
  title: "الصفحة غير موجودة",
  description: "عذراً، الصفحة التي تبحث عنها غير موجودة في متجر كاندي لوز",
};

export default function NotFound() {
  return <NotFoundRecovery />;
}
