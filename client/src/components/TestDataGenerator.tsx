import React, { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { AlertCircle, Zap, Users, Building2, Calendar, Copy, Check } from "lucide-react";
import { trpc } from "../lib/trpc";

interface GeneratedData {
  artists?: { count: number; data: any[] };
  venues?: { count: number; data: any[] };
  bookings?: { count: number; data: any[] };
}

export function TestDataGenerator() {
  const [generatedData, setGeneratedData] = useState<GeneratedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [artistCount, setArtistCount] = useState(3);
  const [venueCount, setVenueCount] = useState(3);
  const [bookingCount, setBookingCount] = useState(5);

  const generateScenario = async () => {
    setLoading(true);
    try {
      const response = await trpc.testdata.generateTestScenario.useMutation().mutateAsync({
        artists: artistCount,
        venues: venueCount,
        bookings: bookingCount,
      });
      setGeneratedData(response.scenario);
    } catch (error) {
      console.error("Error generating test data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateArtists = async () => {
    setLoading(true);
    try {
      const response = await trpc.testdata.generateArtists.useMutation().mutateAsync({
        count: artistCount,
      });
      setGeneratedData({ artists: { count: response.data.length, data: response.data } });
    } catch (error) {
      console.error("Error generating artists:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateVenues = async () => {
    setLoading(true);
    try {
      const response = await trpc.testdata.generateVenues.useMutation().mutateAsync({
        count: venueCount,
      });
      setGeneratedData({ venues: { count: response.data.length, data: response.data } });
    } catch (error) {
      console.error("Error generating venues:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateBookings = async () => {
    setLoading(true);
    try {
      const response = await trpc.testdata.generateBookings.useMutation().mutateAsync({
        count: bookingCount,
      });
      setGeneratedData({ bookings: { count: response.data.length, data: response.data } });
    } catch (error) {
      console.error("Error generating bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Zap className="w-6 h-6 text-amber-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Test Data Generator</h2>
          <p className="text-sm text-gray-600">Generate realistic test data with a single click</p>
        </div>
      </div>

      {/* Controls */}
      <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50">
        <h3 className="text-lg font-semibold mb-4">Generation Controls</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="w-4 h-4 inline mr-1" />
              Artists to Generate
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={artistCount}
              onChange={(e) => setArtistCount(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building2 className="w-4 h-4 inline mr-1" />
              Venues to Generate
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={venueCount}
              onChange={(e) => setVenueCount(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Bookings to Generate
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={bookingCount}
              onChange={(e) => setBookingCount(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button
            onClick={generateArtists}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? "Generating..." : "Generate Artists"}
          </Button>

          <Button
            onClick={generateVenues}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {loading ? "Generating..." : "Generate Venues"}
          </Button>

          <Button
            onClick={generateBookings}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {loading ? "Generating..." : "Generate Bookings"}
          </Button>

          <Button
            onClick={generateScenario}
            disabled={loading}
            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
          >
            {loading ? "Generating..." : "Generate All"}
          </Button>
        </div>
      </Card>

      {/* Warning */}
      <Card className="p-4 bg-yellow-50 border-yellow-200 flex gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-yellow-800">
          <p className="font-semibold">Development Only</p>
          <p>This tool generates realistic but fake test data. Use only in development and testing environments.</p>
        </div>
      </Card>

      {/* Generated Data Display */}
      {generatedData && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Generated Data</h3>

          {generatedData.artists && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Artists ({generatedData.artists.count})
                </h4>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(JSON.stringify(generatedData.artists, null, 2))}
                  className="gap-2"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              <div className="max-h-64 overflow-y-auto bg-gray-50 rounded-lg p-4">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap break-words">
                  {JSON.stringify(generatedData.artists, null, 2)}
                </pre>
              </div>
            </Card>
          )}

          {generatedData.venues && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-green-600" />
                  Venues ({generatedData.venues.count})
                </h4>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(JSON.stringify(generatedData.venues, null, 2))}
                  className="gap-2"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              <div className="max-h-64 overflow-y-auto bg-gray-50 rounded-lg p-4">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap break-words">
                  {JSON.stringify(generatedData.venues, null, 2)}
                </pre>
              </div>
            </Card>
          )}

          {generatedData.bookings && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  Bookings ({generatedData.bookings.count})
                </h4>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(JSON.stringify(generatedData.bookings, null, 2))}
                  className="gap-2"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              <div className="max-h-64 overflow-y-auto bg-gray-50 rounded-lg p-4">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap break-words">
                  {JSON.stringify(generatedData.bookings, null, 2)}
                </pre>
              </div>
            </Card>
          )}

          <Card className="p-4 bg-blue-50 border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>💡 Tip:</strong> Copy the generated data above and use it to populate your test database or create test accounts manually.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
