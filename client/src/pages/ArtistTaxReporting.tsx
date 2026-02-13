import React from 'react';

/**
 * ArtistTaxReporting Page - DISABLED
 * This page references non-existent 'taxReporting' router.
 * To be re-enabled when taxReporting router is implemented.
 */
export default function ArtistTaxReporting() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">
          <strong>Tax Reporting:</strong> This feature is currently disabled. 
          The tax reporting router needs to be implemented.
        </p>
      </div>
    </div>
  );
}
