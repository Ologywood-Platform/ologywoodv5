import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Flag, X } from 'lucide-react';

interface ReportVideoButtonProps {
  artistProfileId: number;
  isOwnProfile?: boolean;
}

export function ReportVideoButton({ artistProfileId, isOwnProfile }: ReportVideoButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState<'inappropriate' | 'copyright' | 'spam' | 'other'>('inappropriate');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const hasFlaggedQuery = trpc.artist.hasUserFlaggedVideo.useQuery(
    { artistProfileId },
    { enabled: !isOwnProfile }
  );

  const reportMutation = trpc.artist.reportVideo.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      hasFlaggedQuery.refetch();
      setTimeout(() => {
        setShowModal(false);
        setSubmitted(false);
        setDetails('');
      }, 2000);
    },
  });

  // Don't show report button on own profile
  if (isOwnProfile) return null;

  // Already flagged
  if (hasFlaggedQuery.data === true) {
    return (
      <button
        disabled
        className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 rounded cursor-not-allowed"
        title="You've already reported this video"
      >
        <Flag className="w-3 h-3" />
        Reported
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
        title="Report this video"
      >
        <Flag className="w-3 h-3" />
        Report
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            {submitted ? (
              <div className="text-center py-4">
                <Flag className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-lg font-semibold text-gray-900">Report Submitted</p>
                <p className="text-sm text-gray-500 mt-1">Thank you for helping keep our community safe.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Flag className="w-5 h-5 text-red-500" />
                    Report Video
                  </h3>
                  <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-sm text-gray-500 mb-4">
                  Help us maintain a safe platform. Select a reason for your report.
                </p>

                <div className="space-y-2 mb-4">
                  {([
                    { value: 'inappropriate', label: 'Inappropriate Content', desc: 'Nudity, violence, or offensive material' },
                    { value: 'copyright', label: 'Copyright Violation', desc: 'Uses copyrighted material without permission' },
                    { value: 'spam', label: 'Spam / Misleading', desc: 'Fake, misleading, or spam content' },
                    { value: 'other', label: 'Other', desc: 'Another reason not listed above' },
                  ] as const).map(opt => (
                    <label
                      key={opt.value}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        reason === opt.value ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={opt.value}
                        checked={reason === opt.value}
                        onChange={() => setReason(opt.value)}
                        className="mt-0.5 accent-red-600"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                        <p className="text-xs text-gray-500">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

                <textarea
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  placeholder="Additional details (optional)..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none h-20 mb-4"
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => reportMutation.mutate({ artistProfileId, reason, details: details || undefined })}
                    disabled={reportMutation.isPending}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {reportMutation.isPending ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>

                {reportMutation.error && (
                  <p className="mt-3 text-sm text-red-600 text-center">
                    {reportMutation.error.message}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
