import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { AlertCircle, Zap, Users, Workflow, Lock } from 'lucide-react';
import { TestDataGenerator } from './TestDataGenerator';
import { TestDataSeeder } from './TestDataSeeder';
import { TestScenarioRunner } from './TestScenarioRunner';
import { UserImpersonation } from './UserImpersonation';

/**
 * AdminDashboard Component
 * Comprehensive admin testing interface integrating all testing tools
 */
export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Testing Dashboard</h1>
        <p className="text-gray-600">
          Comprehensive testing tools for Ologywood platform development and QA
        </p>
      </div>

      {/* Development-Only Warning */}
      <Card className="p-4 bg-red-50 border-red-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Development Only</h3>
            <p className="text-sm text-red-800 mt-1">
              These tools are for development and testing purposes only. Do not use in production environments.
              All test data generated here should be cleaned up before deployment.
            </p>
          </div>
        </div>
      </Card>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="data-generator">Data Generator</TabsTrigger>
          <TabsTrigger value="data-seeder">Data Seeder</TabsTrigger>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          <TabsTrigger value="impersonation">Impersonation</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quick Start Guide */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Quick Start Guide
              </h3>
              <ol className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="font-bold text-blue-600">1.</span>
                  <span>Generate test data using the <strong>Data Generator</strong></span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-blue-600">2.</span>
                  <span>Seed data into database using <strong>Data Seeder</strong></span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-blue-600">3.</span>
                  <span>Run test scenarios with <strong>Scenario Runner</strong></span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-blue-600">4.</span>
                  <span>Impersonate users to test different roles</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-blue-600">5.</span>
                  <span>Verify results and validate workflows</span>
                </li>
              </ol>
            </Card>

            {/* Available Tools */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Workflow className="w-5 h-5" />
                Available Tools
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded border border-blue-200">
                  <p className="font-medium text-blue-900">Data Generator</p>
                  <p className="text-xs text-blue-700 mt-1">Generate realistic test data for artists, venues, and bookings</p>
                </div>
                <div className="p-3 bg-green-50 rounded border border-green-200">
                  <p className="font-medium text-green-900">Data Seeder</p>
                  <p className="text-xs text-green-700 mt-1">Insert generated data directly into the database</p>
                </div>
                <div className="p-3 bg-purple-50 rounded border border-purple-200">
                  <p className="font-medium text-purple-900">Scenario Runner</p>
                  <p className="text-xs text-purple-700 mt-1">Execute pre-configured test workflows</p>
                </div>
                <div className="p-3 bg-orange-50 rounded border border-orange-200">
                  <p className="font-medium text-orange-900">User Impersonation</p>
                  <p className="text-xs text-orange-700 mt-1">Switch between test users and roles</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Testing Workflows */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recommended Testing Workflows</h3>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4 py-2">
                <h4 className="font-medium mb-1">Complete Booking Workflow</h4>
                <p className="text-sm text-gray-600">
                  Test the full booking lifecycle: artist profile creation → booking request → acceptance → payment → contract signing
                </p>
              </div>
              <div className="border-l-4 border-green-500 pl-4 py-2">
                <h4 className="font-medium mb-1">Payment Processing</h4>
                <p className="text-sm text-gray-600">
                  Validate Stripe integration: deposit payment → full payment → refund handling
                </p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4 py-2">
                <h4 className="font-medium mb-1">Contract Signing</h4>
                <p className="text-sm text-gray-600">
                  Test digital contracts: generation → artist signature → venue signature → PDF download
                </p>
              </div>
              <div className="border-l-4 border-orange-500 pl-4 py-2">
                <h4 className="font-medium mb-1">Role-Based Access</h4>
                <p className="text-sm text-gray-600">
                  Verify role-based features: artist view → venue view → admin view
                </p>
              </div>
            </div>
          </Card>

          {/* Test Data Requirements */}
          <Card className="p-6 bg-amber-50 border-amber-200">
            <h3 className="text-lg font-semibold mb-4">Test Data Requirements</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">2</div>
                <p className="text-xs text-gray-600 mt-1">Users (Artist + Venue)</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">2</div>
                <p className="text-xs text-gray-600 mt-1">Profiles</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">1</div>
                <p className="text-xs text-gray-600 mt-1">Booking</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">1</div>
                <p className="text-xs text-gray-600 mt-1">Contract</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Data Generator Tab */}
        <TabsContent value="data-generator">
          <TestDataGenerator />
        </TabsContent>

        {/* Data Seeder Tab */}
        <TabsContent value="data-seeder">
          <TestDataSeeder />
        </TabsContent>

        {/* Scenarios Tab */}
        <TabsContent value="scenarios">
          <TestScenarioRunner />
        </TabsContent>

        {/* Impersonation Tab */}
        <TabsContent value="impersonation">
          <UserImpersonation />
        </TabsContent>
      </Tabs>

      {/* Security Notice */}
      <Card className="p-4 bg-gray-50 border-gray-200">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900">Security Note</h3>
            <p className="text-sm text-gray-700 mt-1">
              These admin tools are protected by role-based access control. Only users with admin role can access these features.
              All impersonation tokens are temporary and expire after 60 minutes.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
