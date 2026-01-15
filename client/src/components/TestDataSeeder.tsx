import React, { useState } from 'react';
import { trpc } from '../lib/trpc';
import { Button } from './ui/button';
import { Card } from './ui/card';

/**
 * TestDataSeeder Component
 * Provides one-click buttons to seed realistic test data into the database
 * Admin-only component for accelerating testing cycles
 */
export function TestDataSeeder() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const seedUsersMutation = trpc.testdataSeeding.seedUsers.useMutation();
  const seedArtistsMutation = trpc.testdataSeeding.seedArtistProfiles.useMutation();
  const seedVenuesMutation = trpc.testdataSeeding.seedVenueProfiles.useMutation();
  const seedBookingsMutation = trpc.testdataSeeding.seedBookings.useMutation();

  const handleSeedAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const results = [];
      
      // Seed users
      const usersResult = await seedUsersMutation.mutateAsync({
        count: 5,
        roles: ['artist', 'venue']
      });
      results.push({ type: 'users', ...usersResult });
      
      // Seed artists
      const artistsResult = await seedArtistsMutation.mutateAsync({
        userIds: [1, 2, 3],
        count: 3
      });
      results.push({ type: 'artists', ...artistsResult });
      
      // Seed venues
      const venuesResult = await seedVenuesMutation.mutateAsync({
        userIds: [4, 5],
        count: 2
      });
      results.push({ type: 'venues', ...venuesResult });
      
      // Seed bookings
      const bookingsResult = await seedBookingsMutation.mutateAsync({
        artistUserIds: [1, 2, 3],
        venueUserIds: [4, 5],
        count: 5
      });
      results.push({ type: 'bookings', ...bookingsResult });
      
      setResult({ success: true, results });
    } catch (err: any) {
      setError(err.message || 'Failed to seed database');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Test Data Seeder</h3>
        <p className="text-sm text-gray-600 mb-6">
          Generate realistic test data for accelerated testing cycles. One-click seeding creates artists, venues, and bookings directly in the database.
        </p>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Seed Complete Test Environment</h4>
            <p className="text-sm text-gray-600 mb-3">
              Creates 5 test users, 3 test artists, 2 test venues, and 5 test bookings in the database
            </p>
            <Button
              onClick={handleSeedAll}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Seeding...' : 'Seed Complete Test Environment'}
            </Button>
          </div>

          {result && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
              <h4 className="font-medium text-green-900 mb-2">Success</h4>
              <pre className="text-xs text-green-800 overflow-auto max-h-40">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded">
              <h4 className="font-medium text-red-900 mb-2">Error</h4>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6 bg-blue-50 border-blue-200">
        <h4 className="font-medium mb-3">Quick Reference</h4>
        <ul className="text-sm space-y-2 text-gray-700">
          <li>Test Users: 5 users with artist and venue roles</li>
          <li>Test Artists: 3 artists with Rock, Pop, Jazz genres</li>
          <li>Test Venues: 2 venues with 200+ capacity</li>
          <li>Test Bookings: 5 bookings linking artists and venues</li>
        </ul>
      </Card>
    </div>
  );
}
