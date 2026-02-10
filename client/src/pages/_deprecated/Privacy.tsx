import React from 'react';
import { Link } from 'wouter';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link to="/" className="text-blue-600 hover:text-blue-700 text-sm mb-4 inline-block">
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mt-4">Privacy Policy</h1>
          <p className="text-gray-600 mt-2">Last updated: February 4, 2024</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-lg max-w-none">
          <h2>1. Introduction</h2>
          <p>
            Ologywood operates the Ologywood website. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.
          </p>

          <h2>2. Information Collection and Use</h2>
          <p>
            We collect several different types of information for various purposes to provide and improve our Service to you.
          </p>

          <h3>Types of Data Collected:</h3>
          <ul>
            <li>Email address</li>
            <li>First name and last name</li>
            <li>Phone number</li>
            <li>Address, State, Province, ZIP/Postal code, City</li>
            <li>Cookies and Usage Data</li>
          </ul>

          <h2>3. Use of Data</h2>
          <p>
            Ologywood uses the collected data for various purposes:
          </p>
          <ul>
            <li>To provide and maintain our Service</li>
            <li>To notify you about changes to our Service</li>
            <li>To allow you to participate in interactive features</li>
            <li>To provide customer support</li>
            <li>To gather analysis or valuable information to improve our Service</li>
            <li>To monitor the usage of our Service</li>
            <li>To detect, prevent and address technical issues</li>
          </ul>

          <h2>4. Security of Data</h2>
          <p>
            The security of your data is important to us. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
          </p>

          <h2>5. Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
          </p>

          <h2>6. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <ul>
            <li>Email: privacy@ologywood.com</li>
            <li>Phone: +1 (800) 654-9963</li>
            <li>Address: 123 Entertainment Ave, Los Angeles, CA 90001</li>
          </ul>

          <h2>7. Your Rights</h2>
          <p>
            Depending on your location, you may have certain rights regarding your personal data, including:
          </p>
          <ul>
            <li>The right to access your personal data</li>
            <li>The right to correct inaccurate data</li>
            <li>The right to request deletion of your data</li>
            <li>The right to restrict processing of your data</li>
            <li>The right to data portability</li>
            <li>The right to opt-out of marketing communications</li>
          </ul>

          <h2>8. Third-Party Links</h2>
          <p>
            Our Service may contain links to other sites that are not operated by us. We strongly advise you to review the Privacy Policy of every site you visit.
          </p>

          <h2>9. Children's Privacy</h2>
          <p>
            Our Service does not address anyone under the age of 18. We do not knowingly collect personally identifiable information from children under 18.
          </p>

          <h2>10. Data Retention</h2>
          <p>
            We will retain your Personal Data only for as long as necessary for the purposes set out in this Privacy Policy.
          </p>
        </div>

        {/* Navigation */}
        <div className="mt-12 pt-8 border-t">
          <div className="flex gap-4">
            <Link to="/terms" className="text-blue-600 hover:text-blue-700">
              Terms of Service
            </Link>
            <Link to="/cookies" className="text-blue-600 hover:text-blue-700">
              Cookie Policy
            </Link>
            <Link to="/" className="text-blue-600 hover:text-blue-700">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
