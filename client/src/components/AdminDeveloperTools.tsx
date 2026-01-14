import React, { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Wrench, Database, Users, BarChart3, AlertCircle } from "lucide-react";
import { RoleSwitcher, RolePermissions } from "./RoleSwitcher";

interface AdminDeveloperToolsProps {
  isAdmin?: boolean;
  currentRole?: "admin" | "artist" | "venue";
}

export function AdminDeveloperTools({
  isAdmin = false,
  currentRole = "admin",
}: AdminDeveloperToolsProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "roles" | "testing" | "data">(
    "overview"
  );
  const [showDetails, setShowDetails] = useState(false);

  if (!isAdmin) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Wrench className="w-6 h-6 text-purple-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Developer Tools</h2>
          <p className="text-sm text-gray-600">Testing and development utilities</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === "overview"
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("roles")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === "roles"
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Role Switcher
        </button>
        <button
          onClick={() => setActiveTab("testing")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === "testing"
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Testing Guide
        </button>
        <button
          onClick={() => setActiveTab("data")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === "data"
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Data Tools
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50">
              <h3 className="text-lg font-semibold mb-4">System Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">Current Role</p>
                  <p className="text-lg font-bold text-purple-600">
                    {currentRole.toUpperCase()}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">User Type</p>
                  <p className="text-lg font-bold text-blue-600">Admin</p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">Environment</p>
                  <p className="text-lg font-bold text-green-600">Development</p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">API Status</p>
                  <p className="text-lg font-bold text-green-600">✓ Active</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                  <Users className="w-4 h-4" />
                  Manage Users
                </Button>
                <Button className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                  <Database className="w-4 h-4" />
                  View Database
                </Button>
                <Button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700">
                  <BarChart3 className="w-4 h-4" />
                  Analytics
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  <AlertCircle className="w-4 h-4" />
                  Details
                </Button>
              </div>
            </Card>

            {showDetails && (
              <Card className="p-6 bg-blue-50 border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-3">Development Info</h4>
                <div className="text-sm text-blue-800 space-y-2">
                  <p>
                    <strong>App Version:</strong> 1.0.0-beta
                  </p>
                  <p>
                    <strong>Build:</strong> Development (Vite)
                  </p>
                  <p>
                    <strong>Database:</strong> PostgreSQL (Drizzle ORM)
                  </p>
                  <p>
                    <strong>API:</strong> TRPC with Node.js backend
                  </p>
                  <p>
                    <strong>Last Updated:</strong> {new Date().toLocaleString()}
                  </p>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Role Switcher Tab */}
        {activeTab === "roles" && (
          <div className="space-y-4">
            <RoleSwitcher currentRole={currentRole} isAdmin={isAdmin} />
            <RolePermissions role={currentRole} />
          </div>
        )}

        {/* Testing Guide Tab */}
        {activeTab === "testing" && (
          <div className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Testing Workflows</h3>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-600 pl-4">
                  <h4 className="font-semibold text-gray-900">1. Complete Booking Flow</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Test the entire booking process from artist search to payment
                  </p>
                  <Button size="sm" variant="outline" className="mt-2">
                    Start Test
                  </Button>
                </div>

                <div className="border-l-4 border-green-600 pl-4">
                  <h4 className="font-semibold text-gray-900">2. Contract Signing</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Test digital signature capture and contract management
                  </p>
                  <Button size="sm" variant="outline" className="mt-2">
                    Start Test
                  </Button>
                </div>

                <div className="border-l-4 border-purple-600 pl-4">
                  <h4 className="font-semibold text-gray-900">3. Payment Processing</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Test Stripe payment integration with test cards
                  </p>
                  <Button size="sm" variant="outline" className="mt-2">
                    Start Test
                  </Button>
                </div>

                <div className="border-l-4 border-amber-600 pl-4">
                  <h4 className="font-semibold text-gray-900">4. Referral Program</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Test referral code generation and credit application
                  </p>
                  <Button size="sm" variant="outline" className="mt-2">
                    Start Test
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-yellow-50 border-yellow-200">
              <h4 className="font-semibold text-yellow-900 mb-2">Test Stripe Cards</h4>
              <div className="text-sm text-yellow-800 space-y-2">
                <p>
                  <strong>Success:</strong> <code className="bg-white px-2 py-1 rounded">4242 4242 4242 4242</code>
                </p>
                <p>
                  <strong>Decline:</strong> <code className="bg-white px-2 py-1 rounded">4000 0000 0000 0002</code>
                </p>
                <p>
                  <strong>Expiry:</strong> Any future date
                </p>
                <p>
                  <strong>CVC:</strong> Any 3 digits
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* Data Tools Tab */}
        {activeTab === "data" && (
          <div className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Database Tools</h3>
              <div className="space-y-3">
                <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700">
                  <Database className="w-4 h-4 mr-2" />
                  View All Users
                </Button>
                <Button className="w-full justify-start bg-green-600 hover:bg-green-700">
                  <Database className="w-4 h-4 mr-2" />
                  View All Bookings
                </Button>
                <Button className="w-full justify-start bg-purple-600 hover:bg-purple-700">
                  <Database className="w-4 h-4 mr-2" />
                  View All Contracts
                </Button>
                <Button className="w-full justify-start bg-amber-600 hover:bg-amber-700">
                  <Database className="w-4 h-4 mr-2" />
                  View All Payments
                </Button>
              </div>
            </Card>

            <Card className="p-6 bg-red-50 border-red-200">
              <h4 className="font-semibold text-red-900 mb-3">⚠️ Danger Zone</h4>
              <p className="text-sm text-red-800 mb-3">
                These actions cannot be undone. Use with caution in development only.
              </p>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full border-red-300 text-red-700 hover:bg-red-100"
                >
                  Clear Test Data
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-red-300 text-red-700 hover:bg-red-100"
                >
                  Reset Database
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
