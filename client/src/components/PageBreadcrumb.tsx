import { Link } from "wouter";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";

export interface BreadcrumbSegment {
  label: string;
  href?: string;
}

interface PageBreadcrumbProps {
  segments: BreadcrumbSegment[];
  className?: string;
}

/**
 * Reusable breadcrumb navigation component.
 * 
 * Usage:
 * <PageBreadcrumb segments={[
 *   { label: "Dashboard", href: "/dashboard" },
 *   { label: "Bookings", href: "/bookings" },
 *   { label: "Booking #123" }
 * ]} />
 * 
 * The last segment is always rendered as the current page (non-clickable).
 */
export default function PageBreadcrumb({ segments, className }: PageBreadcrumbProps) {
  if (segments.length === 0) return null;

  return (
    <Breadcrumb className={className} aria-label="Breadcrumb">
      <BreadcrumbList className="flex-nowrap overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* Home icon link */}
        <BreadcrumbItem className="shrink-0">
          <BreadcrumbLink asChild>
            <Link href="/" aria-label="Home">
              <Home className="h-3.5 w-3.5" />
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />

        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;

          return (
            <span key={`${segment.href || 'current'}-${segment.label}`} className="inline-flex min-w-0 items-center gap-1.5">
              <BreadcrumbItem className={isLast ? 'min-w-0' : 'shrink-0'}>
                {isLast || !segment.href ? (
                  <BreadcrumbPage className="max-w-[14rem] truncate sm:max-w-[24rem]" title={segment.label}>{segment.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={segment.href}>{segment.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </span>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
