import React from 'react';

interface TikTokIconProps {
  className?: string;
  size?: number;
}

const TikTokIcon: React.FC<TikTokIconProps> = ({ className = '', size = 24 }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      width={size}
      height={size}
      className={className}
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.68v13.67a2.4 2.4 0 1 1-2.4-2.4c.18 0 .37.02.56.05V9.86a6.46 6.46 0 0 0-.56-.05A6.33 6.33 0 0 0 5 16a6.34 6.34 0 1 0 12.12-3.31z" />
    </svg>
  );
};

export default TikTokIcon;
