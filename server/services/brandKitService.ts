/**
 * Brand Kit Service
 * Manages artist brand customization including colors, fonts, and logos
 */

export interface BrandKit {
  id: string;
  artistId: number;
  primaryColor: string; // hex color
  secondaryColor: string; // hex color
  accentColor: string; // hex color
  fontFamily: string; // font name
  logoUrl?: string;
  tagline?: string;
  bioTemplate?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BrandKitPreset {
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
}

export class BrandKitService {
  /**
   * Create or update brand kit for an artist
   */
  static createBrandKit(
    artistId: number,
    primaryColor: string,
    secondaryColor: string,
    accentColor: string,
    fontFamily: string,
    logoUrl?: string,
    tagline?: string,
    bioTemplate?: string
  ): BrandKit {
    return {
      id: `brand_${artistId}_${Date.now()}`,
      artistId,
      primaryColor: this.normalizeColor(primaryColor),
      secondaryColor: this.normalizeColor(secondaryColor),
      accentColor: this.normalizeColor(accentColor),
      fontFamily: this.validateFontFamily(fontFamily),
      logoUrl,
      tagline,
      bioTemplate,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Normalize color to hex format
   */
  private static normalizeColor(color: string): string {
    // Remove # if present
    color = color.replace('#', '');

    // Convert 3-digit hex to 6-digit
    if (color.length === 3) {
      color = color
        .split('')
        .map((char) => char + char)
        .join('');
    }

    return `#${color.toUpperCase()}`;
  }

  /**
   * Validate font family
   */
  private static validateFontFamily(font: string): string {
    const validFonts = [
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

    return validFonts.includes(font) ? font : 'Inter';
  }

  /**
   * Get preset brand kits
   */
  static getPresets(): BrandKitPreset[] {
    return [
      {
        name: 'Modern Purple',
        description: 'Contemporary purple and gold theme',
        primaryColor: '#7C3AED',
        secondaryColor: '#FCD34D',
        accentColor: '#FFFFFF',
        fontFamily: 'Montserrat'
      },
      {
        name: 'Electric Blue',
        description: 'Bold blue and cyan theme',
        primaryColor: '#0EA5E9',
        secondaryColor: '#06B6D4',
        accentColor: '#FFFFFF',
        fontFamily: 'Inter'
      },
      {
        name: 'Warm Sunset',
        description: 'Warm orange and pink theme',
        primaryColor: '#F97316',
        secondaryColor: '#EC4899',
        accentColor: '#FFFFFF',
        fontFamily: 'Poppins'
      },
      {
        name: 'Forest Green',
        description: 'Natural green and earth tones',
        primaryColor: '#16A34A',
        secondaryColor: '#92400E',
        accentColor: '#FFFFFF',
        fontFamily: 'Lato'
      },
      {
        name: 'Midnight Black',
        description: 'Sleek black and silver theme',
        primaryColor: '#1F2937',
        secondaryColor: '#9CA3AF',
        accentColor: '#FFFFFF',
        fontFamily: 'Space Grotesk'
      },
      {
        name: 'Rose Gold',
        description: 'Elegant rose and gold theme',
        primaryColor: '#BE123C',
        secondaryColor: '#D97706',
        accentColor: '#FFFFFF',
        fontFamily: 'Playfair Display'
      }
    ];
  }

  /**
   * Generate CSS variables from brand kit
   */
  static generateCSSVariables(brandKit: BrandKit): string {
    return `
      :root {
        --brand-primary: ${brandKit.primaryColor};
        --brand-secondary: ${brandKit.secondaryColor};
        --brand-accent: ${brandKit.accentColor};
        --brand-font: '${brandKit.fontFamily}', sans-serif;
      }
    `;
  }

  /**
   * Generate Tailwind config from brand kit
   */
  static generateTailwindConfig(brandKit: BrandKit): object {
    return {
      colors: {
        brand: {
          primary: brandKit.primaryColor,
          secondary: brandKit.secondaryColor,
          accent: brandKit.accentColor
        }
      },
      fontFamily: {
        brand: [brandKit.fontFamily, 'sans-serif']
      }
    };
  }

  /**
   * Check color contrast for accessibility
   */
  static checkColorContrast(color1: string, color2: string): {
    contrastRatio: number;
    isAccessible: boolean;
    wcagLevel: 'AAA' | 'AA' | 'fail';
  } {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);

    if (!rgb1 || !rgb2) {
      return { contrastRatio: 0, isAccessible: false, wcagLevel: 'fail' };
    }

    const luminance1 = this.getLuminance(rgb1);
    const luminance2 = this.getLuminance(rgb2);

    const lighter = Math.max(luminance1, luminance2);
    const darker = Math.min(luminance1, luminance2);

    const contrastRatio = (lighter + 0.05) / (darker + 0.05);
    const isAccessible = contrastRatio >= 4.5;
    const wcagLevel = contrastRatio >= 7 ? 'AAA' : contrastRatio >= 4.5 ? 'AA' : 'fail';

    return { contrastRatio: Math.round(contrastRatio * 100) / 100, isAccessible, wcagLevel };
  }

  /**
   * Convert hex to RGB
   */
  private static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : null;
  }

  /**
   * Get relative luminance
   */
  private static getLuminance(rgb: { r: number; g: number; b: number }): number {
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((x) => {
      x = x / 255;
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Get complementary color
   */
  static getComplementaryColor(hex: string): string {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return hex;

    const r = 255 - rgb.r;
    const g = 255 - rgb.g;
    const b = 255 - rgb.b;

    return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
  }

  /**
   * Generate brand guidelines PDF (mock)
   */
  static generateBrandGuidelinesPDF(brandKit: BrandKit): string {
    return `
BRAND GUIDELINES

Primary Color: ${brandKit.primaryColor}
Secondary Color: ${brandKit.secondaryColor}
Accent Color: ${brandKit.accentColor}
Font Family: ${brandKit.fontFamily}

Logo: ${brandKit.logoUrl || 'Not set'}
Tagline: ${brandKit.tagline || 'Not set'}

These brand guidelines ensure consistent visual identity across all platforms.
    `;
  }

  /**
   * Validate brand kit colors for accessibility
   */
  static validateBrandKitAccessibility(brandKit: BrandKit): {
    primaryVsSecondary: { isAccessible: boolean; wcagLevel: string };
    primaryVsAccent: { isAccessible: boolean; wcagLevel: string };
    secondaryVsAccent: { isAccessible: boolean; wcagLevel: string };
    allAccessible: boolean;
  } {
    const pVsS = this.checkColorContrast(brandKit.primaryColor, brandKit.secondaryColor);
    const pVsA = this.checkColorContrast(brandKit.primaryColor, brandKit.accentColor);
    const sVsA = this.checkColorContrast(brandKit.secondaryColor, brandKit.accentColor);

    return {
      primaryVsSecondary: { isAccessible: pVsS.isAccessible, wcagLevel: pVsS.wcagLevel },
      primaryVsAccent: { isAccessible: pVsA.isAccessible, wcagLevel: pVsA.wcagLevel },
      secondaryVsAccent: { isAccessible: sVsA.isAccessible, wcagLevel: sVsA.wcagLevel },
      allAccessible: pVsS.isAccessible && pVsA.isAccessible && sVsA.isAccessible
    };
  }
}
