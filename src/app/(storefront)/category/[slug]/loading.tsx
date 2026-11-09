import { Skeleton } from '@/components/ui/skeleton';

export default function CategoryLoading() {
  return (
    <main dir="rtl" aria-busy="true" aria-label="جارٍ تحميل التصنيف" className="py-6 sm:py-8 space-y-6">
      <Skeleton className="h-5 w-40 rounded-full" />
      <div className="rounded-candy-section bg-white border border-candy-line p-6 sm:p-8 space-y-3">
        <Skeleton className="h-8 w-56 rounded-full" />
        <Skeleton className="h-4 w-full max-w-xl rounded-full" />
      </div>
      <div className="flex gap-2 overflow-hidden">
        {[0, 1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-10 w-28 shrink-0 rounded-full" />)}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((item) => (
          <div key={item} className="rounded-candy-card bg-white border border-candy-line p-3 space-y-3">
            <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
            <Skeleton className="h-5 w-4/5 rounded-full" />
            <Skeleton className="h-4 w-2/3 rounded-full" />
            <Skeleton className="h-10 w-full rounded-full" />
          </div>
        ))}
      </div>
    </main>
  );
}
