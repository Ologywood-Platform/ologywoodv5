import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, AlertTriangle, Mail, Clock, FileText, Scale } from 'lucide-react';
import { useLocation } from 'wouter';

export default function DMCAPolicy() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">DMCA Policy</h1>
            <p className="text-sm text-slate-600">Digital Millennium Copyright Act Notice & Takedown</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Last Updated */}
          <p className="text-sm text-slate-500">Last Updated: March 1, 2026</p>

          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-700 leading-relaxed">
              <p>
                Ologywood respects the intellectual property rights of artists, creators, and copyright holders. 
                Our White Label Release feature allows artists to sell their original music directly through 
                their profiles. We take copyright infringement seriously and will respond promptly to valid 
                DMCA takedown notices.
              </p>
              <p>
                This policy outlines the procedures for reporting copyright infringement on the Ologywood 
                platform in accordance with the Digital Millennium Copyright Act (17 U.S.C. § 512).
              </p>
            </CardContent>
          </Card>

          {/* Reporting Infringement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Reporting Copyright Infringement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-700 leading-relaxed">
              <p>
                If you believe that content available on Ologywood infringes your copyright, you may submit 
                a DMCA takedown notice. Your notice must include the following information:
              </p>
              <ol className="list-decimal pl-6 space-y-3">
                <li>
                  <strong>Identification of the copyrighted work</strong> — A description of the copyrighted 
                  work you claim has been infringed. If multiple works are covered by a single notification, 
                  provide a representative list.
                </li>
                <li>
                  <strong>Identification of the infringing material</strong> — The specific URL(s) or other 
                  information sufficient to identify the material on Ologywood that you claim is infringing.
                </li>
                <li>
                  <strong>Your contact information</strong> — Your name, mailing address, telephone number, 
                  and email address.
                </li>
                <li>
                  <strong>Good faith statement</strong> — A statement that you have a good faith belief that 
                  the use of the material is not authorized by the copyright owner, its agent, or the law.
                </li>
                <li>
                  <strong>Accuracy statement</strong> — A statement, made under penalty of perjury, that the 
                  information in the notification is accurate and that you are the copyright owner or authorized 
                  to act on behalf of the copyright owner.
                </li>
                <li>
                  <strong>Signature</strong> — A physical or electronic signature of the copyright owner or a 
                  person authorized to act on their behalf.
                </li>
              </ol>
            </CardContent>
          </Card>

          {/* How to Submit */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-green-600" />
                How to Submit a DMCA Notice
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-700 leading-relaxed">
              <p>Send your DMCA takedown notice to our designated agent:</p>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <p className="font-semibold">Ologywood DMCA Agent</p>
                <p>Email: <a href="mailto:dmca@ologywood.com" className="text-blue-600 hover:underline">dmca@ologywood.com</a></p>
                <p>Subject line: "DMCA Takedown Notice"</p>
              </div>
              <p>
                Please ensure your notice includes all six elements listed above. Incomplete notices may 
                not be processed.
              </p>
            </CardContent>
          </Card>

          {/* Response Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-600" />
                Our Response Process
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-700 leading-relaxed">
              <p>Upon receiving a valid DMCA takedown notice, Ologywood will:</p>
              <ol className="list-decimal pl-6 space-y-3">
                <li>
                  <strong>Acknowledge receipt</strong> — We will confirm receipt of your notice within 
                  24 hours via email.
                </li>
                <li>
                  <strong>Remove or disable access</strong> — We will remove or disable access to the 
                  allegedly infringing material within 48 hours of receiving a valid notice.
                </li>
                <li>
                  <strong>Notify the uploader</strong> — We will notify the artist who uploaded the 
                  content that it has been removed due to a DMCA complaint, and provide them with a 
                  copy of the notice.
                </li>
                <li>
                  <strong>Process counter-notices</strong> — If the artist submits a valid counter-notice, 
                  we will forward it to the complainant and may restore the content after 10-14 business 
                  days unless the complainant files a court action.
                </li>
              </ol>
            </CardContent>
          </Card>

          {/* Counter-Notice */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                Counter-Notification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-700 leading-relaxed">
              <p>
                If you believe your content was removed in error or that you have authorization to use 
                the material, you may submit a counter-notification. Your counter-notice must include:
              </p>
              <ol className="list-decimal pl-6 space-y-3">
                <li>Your physical or electronic signature.</li>
                <li>
                  Identification of the material that was removed and the location where it appeared 
                  before removal.
                </li>
                <li>
                  A statement under penalty of perjury that you have a good faith belief the material 
                  was removed as a result of mistake or misidentification.
                </li>
                <li>
                  Your name, address, and telephone number, and a statement that you consent to the 
                  jurisdiction of the federal court in your district and that you will accept service 
                  of process from the complainant.
                </li>
              </ol>
              <p>
                Send counter-notices to <a href="mailto:dmca@ologywood.com" className="text-blue-600 hover:underline">dmca@ologywood.com</a> with 
                the subject line "DMCA Counter-Notice."
              </p>
            </CardContent>
          </Card>

          {/* Repeat Infringers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-red-600" />
                Repeat Infringers Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-700 leading-relaxed">
              <p>
                Ologywood maintains a strict repeat infringers policy. Artists who receive multiple 
                valid DMCA takedown notices will face the following consequences:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>First offense</strong> — Content removed, warning issued to the artist's account.
                </li>
                <li>
                  <strong>Second offense</strong> — Content removed, White Label Release feature suspended 
                  for 30 days.
                </li>
                <li>
                  <strong>Third offense</strong> — White Label Release feature permanently disabled. 
                  Account may be subject to additional restrictions or termination.
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Rights Certification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                Artist Rights Certification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-700 leading-relaxed">
              <p>
                All artists uploading music through the White Label Release feature must certify that 
                they own or have obtained all necessary rights to the content they upload. This includes:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Ownership or license for the musical composition (songwriting rights).</li>
                <li>Ownership or license for the sound recording (master rights).</li>
                <li>Rights to any samples, loops, or third-party content used in the recording.</li>
                <li>Rights to any cover art or visual assets associated with the release.</li>
              </ul>
              <p>
                Artists who upload content they do not have rights to may face account suspension or 
                termination in accordance with our repeat infringers policy.
              </p>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6 text-sm text-amber-800 leading-relaxed">
              <p>
                <strong>Disclaimer:</strong> This DMCA policy is provided for informational purposes and 
                reflects Ologywood's commitment to respecting intellectual property rights. For specific 
                legal questions about copyright infringement, please consult a qualified attorney. Filing 
                a false DMCA notice may result in liability for damages under Section 512(f) of the DMCA.
              </p>
            </CardContent>
          </Card>

          {/* Footer Links */}
          <div className="flex flex-wrap gap-4 text-sm text-slate-500 pb-8">
            <button onClick={() => navigate('/terms')} className="hover:text-slate-700 underline">
              Terms of Service
            </button>
            <button onClick={() => navigate('/privacy')} className="hover:text-slate-700 underline">
              Privacy Policy
            </button>
            <button onClick={() => navigate('/cookies')} className="hover:text-slate-700 underline">
              Cookie Policy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
