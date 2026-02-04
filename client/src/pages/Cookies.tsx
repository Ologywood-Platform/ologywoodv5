import React from 'react';
import { Link } from 'react-router-dom';

const Cookies = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gray-50 border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link to="/" className="text-blue-600 hover:text-blue-700 text-sm mb-4 inline-block">
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mt-4">Cookie Policy</h1>
          <p className="text-gray-600 mt-2">Last updated: February 4, 2024</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-lg max-w-none">
          <h2>1. What Are Cookies?</h2>
          <p>Cookies are small pieces of text stored on your device. They help us remember your preferences and improve your experience.</p>

          <h2>2. Types of Cookies We Use</h2>
          <h3>Essential Cookies</h3>
          <p>Necessary for the website to function properly. They enable core functionality such as security and network management.</p>

          <h3>Performance Cookies</h3>
          <p>Help us understand how visitors interact with our website by collecting and reporting information anonymously.</p>

          <h3>Functional Cookies</h3>
          <p>Enable enhanced functionality and personalization, such as remembering your login information and preferences.</p>

          <h3>Marketing Cookies</h3>
          <p>Used to track visitors across websites to display relevant and engaging advertisements.</p>

          <h2>3. How We Use Cookies</h2>
          <ul>
            <li>To remember your login information</li>
            <li>To understand how you use our website</li>
            <li>To improve our website and services</li>
            <li>To personalize your experience</li>
            <li>To serve relevant advertisements</li>
          </ul>

          <h2>4. Managing Your Cookie Preferences</h2>
          <p>Most web browsers allow you to control cookies through their settings. You can accept, reject, or delete cookies from your device.</p>

          <h2>5. Your Rights</h2>
          <ul>
            <li>Know what cookies are being used</li>
            <li>Opt-out of non-essential cookies</li>
            <li>Request deletion of your cookie data</li>
          </ul>

          <h2>6. Contact Us</h2>
          <p>If you have any questions about this Cookie Policy, please contact us at privacy@ologywood.com</p>
        </div>

        <div className="mt-12 pt-8 border-t">
          <div className="flex gap-4">
            <Link to="/terms" className="text-blue-600 hover:text-blue-700">Terms of Service</Link>
            <Link to="/privacy" className="text-blue-600 hover:text-blue-700">Privacy Policy</Link>
            <Link to="/" className="text-blue-600 hover:text-blue-700">Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cookies;
