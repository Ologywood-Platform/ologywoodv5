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
          <h2>Our Commitment to Accessibility</h2>
          <p>
            Ologywood is committed to ensuring digital accessibility for all users, including those with disabilities. We continuously work to improve the accessibility of our website and services to conform with the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards.
          </p>

          <h2>WCAG 2.1 Compliance</h2>
          <p>
            Our website aims to meet WCAG 2.1 Level AA standards. WCAG is developed by the World Wide Web Consortium (W3C) and provides guidelines for making web content more accessible to people with disabilities.
          </p>

          <h3>The Four Principles of WCAG</h3>
          <ul>
            <li><strong>Perceivable:</strong> Information must be presented in ways users can perceive with their senses</li>
            <li><strong>Operable:</strong> Users must be able to navigate and use all functionality</li>
            <li><strong>Understandable:</strong> Information and operations must be clear and easy to understand</li>
            <li><strong>Robust:</strong> Content must work with current and future assistive technologies</li>
          </ul>

          <h2>Accessibility Features</h2>
          <h3>Visual Accessibility</h3>
          <ul>
            <li>High contrast text and backgrounds for readability</li>
            <li>Resizable text without loss of functionality</li>
            <li>Alternative text descriptions for all images</li>
            <li>Color is not the only means of conveying information</li>
            <li>Support for browser zoom up to 200%</li>
          </ul>

          <h3>Keyboard Navigation</h3>
          <ul>
            <li>All functionality accessible via keyboard</li>
            <li>Visible focus indicators on interactive elements</li>
            <li>Logical tab order through page content</li>
            <li>Skip links to bypass repetitive content</li>
          </ul>

          <h3>Screen Reader Support</h3>
          <ul>
            <li>Semantic HTML markup for proper structure</li>
            <li>ARIA labels and descriptions where needed</li>
            <li>Form labels properly associated with inputs</li>
            <li>Meaningful link text and button labels</li>
          </ul>

          <h3>Motor Accessibility</h3>
          <ul>
            <li>Large clickable areas for buttons and links</li>
            <li>Sufficient spacing between interactive elements</li>
            <li>Alternative to mouse-only interactions</li>
            <li>No time-dependent interactions</li>
          </ul>

          <h3>Cognitive Accessibility</h3>
          <ul>
            <li>Clear, simple language throughout</li>
            <li>Consistent navigation and layout</li>
            <li>Clear error messages and suggestions</li>
            <li>Predictable behavior and functionality</li>
          </ul>

          <h2>Assistive Technology Support</h2>
          <p>
            Our website is compatible with popular assistive technologies including:
          </p>
          <ul>
            <li>Screen readers (NVDA, JAWS, VoiceOver)</li>
            <li>Voice control software</li>
            <li>Keyboard navigation tools</li>
            <li>Browser extensions and plugins</li>
            <li>Operating system accessibility features</li>
          </ul>

          <h2>Known Accessibility Issues</h2>
          <p>
            While we strive for full accessibility, some third-party content or features may have limitations. We are actively working to address any identified issues. If you encounter an accessibility barrier, please contact us immediately.
          </p>

          <h2>Accessibility Testing</h2>
          <p>
            We conduct regular accessibility testing using:
          </p>
          <ul>
            <li>Automated accessibility scanning tools</li>
            <li>Manual testing with assistive technologies</li>
            <li>User testing with people with disabilities</li>
            <li>WCAG 2.1 compliance audits</li>
          </ul>

          <h2>Feedback and Support</h2>
          <p>
            We welcome feedback on the accessibility of our website. If you experience any difficulty accessing content or features, please contact us:
          </p>
          <ul>
            <li>Email: accessibility@ologywood.com</li>
            <li>Phone: +1 (800) 654-9963</li>
            <li>Contact Form: <Link to="/contact">Contact Us</Link></li>
          </ul>

          <h2>Continuous Improvement</h2>
          <p>
            Accessibility is an ongoing commitment. We regularly update our website and services to improve accessibility and incorporate new standards and best practices. We appreciate your patience and feedback as we work to make Ologywood accessible to everyone.
          </p>

          <h2>Third-Party Services</h2>
          <p>
            Our website uses third-party services for payments, analytics, and other functions. While we select vendors with accessibility in mind, we cannot guarantee the accessibility of all third-party content. If you experience accessibility issues with third-party services, please contact us.
          </p>

          <h2>Additional Resources</h2>
          <ul>
            <li><a href="https://www.w3.org/WAI/WCAG21/quickref/" target="_blank" rel="noopener noreferrer">WCAG 2.1 Quick Reference</a></li>
            <li><a href="https://www.w3.org/WAI/" target="_blank" rel="noopener noreferrer">Web Accessibility Initiative</a></li>
            <li><a href="https://www.ada.gov/" target="_blank" rel="noopener noreferrer">Americans with Disabilities Act</a></li>
          </ul>
        </div>

        <div className="mt-12 pt-8 border-t">
          <div className="flex gap-4 flex-wrap">
            <Link to="/terms" className="text-blue-600 hover:text-blue-700">Terms of Service</Link>
            <Link to="/privacy" className="text-blue-600 hover:text-blue-700">Privacy Policy</Link>
            <Link to="/cookies" className="text-blue-600 hover:text-blue-700">Cookie Policy</Link>
            <Link to="/" className="text-blue-600 hover:text-blue-700">Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Accessibility;
