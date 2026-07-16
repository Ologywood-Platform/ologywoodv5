import React from 'react';
import { Link } from 'wouter';

const Accessibility = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gray-50 border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link to="/" className="text-blue-600 hover:text-blue-700 text-sm mb-4 inline-block">
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mt-4">Accessibility Statement</h1>
          <p className="text-gray-600 mt-2">Last updated: February 28, 2026</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-lg max-w-none">
          <h2>Our Commitment</h2>
          <p>
            Ologywood is committed to making our talent booking and fan engagement platform accessible to everyone, including people with disabilities. We aim to conform with the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards across all areas of our Platform, including talent and venue profiles, the booking flow, rider and NIL contract builder, video portfolio, Fan Club, messaging, and payment checkout.
          </p>

          <h2>Conformance Status</h2>
          <p>
            We target WCAG 2.1 Level AA conformance. Our current conformance status is <strong>partially conformant</strong>, meaning that some portions of the content may not yet fully conform to the standard. We are actively working to identify and resolve remaining gaps.
          </p>

          <h2>What We Have Implemented</h2>

          <h3>Semantic Structure and Navigation</h3>
          <p>
            The Platform is built with React and uses semantic HTML elements (<code>&lt;header&gt;</code>, <code>&lt;main&gt;</code>, <code>&lt;nav&gt;</code>, <code>&lt;section&gt;</code>, <code>&lt;footer&gt;</code>) throughout. Page headings follow a logical hierarchy. All pages include a consistent navigation structure with a mobile-responsive hamburger menu and bottom navigation bar.
          </p>

          <h3>Keyboard Navigation</h3>
          <p>
            All interactive elements (buttons, links, form fields, modals, dropdown menus) are reachable and operable via keyboard. Focus indicators are visible on interactive elements. The tab order follows the visual reading order of the page. Modal dialogs trap focus and return focus to the triggering element when closed.
          </p>

          <h3>Color and Contrast</h3>
          <p>
            The Platform supports both light and dark modes. Text and interactive elements maintain a minimum contrast ratio of 4.5:1 against their backgrounds in both modes. Color is not used as the sole means of conveying information — status indicators (booking confirmed, pending, cancelled) use both color and text labels. Focus indicators use visible outlines that meet contrast requirements.
          </p>

          <h3>Forms and Inputs</h3>
          <p>
            All form fields have associated labels. Required fields are indicated with both visual markers and <code>aria-required</code> attributes. Error messages are associated with their fields using <code>aria-describedby</code> and are announced to screen readers. The booking form, rider builder, and profile editor all follow these patterns.
          </p>

          <h3>Images and Media</h3>
          <p>
            Profile photos, venue images, and event images include descriptive <code>alt</code> text. Decorative images use empty <code>alt</code> attributes. The Platform does not auto-play audio or video content.
          </p>

          <h3>Responsive Design</h3>
          <p>
            The Platform is fully responsive and functions on screen sizes from 320px to desktop widths. Content reflows without horizontal scrolling at 200% browser zoom. Touch targets on mobile are at least 44x44 CSS pixels. The progressive web app (PWA) version provides the same accessibility features as the desktop site.
          </p>

          <h3>Motion and Animation</h3>
          <p>
            The Platform respects the <code>prefers-reduced-motion</code> media query. When reduced motion is enabled, transitions and animations are minimized or disabled. No content relies on motion to convey meaning.
          </p>

          <h2>Known Limitations</h2>
          <p>
            We are aware of the following areas where accessibility may be limited:
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold border-b">Area</th>
                  <th className="px-4 py-2 text-left font-semibold border-b">Limitation</th>
                  <th className="px-4 py-2 text-left font-semibold border-b">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 border-b">Google Maps</td>
                  <td className="px-4 py-2 border-b">Embedded maps for venue and event locations rely on Google's accessibility implementation, which may not fully meet WCAG 2.1 AA. Venue addresses are also provided as text.</td>
                  <td className="px-4 py-2 border-b">Third-party dependency</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border-b">Stripe Checkout</td>
                  <td className="px-4 py-2 border-b">Payment forms redirect to Stripe's hosted checkout page, which follows Stripe's own accessibility standards.</td>
                  <td className="px-4 py-2 border-b">Third-party dependency</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border-b">E-Signature Drawing</td>
                  <td className="px-4 py-2 border-b">The draw-to-sign feature in rider contracts requires mouse or touch input. A type-to-sign alternative is available for users who cannot use the drawing canvas.</td>
                  <td className="px-4 py-2 border-b">Alternative provided</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border-b">PDF Contracts</td>
                  <td className="px-4 py-2 border-b">Generated PDF contracts may not be fully screen-reader accessible. The HTML preview of contracts is accessible and contains the same information.</td>
                  <td className="px-4 py-2 border-b">Alternative provided</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>Assistive Technology Compatibility</h2>
          <p>
            The Platform is designed to be compatible with:
          </p>
          <ul>
            <li><strong>Screen readers:</strong> VoiceOver (macOS/iOS), NVDA (Windows), TalkBack (Android)</li>
            <li><strong>Voice control:</strong> Voice Control (macOS/iOS), Voice Access (Android)</li>
            <li><strong>Keyboard navigation:</strong> Full keyboard access on all desktop browsers</li>
            <li><strong>Browser zoom:</strong> Content remains usable at up to 200% zoom</li>
            <li><strong>High contrast modes:</strong> Compatible with OS-level high contrast settings</li>
          </ul>

          <h2>Testing</h2>
          <p>
            We test accessibility using a combination of automated tools and manual review. Automated scans are run during development to catch common issues. Manual testing includes keyboard-only navigation, screen reader testing with VoiceOver, and visual review of color contrast and focus indicators. We welcome reports from users who encounter barriers we may have missed.
          </p>

          <h2>Feedback</h2>
          <p>
            If you encounter an accessibility barrier on Ologywood, please let us know. We take all reports seriously and will work to resolve issues promptly.
          </p>
          <ul>
            <li>Email: <a href="mailto:accessibility@ologywood.com">accessibility@ologywood.com</a></li>
            <li>General support: <a href="mailto:support@ologywood.com">support@ologywood.com</a></li>
            <li>Phone: <a href="tel:678-525-0891">678-525-0891</a></li>
          </ul>
          <p>
            When reporting an issue, please include the page URL, a description of the problem, the assistive technology you are using (if applicable), and your browser and operating system. We aim to respond to accessibility feedback within 5 business days.
          </p>

          <h2>Additional Resources</h2>
          <ul>
            <li><a href="https://www.w3.org/WAI/WCAG21/quickref/" target="_blank" rel="noopener noreferrer">WCAG 2.1 Quick Reference</a></li>
            <li><a href="https://www.w3.org/WAI/" target="_blank" rel="noopener noreferrer">Web Accessibility Initiative (WAI)</a></li>
            <li><a href="https://www.ada.gov/" target="_blank" rel="noopener noreferrer">Americans with Disabilities Act (ADA)</a></li>
          </ul>
        </div>

        <div className="mt-12 pt-8 border-t">
          <div className="flex gap-4 flex-wrap">
            <Link to="/terms-of-service" className="text-blue-600 hover:text-blue-700">Terms of Service</Link>
            <Link to="/privacy-policy" className="text-blue-600 hover:text-blue-700">Privacy Policy</Link>
            <Link to="/cookies" className="text-blue-600 hover:text-blue-700">Cookie Policy</Link>
            <Link to="/" className="text-blue-600 hover:text-blue-700">Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Accessibility;
