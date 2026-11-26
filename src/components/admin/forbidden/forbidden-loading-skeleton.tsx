'use client';

import * as React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface ForbiddenLoadingSkeletonProps {
  message?: string;
}

export function ForbiddenLoadingSkeleton({
  message = 'جاري التحقق من الصلاحيات...',
}: ForbiddenLoadingSkeletonProps) {
  return (
    <div
      className="w-full max-w-lg mx-auto"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <Card
        elevation="md"
        className="border-candy-line shadow-candy-2 bg-white overflow-hidden text-center"
      >
        <CardHeader className="pt-8 pb-4 px-6 sm:px-8 border-b border-candy-line/40">
          {/* Skeleton Icon with neutral spinner */}
          <div className="w-16 h-16 mx-auto mb-4 rounded-card bg-candy-soft border-2 border-candy-line/60 flex items-center justify-center text-candy-berry animate-pulse">
            <Loader2 className="w-8 h-8 animate-spin text-candy-berry/70" aria-hidden="true" />
          </div>

          {/* Skeleton Pill */}
          <div className="h-6 w-36 mx-auto mb-3 rounded-full bg-candy-soft animate-pulse" />

          {/* Skeleton Title */}
          <div className="h-7 w-3/4 mx-auto mb-3 rounded-[4px] bg-candy-soft animate-pulse" />

          {/* Skeleton Description */}
          <div className="h-4 w-5/6 mx-auto rounded bg-candy-soft/70 animate-pulse" />
        </CardHeader>

        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Skeleton Status Box */}
          <div className="h-20 w-full rounded-card bg-candy-soft/80 border border-candy-line/60 animate-pulse" />

          {/* Skeleton Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <div className="h-12 flex-1 rounded-button bg-candy-soft animate-pulse" />
            <div className="h-12 flex-1 rounded-button bg-candy-soft/60 animate-pulse" />
          </div>

          {/* Accessible announcement */}
          <p className="text-xs text-candy-muted font-sans text-center">
            {message}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
