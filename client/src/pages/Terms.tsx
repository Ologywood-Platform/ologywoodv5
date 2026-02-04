import React from 'react';
import { Link } from 'react-router-dom';

const Terms = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link to="/" className="text-blue-600 hover:text-blue-700 text-sm mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mt-4">Terms of Service</h1>
          <p className="text-gray-600 mt-2">Last updated: February 4, 2024</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-lg max-w-none">
          <h2>1. Agreement to Terms</h2>
          <p>
            By accessing and using the Ologywood platform (the "Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </p>

          <h2>2. Use License</h2>
          <p>
            Permission is granted to temporarily download one copy of the materials (information or software) on Ologywood's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
          </p>
          <ul>
            <li>Modifying or copying the materials</li>
            <li>Using the materials for any commercial purpose or for any public display</li>
            <li>Attempting to decompile or reverse engineer any software contained on the Service</li>
            <li>Removing any copyright or other proprietary notations from the materials</li>
            <li>Transferring the materials to another person or "mirroring" the materials on any other server</li>
          </ul>

          <h2>3. Disclaimer</h2>
          <p>
            The materials on Ologywood's website are provided on an 'as is' basis. Ologywood makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </p>

          <h2>4. Limitations</h2>
          <p>
            In no event shall Ologywood or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Ologywood's website, even if Ologywood or an authorized representative has been notified orally or in writing of the possibility of such damage.
          </p>

          <h2>5. Accuracy of Materials</h2>
          <p>
            The materials appearing on Ologywood's website could include technical, typographical, or photographic errors. Ologywood does not warrant that any of the materials on its website are accurate, complete, or current. Ologywood may make changes to the materials contained on its website at any time without notice.
          </p>

          <h2>6. Materials on Website</h2>
          <p>
            Ologywood has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Ologywood of the site. Use of any such linked website is at the user's own risk.
          </p>

          <h2>7. Modifications</h2>
          <p>
            Ologywood may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
          </p>

          <h2>8. Governing Law</h2>
          <p>
            These terms and conditions are governed by and construed in accordance with the laws of the State of California, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
          </p>

          <h2>9. User Responsibilities</h2>
          <p>
            Users agree to:
          </p>
          <ul>
            <li>Provide accurate and complete information during registration</li>
            <li>Maintain the confidentiality of their account information</li>
            <li>Not engage in any conduct that restricts or inhibits anyone's use or enjoyment of the Service</li>
            <li>Not post or transmit any unlawful, threatening, abusive, defamatory, obscene, or otherwise objectionable material</li>
            <li>Not engage in any commercial activity or sales without prior written consent</li>
          </ul>

          <h2>10. Booking and Cancellation</h2>
          <p>
            Booking terms and cancellation policies are subject to the specific terms agreed upon between artists and venues. Ologywood facilitates these connections but is not responsible for disputes between parties. Please review cancellation policies before confirming bookings.
          </p>

          <h2>11. Payment Terms</h2>
          <p>
            All payments are processed through secure payment gateways. By making a payment, you authorize Ologywood to charge your payment method for the booking amount. Refunds are subject to the cancellation policy of the specific booking.
          </p>

          <h2>12. Intellectual Property Rights</h2>
          <p>
            All content on the Ologywood website, including text, graphics, logos, images, and software, is the property of Ologywood or its content suppliers and is protected by international copyright laws. Unauthorized use of any content is prohibited.
          </p>

          <h2>13. Contact Information</h2>
          <p>
            If you have any questions about these Terms of Service, please contact us at:
          </p>
          <ul>
            <li>Email: support@ologywood.com</li>
            <li>Phone: +1 (800) 654-9963</li>
            <li>Address: 123 Entertainment Ave, Los Angeles, CA 90001</li>
          </ul>
        </div>

        {/* Navigation */}
        <div className="mt-12 pt-8 border-t">
          <div className="flex gap-4">
            <Link to="/privacy" className="text-blue-600 hover:text-blue-700">
              Privacy Policy
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

export default Terms;
