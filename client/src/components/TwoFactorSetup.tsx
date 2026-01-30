import React, { useState } from 'react';
import { Shield, Smartphone, Mail, Copy, CheckCircle, AlertCircle } from 'lucide-react';

interface TwoFactorSetupProps {
  onEnable: (method: 'sms' | 'email', value: string) => void;
  onVerify: (code: string) => void;
  isEnabled: boolean;
}

export const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ onEnable, onVerify, isEnabled }) => {
  const [step, setStep] = useState<'choose' | 'setup' | 'verify'>('choose');
  const [method, setMethod] = useState<'sms' | 'email' | null>(null);
  const [value, setValue] = useState('');
  const [code, setCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const handleMethodSelect = (selectedMethod: 'sms' | 'email') => {
    setMethod(selectedMethod);
    setStep('setup');
  };

  const handleSetup = () => {
    if (value) {
      onEnable(method!, value);
      setBackupCodes([
        'A1B2C3D4E5F6',
        'G7H8I9J0K1L2',
        'M3N4O5P6Q7R8',
        'S9T0U1V2W3X4',
        'Y5Z6A7B8C9D0',
      ]);
      setStep('verify');
    }
  };

  const handleVerify = () => {
    if (code) {
      onVerify(code);
    }
  };

  const copyBackupCodes = () => {
    const text = backupCodes.join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isEnabled) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8">
        <div className="flex items-center gap-3 mb-6">
          <CheckCircle className="text-green-600" size={32} />
          <h1 className="text-2xl font-bold text-gray-900">Two-Factor Authentication Enabled</h1>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-900">
            Your account is now protected with two-factor authentication. You'll need to enter a code
            when logging in from a new device.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="font-bold text-gray-900">Backup Codes</h2>
          <p className="text-sm text-gray-600">
            Save these codes in a safe place. You can use them to access your account if you lose access
            to your 2FA method.
          </p>
          <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 font-mono text-sm space-y-2">
            {backupCodes.map((code, idx) => (
              <div key={idx}>{code}</div>
            ))}
          </div>
          <button
            onClick={copyBackupCodes}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Copy size={16} />
            {copied ? 'Copied!' : 'Copy Codes'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Shield className="text-blue-600" size={32} />
        <h1 className="text-2xl font-bold text-gray-900">Enable Two-Factor Authentication</h1>
      </div>

      {/* Step 1: Choose Method */}
      {step === 'choose' && (
        <div className="space-y-6">
          <p className="text-gray-600">
            Two-factor authentication adds an extra layer of security to your account. Choose how you'd
            like to receive verification codes.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SMS Option */}
            <button
              onClick={() => handleMethodSelect('sms')}
              className="border-2 border-gray-300 rounded-lg p-6 hover:border-blue-600 hover:bg-blue-50 transition text-left"
            >
              <Smartphone className="text-blue-600 mb-3" size={28} />
              <h3 className="font-bold text-gray-900">Text Message (SMS)</h3>
              <p className="text-sm text-gray-600 mt-2">
                Receive a 6-digit code via SMS to your phone number.
              </p>
            </button>

            {/* Email Option */}
            <button
              onClick={() => handleMethodSelect('email')}
              className="border-2 border-gray-300 rounded-lg p-6 hover:border-blue-600 hover:bg-blue-50 transition text-left"
            >
              <Mail className="text-blue-600 mb-3" size={28} />
              <h3 className="font-bold text-gray-900">Email</h3>
              <p className="text-sm text-gray-600 mt-2">
                Receive a 6-digit code via email to your registered email address.
              </p>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Setup */}
      {step === 'setup' && (
        <div className="space-y-6">
          <div>
            <h2 className="font-bold text-gray-900 mb-4">
              {method === 'sms' ? 'Enter Your Phone Number' : 'Confirm Your Email'}
            </h2>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              {method === 'sms' ? 'Phone Number' : 'Email Address'}
            </label>
            <input
              type={method === 'sms' ? 'tel' : 'email'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={method === 'sms' ? '+1 (555) 123-4567' : 'you@example.com'}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setStep('choose')}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                Back
              </button>
              <button
                onClick={handleSetup}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Send Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Verify */}
      {step === 'verify' && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="text-blue-600 flex-shrink-0" size={20} />
            <div>
              <p className="text-sm text-blue-900 font-medium">Code Sent</p>
              <p className="text-sm text-blue-800 mt-1">
                We've sent a verification code to {method === 'sms' ? 'your phone' : 'your email'}.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter Verification Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="w-full px-4 py-2 text-center text-2xl tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <p className="text-xs text-gray-500 mt-2">6-digit code</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('setup')}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
            >
              Back
            </button>
            <button
              onClick={handleVerify}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Verify & Enable
            </button>
          </div>

          <p className="text-center text-sm text-gray-600">
            Didn't receive a code? <button className="text-blue-600 hover:underline">Resend</button>
          </p>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-900">
          <strong>💡 Tip:</strong> Save your backup codes in a secure location. You can use them to
          access your account if you lose access to your 2FA method.
        </p>
      </div>
    </div>
  );
};

export default TwoFactorSetup;
