import React, { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Shield, User, Building2, RotateCcw } from "lucide-react";

interface RoleSwitcherProps {
  currentRole?: "admin" | "artist" | "venue";
  onRoleChange?: (role: "admin" | "artist" | "venue") => void;
  isAdmin?: boolean;
}

export function RoleSwitcher({
  currentRole = "admin",
  onRoleChange,
  isAdmin = false,
}: RoleSwitcherProps) {
  const [selectedRole, setSelectedRole] = useState(currentRole);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!isAdmin) return null;

  const roles = [
    {
      id: "admin",
      label: "Admin",
      description: "Full platform access, user management, analytics",
      icon: Shield,
      color: "bg-red-50 border-red-200",
      textColor: "text-red-700",
    },
    {
      id: "artist",
      label: "Artist",
      description: "View as performing artist, manage availability",
      icon: User,
      color: "bg-blue-50 border-blue-200",
      textColor: "text-blue-700",
    },
    {
      id: "venue",
      label: "Venue",
      description: "View as venue, search artists, send bookings",
      icon: Building2,
      color: "bg-green-50 border-green-200",
      textColor: "text-green-700",
    },
  ];

  const handleRoleSwitch = (newRole: "admin" | "artist" | "venue") => {
    setSelectedRole(newRole);
    setShowConfirm(true);
  };

  const confirmSwitch = () => {
    if (onRoleChange) {
      onRoleChange(selectedRole);
    }
    setShowConfirm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <RotateCcw className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">Developer Role Switcher</h3>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Switch between admin and regular user views to test different features. This is for development and testing only.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {roles.map((role) => {
          const Icon = role.icon;
          const isSelected = selectedRole === role.id;

          return (
            <Card
              key={role.id}
              className={`p-4 cursor-pointer transition-all border-2 ${
                isSelected ? `${role.color} ring-2 ring-purple-600` : role.color
              }`}
              onClick={() => handleRoleSwitch(role.id as "admin" | "artist" | "venue")}
            >
              <div className="flex items-start gap-3">
                <Icon className={`w-6 h-6 ${role.textColor} flex-shrink-0`} />
                <div className="flex-1">
                  <h4 className={`font-semibold ${role.textColor}`}>{role.label}</h4>
                  <p className="text-xs text-gray-600 mt-1">{role.description}</p>
                </div>
              </div>

              {currentRole === role.id && (
                <div className="mt-3 pt-3 border-t">
                  <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
                    ✓ Currently Active
                  </span>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {showConfirm && selectedRole !== currentRole && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <p className="text-sm text-yellow-800 mb-3">
            Switch to <strong>{selectedRole.toUpperCase()}</strong> view? The page will reload to apply the new role.
          </p>
          <div className="flex gap-2">
            <Button
              onClick={confirmSwitch}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
              size="sm"
            >
              Confirm Switch
            </Button>
            <Button
              onClick={() => setShowConfirm(false)}
              variant="outline"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-4 bg-blue-50 border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Testing Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Switch roles to test different user perspectives</li>
          <li>• Admin view shows all platform data and management tools</li>
          <li>• Artist view shows booking requests and availability</li>
          <li>• Venue view shows artist search and booking management</li>
          <li>• Check browser console for API calls and errors</li>
        </ul>
      </Card>

      <Card className="p-4 bg-gray-50 border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-2">Current Session Info</h4>
        <div className="text-sm text-gray-700 space-y-1">
          <p>
            <strong>Active Role:</strong> <span className="font-mono">{currentRole}</span>
          </p>
          <p>
            <strong>User:</strong> <span className="font-mono">garychisolm30@gmail.com</span>
          </p>
          <p>
            <strong>Session Type:</strong> <span className="font-mono">Development/Testing</span>
          </p>
        </div>
      </Card>
    </div>
  );
}

/**
 * Role Badge Component - Shows current role
 */
export function RoleBadge({ role }: { role: "admin" | "artist" | "venue" | string }) {
  const roleConfig = {
    admin: { label: "Admin", color: "bg-red-100 text-red-800", icon: Shield },
    artist: { label: "Artist", color: "bg-blue-100 text-blue-800", icon: User },
    venue: { label: "Venue", color: "bg-green-100 text-green-800", icon: Building2 },
  };

  const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.artist;
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </div>
  );
}

/**
 * Role Permissions Component - Shows what each role can do
 */
export function RolePermissions({ role }: { role: "admin" | "artist" | "venue" }) {
  const permissions = {
    admin: [
      "View all bookings",
      "Manage users",
      "Access analytics",
      "Process refunds",
      "Manage subscriptions",
      "View all contracts",
      "System settings",
    ],
    artist: [
      "Create artist profile",
      "Set availability",
      "Manage riders",
      "Accept bookings",
      "Sign contracts",
      "Receive payments",
      "Leave reviews",
    ],
    venue: [
      "Create venue profile",
      "Search artists",
      "Send bookings",
      "Manage contracts",
      "Process payments",
      "Leave reviews",
      "View history",
    ],
  };

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-gray-900">
        {role.charAt(0).toUpperCase() + role.slice(1)} Permissions
      </h4>
      <div className="grid grid-cols-2 gap-2">
        {permissions[role].map((perm, idx) => (
          <div key={idx} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
            <span className="text-green-600 font-bold mt-0.5">✓</span>
            <span className="text-sm text-gray-700">{perm}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
