import { Skeleton } from '@/components/ui/skeleton';

export default function ProductLoading() {
  return (
    <main dir="rtl" aria-busy="true" aria-label="جارٍ تحميل تفاصيل المنتج" className="py-6 sm:py-8 max-w-6xl mx-auto space-y-6">
      <Skeleton className="h-5 w-44 rounded-full" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
        <Skeleton className="w-full aspect-square max-h-[560px] rounded-candy-section" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-4/5 rounded-full" />
          <Skeleton className="h-4 w-full rounded-full" />
          <Skeleton className="h-4 w-3/4 rounded-full" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-full" />
        </div>
      </div>
    </main>
  );
}
