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
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {/* Home icon link */}
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">
              <Home className="h-3.5 w-3.5" />
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />

        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;

          return (
            <span key={index} className="inline-flex items-center gap-1.5">
              <BreadcrumbItem>
                {isLast || !segment.href ? (
                  <BreadcrumbPage>{segment.label}</BreadcrumbPage>
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
