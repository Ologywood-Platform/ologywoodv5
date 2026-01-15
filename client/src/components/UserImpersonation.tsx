import React, { useState } from 'react';
import { trpc } from '../lib/trpc';
import { Button } from './ui/button';
import { Card } from './ui/card';

/**
 * UserImpersonation Component
 * Allows admins to impersonate test users for testing different roles and workflows
 */
export function UserImpersonation() {
  const [loading, setLoading] = useState(false);
  const [impersonatedUser, setImpersonatedUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [testUsers, setTestUsers] = useState<any[]>([]);

  const generateTestUsersMutation = trpc.testdata.generateArtists.useMutation();
  const impersonateUserMutation = trpc.impersonation.generateImpersonationToken.useMutation();

  const handleGenerateTestUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateTestUsersMutation.mutateAsync({ count: 5 });
      // Convert artists to test users format
      const users = (result.data || []).map((artist: any, idx: number) => ({
        id: idx + 1,
        name: artist.artistName,
        email: `artist-${idx}@test.ologywood`,
        role: 'artist'
      }));
      setTestUsers(users);
    } catch (err: any) {
      setError(err.message || 'Failed to generate test users');
    } finally {
      setLoading(false);
    }
  };

  const handleImpersonateUser = async (userId: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await impersonateUserMutation.mutateAsync({ userId });
      const expiresAt = new Date(Date.now() + (result.expiresIn || 60) * 60 * 1000);
      setImpersonatedUser({
        userId,
        token: result.token,
        expiresAt: expiresAt.toISOString(),
        role: 'artist'
      });
    } catch (err: any) {
      setError(err.message || 'Failed to impersonate user');
    } finally {
      setLoading(false);
    }
  };

  const handleStopImpersonation = () => {
    setImpersonatedUser(null);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'artist':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'venue':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Impersonation Status */}
      {impersonatedUser && (
        <Card className="p-6 border-2 border-yellow-400 bg-yellow-50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-yellow-900">Currently Impersonating User</h3>
              <p className="text-sm text-yellow-700 mt-1">
                You are viewing the platform as this user. All actions will be performed as this user.
              </p>
            </div>
            <div className="text-3xl">🎭</div>
          </div>

          <div className="space-y-3 bg-white p-4 rounded border border-yellow-300 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600">User ID</p>
                <p className="font-mono text-sm font-semibold">{impersonatedUser.userId}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Role</p>
                <span className={`inline-block px-3 py-1 rounded text-sm font-medium border ${getRoleColor(impersonatedUser.role)}`}>
                  {impersonatedUser.role}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-600">Token</p>
                <p className="font-mono text-xs truncate">{impersonatedUser.token?.substring(0, 20)}...</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Expires At</p>
                <p className="text-sm">{new Date(impersonatedUser.expiresAt).toLocaleTimeString()}</p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleStopImpersonation}
            className="w-full bg-yellow-600 hover:bg-yellow-700"
          >
            Stop Impersonation
          </Button>
        </Card>
      )}

      {/* Test User Generator */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Generate Test Users</h3>
        <p className="text-sm text-gray-600 mb-6">
          Create test users with different roles (admin, artist, venue) for impersonation testing
        </p>

        <Button
          onClick={handleGenerateTestUsers}
          disabled={loading}
          className="w-full mb-4"
        >
          {loading ? 'Generating Users...' : 'Generate 5 Test Users'}
        </Button>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded mb-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </Card>

      {/* Test Users List */}
      {testUsers.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Available Test Users</h3>
          <div className="space-y-3">
            {testUsers.map((user: any) => (
              <div
                key={user.id}
                className="p-4 border rounded-lg hover:border-blue-400 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium">{user.name || `User ${user.id}`}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <p className="text-xs text-gray-500 mt-1">ID: {user.id}</p>
                  </div>
                  <Button
                    onClick={() => handleImpersonateUser(user.id)}
                    disabled={loading || impersonatedUser?.userId === user.id}
                    className="ml-4"
                  >
                    {impersonatedUser?.userId === user.id ? 'Active' : 'Impersonate'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Instructions */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h4 className="font-medium mb-3">How to Use Impersonation</h4>
        <ol className="text-sm space-y-2 text-gray-700 list-decimal list-inside">
          <li>Click "Generate 5 Test Users" to create test users with different roles</li>
          <li>Select a user and click "Impersonate" to switch to that user's account</li>
          <li>You'll see a yellow banner indicating you're impersonating a user</li>
          <li>Navigate the platform and test features as that user</li>
          <li>Click "Stop Impersonation" to return to your admin account</li>
          <li>Test different roles to validate role-based features</li>
        </ol>
      </Card>

      {/* Test Scenarios */}
      <Card className="p-6 bg-purple-50 border-purple-200">
        <h4 className="font-medium mb-3">Recommended Test Scenarios</h4>
        <div className="text-sm space-y-3 text-gray-700">
          <div>
            <strong>Artist User:</strong> Create profile, upload photos, set availability, respond to booking requests
          </div>
          <div>
            <strong>Venue User:</strong> Create profile, send booking requests, process payments, sign contracts
          </div>
          <div>
            <strong>Admin User:</strong> Access admin dashboard, view analytics, manage users, seed test data
          </div>
          <div>
            <strong>Cross-Role:</strong> Impersonate both artist and venue to test complete booking workflow
          </div>
        </div>
      </Card>
    </div>
  );
}
