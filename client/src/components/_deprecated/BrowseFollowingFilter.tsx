import React, { useState, useEffect } from 'react';
import { Heart, Filter } from 'lucide-react';

interface BrowseFollowingFilterProps {
  onFilterChange: (showFollowingOnly: boolean) => void;
  className?: string;
}

export const BrowseFollowingFilter: React.FC<BrowseFollowingFilterProps> = ({
  onFilterChange,
  className = '',
}) => {
  const [showFollowingOnly, setShowFollowingOnly] = useState(false);

  // Get following count (browseFilters router not implemented)
  const followingCount = 0;

  const handleToggle = () => {
    const newValue = !showFollowingOnly;
    setShowFollowingOnly(newValue);
    onFilterChange(newValue);
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        onClick={handleToggle}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
          showFollowingOnly
            ? 'bg-red-50 border-red-300 text-red-700 font-semibold'
            : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
        }`}
        title="Show only artists you follow"
      >
        <Heart
          className={`w-5 h-5 ${showFollowingOnly ? 'fill-current' : ''}`}
        />
        <span>Following</span>
        {followingCount > 0 && (
          <span className="ml-1 px-2 py-0.5 bg-red-200 text-red-700 rounded-full text-xs font-bold">
            {followingCount}
          </span>
        )}
      </button>

      {showFollowingOnly && followingCount === 0 && (
        <div className="text-sm text-gray-600 flex items-center gap-2">
          <Filter className="w-4 h-4" />
          <span>You haven't followed any artists yet</span>
        </div>
      )}
    </div>
  );
};

export default BrowseFollowingFilter;
