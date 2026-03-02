import React, { useState } from 'react';
import { Palette, Type, Upload, Eye, Download, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BrandKit {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  logoUrl?: string;
  tagline?: string;
}

interface BrandKitBuilderProps {
  onSave?: (brandKit: BrandKit) => void;
  initialBrandKit?: BrandKit;
}

const FONT_OPTIONS = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Montserrat',
  'Lato',
  'Poppins',
  'Playfair Display',
  'Space Grotesk',
  'DM Sans',
  'Work Sans'
];

const PRESET_KITS = [
  {
    name: 'Modern Purple',
    primaryColor: '#7C3AED',
    secondaryColor: '#FCD34D',
    accentColor: '#FFFFFF',
    fontFamily: 'Montserrat'
  },
  {
    name: 'Electric Blue',
    primaryColor: '#0EA5E9',
    secondaryColor: '#06B6D4',
    accentColor: '#FFFFFF',
    fontFamily: 'Inter'
  },
  {
    name: 'Warm Sunset',
    primaryColor: '#F97316',
    secondaryColor: '#EC4899',
    accentColor: '#FFFFFF',
    fontFamily: 'Poppins'
  },
  {
    name: 'Forest Green',
    primaryColor: '#16A34A',
    secondaryColor: '#92400E',
    accentColor: '#FFFFFF',
    fontFamily: 'Lato'
  }
];

export function BrandKitBuilder({ onSave, initialBrandKit }: BrandKitBuilderProps) {
  const [brandKit, setBrandKit] = useState<BrandKit>(
    initialBrandKit || {
      primaryColor: '#7C3AED',
      secondaryColor: '#FCD34D',
      accentColor: '#FFFFFF',
      fontFamily: 'Inter',
      tagline: ''
    }
  );

  const [activeTab, setActiveTab] = useState<'customize' | 'preview' | 'presets'>('customize');
  const [showSaved, setShowSaved] = useState(false);

  const handleColorChange = (field: keyof BrandKit, color: string) => {
    setBrandKit({ ...brandKit, [field]: color });
  };

  const handleFontChange = (font: string) => {
    setBrandKit({ ...brandKit, fontFamily: font });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBrandKit({ ...brandKit, logoUrl: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSave?.(brandKit);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 3000);
  };

  const applyPreset = (preset: BrandKit) => {
    setBrandKit(preset);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Palette className="h-6 w-6 text-purple-600" />
            Brand Kit Builder
          </h2>
          <p className="text-gray-600 mt-1">Customize your brand colors, fonts, and logo</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {(['customize', 'preview', 'presets'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium border-b-2 transition ${
              activeTab === tab
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Customize Tab */}
      {activeTab === 'customize' && (
        <div className="space-y-6">
          {/* Colors Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Colors</h3>

            {/* Primary Color */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Primary Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={brandKit.primaryColor}
                  onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                  className="h-12 w-12 rounded-lg cursor-pointer border border-gray-300"
                />
                <input
                  type="text"
                  value={brandKit.primaryColor}
                  onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                  placeholder="#7C3AED"
                />
              </div>
              <p className="text-xs text-gray-600">Used for buttons, links, and primary elements</p>
            </div>

            {/* Secondary Color */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Secondary Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={brandKit.secondaryColor}
                  onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                  className="h-12 w-12 rounded-lg cursor-pointer border border-gray-300"
                />
                <input
                  type="text"
                  value={brandKit.secondaryColor}
                  onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                  placeholder="#FCD34D"
                />
              </div>
              <p className="text-xs text-gray-600">Used for accents, highlights, and secondary elements</p>
            </div>

            {/* Accent Color */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Accent Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={brandKit.accentColor}
                  onChange={(e) => handleColorChange('accentColor', e.target.value)}
                  className="h-12 w-12 rounded-lg cursor-pointer border border-gray-300"
                />
                <input
                  type="text"
                  value={brandKit.accentColor}
                  onChange={(e) => handleColorChange('accentColor', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                  placeholder="#FFFFFF"
                />
              </div>
              <p className="text-xs text-gray-600">Used for text and contrast elements</p>
            </div>
          </div>

          {/* Font Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Type className="h-5 w-5" />
              Typography
            </h3>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Font Family</label>
              <select
                value={brandKit.fontFamily}
                onChange={(e) => handleFontChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                {FONT_OPTIONS.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-600">Used for all text in your profile</p>
            </div>
          </div>

          {/* Logo Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Logo
            </h3>

            {brandKit.logoUrl && (
              <div className="rounded-lg border border-gray-300 p-4 bg-gray-50">
                <img
                  src={brandKit.logoUrl}
                  alt="Brand logo"
                  className="h-24 w-24 object-contain"
                />
              </div>
            )}

            <label className="block">
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                <Upload className="h-4 w-4 mr-2" />
                Upload Logo
              </Button>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Tagline Section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Tagline</label>
            <input
              type="text"
              value={brandKit.tagline || ''}
              onChange={(e) => setBrandKit({ ...brandKit, tagline: e.target.value })}
              placeholder="Your artist tagline or motto"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
            <p className="text-xs text-gray-600">Displayed on your profile and promotional materials</p>
          </div>

          {/* Save Button */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleSave}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {showSaved ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Saved!
                </>
              ) : (
                'Save Brand Kit'
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Preview Tab */}
      {activeTab === 'preview' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Preview
          </h3>

          {/* Profile Header Preview */}
          <div
            className="rounded-lg overflow-hidden shadow-lg"
            style={{ backgroundColor: brandKit.primaryColor }}
          >
            <div className="h-32 flex items-center justify-center">
              {brandKit.logoUrl && (
                <img
                  src={brandKit.logoUrl}
                  alt="Logo"
                  className="h-16 w-16 object-contain"
                />
              )}
            </div>
          </div>

          {/* Button Preview */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Button Styles</p>
            <div className="flex gap-3">
              <button
                className="px-4 py-2 rounded-lg font-medium text-white transition hover:opacity-90"
                style={{ backgroundColor: brandKit.primaryColor }}
              >
                Primary Button
              </button>
              <button
                className="px-4 py-2 rounded-lg font-medium text-white transition hover:opacity-90"
                style={{ backgroundColor: brandKit.secondaryColor, color: brandKit.primaryColor }}
              >
                Secondary Button
              </button>
            </div>
          </div>

          {/* Text Preview */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Text Styles</p>
            <div
              className="p-4 rounded-lg"
              style={{ backgroundColor: brandKit.primaryColor + '10' }}
            >
              <h3
                className="text-xl font-bold mb-2"
                style={{ color: brandKit.primaryColor, fontFamily: brandKit.fontFamily }}
              >
                {brandKit.tagline || 'Your Artist Name'}
              </h3>
              <p style={{ color: brandKit.primaryColor, fontFamily: brandKit.fontFamily }}>
                This is how your profile will look with your brand kit applied.
              </p>
            </div>
          </div>

          {/* Color Palette */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Color Palette</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg overflow-hidden shadow">
                <div
                  className="h-20"
                  style={{ backgroundColor: brandKit.primaryColor }}
                ></div>
                <p className="p-2 text-xs font-medium text-gray-700">Primary</p>
              </div>
              <div className="rounded-lg overflow-hidden shadow">
                <div
                  className="h-20"
                  style={{ backgroundColor: brandKit.secondaryColor }}
                ></div>
                <p className="p-2 text-xs font-medium text-gray-700">Secondary</p>
              </div>
              <div className="rounded-lg overflow-hidden shadow border border-gray-300">
                <div
                  className="h-20"
                  style={{ backgroundColor: brandKit.accentColor }}
                ></div>
                <p className="p-2 text-xs font-medium text-gray-700">Accent</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Presets Tab */}
      {activeTab === 'presets' && (
        <div className="space-y-4">
          <p className="text-gray-600">Choose a preset brand kit to get started quickly</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PRESET_KITS.map((preset) => (
              <div
                key={preset.name}
                className="border rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer"
                onClick={() => applyPreset(preset)}
              >
                <div className="flex h-24">
                  <div
                    className="flex-1"
                    style={{ backgroundColor: preset.primaryColor }}
                  ></div>
                  <div
                    className="flex-1"
                    style={{ backgroundColor: preset.secondaryColor }}
                  ></div>
                  <div
                    className="flex-1"
                    style={{ backgroundColor: preset.accentColor }}
                  ></div>
                </div>
                <div className="p-3">
                  <p className="font-medium text-gray-900">{preset.name}</p>
                  <p className="text-xs text-gray-600 mt-1">{preset.fontFamily}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">💡 Brand Kit Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Choose colors with good contrast for accessibility</li>
          <li>• Keep your brand consistent across all platforms</li>
          <li>• Use your primary color for important elements</li>
          <li>• Test your brand kit on mobile devices</li>
          <li>• Update your brand kit periodically to stay fresh</li>
        </ul>
      </div>
    </div>
  );
}
