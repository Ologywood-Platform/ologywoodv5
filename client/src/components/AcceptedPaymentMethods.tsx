import { cn } from '@/lib/utils';

interface AcceptedPaymentMethodsProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  labelText?: string;
}

// SVG payment icons as inline components for reliability (no external dependencies)
function VisaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="#1A1F71" />
      <path d="M20.3 21.5h-2.8l1.8-10.9h2.8l-1.8 10.9zm11.8-10.6c-.6-.2-1.4-.4-2.5-.4-2.8 0-4.7 1.5-4.7 3.6 0 1.6 1.4 2.4 2.5 3 1.1.5 1.5.9 1.5 1.4 0 .7-.9 1.1-1.7 1.1-1.1 0-1.8-.2-2.7-.6l-.4-.2-.4 2.5c.7.3 1.9.6 3.2.6 3 0 4.9-1.5 4.9-3.7 0-1.2-.7-2.2-2.4-3-.9-.5-1.5-.8-1.5-1.3 0-.4.5-.9 1.5-.9.9 0 1.5.2 2 .4l.2.1.5-2.6zm7.1 0h-2.2c-.7 0-1.2.2-1.5.9l-4.2 10h3l.6-1.6h3.6l.3 1.6h2.6l-2.2-10.9zm-3.5 7l1.5-4 .8 4h-2.3zM17.5 10.6l-2.7 7.4-.3-1.5c-.5-1.7-2-3.5-3.8-4.4l2.5 9.4h3l4.5-10.9h-3.2z" fill="white" />
      <path d="M12.2 10.6H7.8l-.1.3c3.5.9 5.9 3.1 6.8 5.7l-1-5c-.2-.7-.7-.9-1.3-1z" fill="#F9A533" />
    </svg>
  );
}

function MastercardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="#252525" />
      <circle cx="19" cy="16" r="8" fill="#EB001B" />
      <circle cx="29" cy="16" r="8" fill="#F79E1B" />
      <path d="M24 10.3a8 8 0 0 1 0 11.4 8 8 0 0 1 0-11.4z" fill="#FF5F00" />
    </svg>
  );
}

function AmexIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="#006FCF" />
      <path d="M7 13l2.5-6h3.2l1.4 3.5L15.5 7h3.2l-3.5 6h-2.3l-.5-1.2h-2.6L9.3 13H7zm3.2-2.2h1.5l-.8-2-.7 2zM19 13V7h5.2l1 1.3L26.2 7h2l-2.2 3 2.2 3h-2l-1-1.3-1 1.3H19zm2-2h2.5l1-1.2-1-1.3H21v2.5zM7 19l2.5-6h3.2l1.4 3.5L15.5 13h3.2l-3.5 6h-2.3l-.5-1.2h-2.6L9.3 19H7zm3.2-2.2h1.5l-.8-2-.7 2zM19 19v-6h5.2l1 1.3 1-1.3h2l-2.2 3 2.2 3h-2l-1-1.3-1 1.3H19zm2-2h2.5l1-1.2-1-1.3H21v2.5z" fill="white" opacity="0" />
      <text x="24" y="18.5" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold" fontFamily="Arial">AMEX</text>
    </svg>
  );
}

function DiscoverIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />
      <rect x="0" y="16" width="48" height="16" rx="0" fill="#F47216" />
      <circle cx="28" cy="16" r="6" fill="#F47216" />
      <text x="14" y="14" fill="#231F20" fontSize="5.5" fontWeight="bold" fontFamily="Arial">DISCOVER</text>
    </svg>
  );
}

function ApplePayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="#000000" />
      <path d="M15.2 11.2c-.5.6-1.3 1-2 1-.1-.8.3-1.6.7-2.1.5-.6 1.3-1 2-1 .1.8-.2 1.6-.7 2.1zm.7 1.1c-1.1-.1-2.1.6-2.6.6-.5 0-1.4-.6-2.3-.6-1.2 0-2.3.7-2.9 1.8-1.2 2.1-.3 5.3.9 7 .6.9 1.3 1.8 2.2 1.8.9 0 1.2-.6 2.3-.6 1.1 0 1.3.6 2.3.6.9 0 1.6-.9 2.2-1.8.7-1 .9-2 .9-2-.1 0-1.8-.7-1.8-2.7 0-1.7 1.4-2.5 1.5-2.6-.8-1.2-2.1-1.4-2.6-1.4h-.1z" fill="white" />
      <text x="30" y="18" fill="white" fontSize="6" fontWeight="500" fontFamily="Arial">Pay</text>
    </svg>
  );
}

function GooglePayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />
      <path d="M22.8 16.8v3.1h-1v-7.7h2.6c.6 0 1.2.2 1.7.7.5.4.7 1 .7 1.6 0 .7-.2 1.2-.7 1.6-.5.4-1 .7-1.7.7h-1.6zm0-3.7v2.8h1.7c.4 0 .7-.1 1-.4.3-.3.4-.6.4-1s-.1-.7-.4-1c-.3-.3-.6-.4-1-.4h-1.7z" fill="#3C4043" />
      <path d="M29 14.2c.7 0 1.3.2 1.7.6.4.4.6 1 .6 1.7v3.4h-1v-.8c-.3.6-.9.9-1.6.9-.5 0-1-.1-1.3-.4-.3-.3-.5-.7-.5-1.1 0-.5.2-.9.5-1.1.4-.3.8-.4 1.5-.4h1.3v-.2c0-.4-.1-.7-.4-.9-.2-.2-.6-.3-1-.3-.3 0-.6.1-.8.2-.3.1-.5.3-.6.5l-.7-.6c.2-.3.5-.6.9-.8.4-.2.8-.3 1.4-.3zm-.2 5.5c.4 0 .7-.1 1-.3.3-.2.5-.5.6-.8v-.8h-1.2c-.8 0-1.2.3-1.2.8 0 .3.1.5.3.6.2.2.5.3.8.3h-.3z" fill="#3C4043" />
      <path d="M35.3 20.1c-.4.3-.8.4-1.3.4-.5 0-.9-.1-1.2-.4-.3-.3-.5-.7-.5-1.2v-3.2h-1v-.9h1v-1.5h1v1.5h1.5v.9H33v3c0 .3.1.5.2.6.2.1.3.2.6.2.3 0 .5-.1.7-.2l.3.8h-.5z" fill="#3C4043" />
      <circle cx="14.5" cy="16" r="3.5" fill="#4285F4" />
      <path d="M14.5 13.5c.7 0 1.3.2 1.8.7l-1.3 1.3c-.1-.2-.3-.2-.5-.2-.7 0-1.2.5-1.2 1.2v.5h3.2c0 .2 0 .3-.1.5-.2.9-.8 1.5-1.6 1.8-.3.1-.5.1-.8.1-1.4 0-2.5-1.1-2.5-2.5s1.1-2.5 2.5-2.5l.5.1z" fill="#FFFFFF" opacity="0.3" />
    </svg>
  );
}

const sizeClasses = {
  sm: 'h-6 w-9',
  md: 'h-8 w-12',
  lg: 'h-10 w-15',
};

export function AcceptedPaymentMethods({
  className,
  size = 'md',
  showLabel = true,
  labelText = 'We Accept',
}: AcceptedPaymentMethodsProps) {
  const iconSize = sizeClasses[size];

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      {showLabel && (
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          {labelText}
        </span>
      )}
      <div className="flex items-center gap-2 flex-wrap justify-center">
        <VisaIcon className={iconSize} />
        <MastercardIcon className={iconSize} />
        <AmexIcon className={iconSize} />
        <DiscoverIcon className={iconSize} />
        <ApplePayIcon className={iconSize} />
        <GooglePayIcon className={iconSize} />
      </div>
    </div>
  );
}
