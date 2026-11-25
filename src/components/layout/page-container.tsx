'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronLeft, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface PageBreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Breadcrumbs component with full RTL orientation and accessible ARIA landmark.
 */
export function PageBreadcrumbs({ items, className }: PageBreadcrumbsProps) {
  if (!items || items.length === 0) return null;

  return (
    <nav
      aria-label="فتات الخبز - مسار التنقل"
      className={cn('flex items-center gap-1.5 text-xs font-sans text-candy-muted flex-wrap', className)}
    >
      <ol className="flex items-center gap-1.5 flex-wrap list-none m-0 p-0">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          const Icon = item.icon;

          return (
            <li key={idx} className="inline-flex items-center gap-1.5">
              {idx > 0 && (
                <ChevronLeft
                  className="w-3.5 h-3.5 text-candy-line-dark shrink-0"
                  aria-hidden="true"
                />
              )}

              {isLast || !item.href ? (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 font-medium transition-colors',
                    isLast ? 'text-candy-berry font-bold' : 'text-candy-muted'
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {Icon && <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
                  <span>{item.label}</span>
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="inline-flex items-center gap-1 text-candy-muted hover:text-candy-berry hover:underline transition-colors"
                >
                  {Icon && <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
                  <span>{item.label}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export interface PageActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}

/**
 * Aligned container for page action buttons (e.g. Export, Add, Filter, Refresh).
 */
export function PageActions({ children, className, ...props }: PageActionsProps) {
  if (!children) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-2 sm:gap-3 flex-wrap shrink-0 justify-start sm:justify-end',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface PageHeaderProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

/**
 * Standardized Page Header coordinating title, breadcrumb navigation, and aligned action buttons.
 */
export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
  badge,
  className,
}: PageHeaderProps) {
  const hasContent = title || subtitle || breadcrumbs || actions || badge;
  if (!hasContent) return null;

  return (
    <header
      className={cn(
        'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 mb-6 border-b border-candy-line/70',
        className
      )}
    >
      <div className="space-y-1.5 min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <PageBreadcrumbs items={breadcrumbs} className="mb-2" />
        )}
        <div className="flex items-center gap-2.5 flex-wrap">
          {typeof title === 'string' ? (
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-candy-ink leading-tight">
              {title}
            </h1>
          ) : (
            title
          )}
          {badge}
        </div>
        {subtitle && (
          <p className="font-sans text-xs sm:text-sm text-candy-muted max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {actions && <PageActions>{actions}</PageActions>}
    </header>
  );
}

export interface PageContainerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  as?: React.ElementType;
  children?: React.ReactNode;
  className?: string;
  fluid?: boolean;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  headerClassName?: string;
}

/**
 * Consistent Page Container with luxury confectionery padding, optional integrated breadcrumbs,
 * and page action buttons alignment.
 */
export function PageContainer({
  as: Component = 'div',
  className,
  children,
  fluid = false,
  title,
  subtitle,
  breadcrumbs,
  actions,
  badge,
  headerClassName,
  ...props
}: PageContainerProps) {
  const hasHeader = Boolean(title || subtitle || breadcrumbs || actions || badge);

  return (
    <Component
      className={cn(
        'w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6',
        !fluid && 'max-w-7xl mx-auto',
        'pb-40 md:pb-12',
        className
      )}
      {...props}
    >
      {hasHeader && (
        <PageHeader
          title={title}
          subtitle={subtitle}
          breadcrumbs={breadcrumbs}
          actions={actions}
          badge={badge}
          className={headerClassName}
        />
      )}
      {children}
    </Component>
  );
}

export default PageContainer;