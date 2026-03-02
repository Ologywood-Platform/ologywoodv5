import React from 'react';

/**
 * HelpCenter Component - DISABLED
 * This component references non-existent 'helpCenter' router.
 * To be re-enabled when helpCenter router is implemented.
 */
export function HelpCenter() {
  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <p className="text-yellow-800">
        <strong>Help Center:</strong> This feature is currently disabled. 
        The help center router needs to be implemented.
      </p>
    </div>
  );
}

export default HelpCenter;
