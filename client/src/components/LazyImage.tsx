import { useState, useEffect, useRef, ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  blurDataUrl?: string;
  containerClassName?: string;
  imageClassName?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * LazyImage Component
 * 
 * Implements lazy loading with Intersection Observer API for optimal performance.
 * Features:
 * - Native lazy loading with fallback to Intersection Observer
 * - Blur-up placeholder effect for better perceived performance
 * - Automatic image loading when visible in viewport
 * - Error handling with fallback placeholder
 * - Responsive and accessible
 */
export function LazyImage({
  src,
  alt,
  placeholder,
  blurDataUrl,
  containerClassName,
  imageClassName,
  onLoad,
  onError,
  ...props
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState<string | undefined>(blurDataUrl);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Unobserve after image becomes visible
          if (imgRef.current) {
            observer.unobserve(imgRef.current);
          }
        }
      },
      {
        rootMargin: "50px", // Start loading 50px before image enters viewport
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, []);

  // Load the actual image when visible
  useEffect(() => {
    if (isVisible && src && !hasError) {
      setImageSrc(src);
    }
  }, [isVisible, src, hasError]);

  const handleImageLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleImageError = () => {
    setHasError(true);
    setImageSrc(placeholder);
    onError?.();
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden bg-muted", containerClassName)}
    >
      {/* Blur-up placeholder */}
      {blurDataUrl && !isLoaded && (
        <img
          src={blurDataUrl}
          alt=""
          className={cn(
            "absolute inset-0 w-full h-full object-cover filter blur-md",
            imageClassName
          )}
          aria-hidden="true"
        />
      )}

      {/* Main image */}
      <img
        ref={imgRef}
        src={imageSrc || placeholder}
        alt={alt}
        loading="lazy"
        onLoad={handleImageLoad}
        onError={handleImageError}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          isLoaded || imageSrc ? "opacity-100" : "opacity-0",
          imageClassName
        )}
        {...props}
      />

      {/* Fallback for when image fails to load */}
      {hasError && placeholder && (
        <div className="absolute inset-0 w-full h-full bg-muted flex items-center justify-center">
          <span className="text-xs text-muted-foreground">Image unavailable</span>
        </div>
      )}
    </div>
  );
}
