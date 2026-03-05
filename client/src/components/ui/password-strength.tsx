import React from 'react';

interface PasswordStrengthProps {
  password: string;
}

export interface StrengthResult {
  score: number; // 0-4
  label: string;
  color: string;
  bgColor: string;
}

export function getPasswordStrength(password: string): StrengthResult {
  if (!password) {
    return { score: 0, label: '', color: '', bgColor: '' };
  }

  let score = 0;

  // Length checks
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;

  // Character variety checks
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  // Cap at 4
  score = Math.min(score, 4);

  const levels: StrengthResult[] = [
    { score: 0, label: '', color: '', bgColor: '' },
    { score: 1, label: 'Weak', color: 'text-red-600', bgColor: 'bg-red-500' },
    { score: 2, label: 'Fair', color: 'text-orange-600', bgColor: 'bg-orange-500' },
    { score: 3, label: 'Good', color: 'text-yellow-600', bgColor: 'bg-yellow-500' },
    { score: 4, label: 'Strong', color: 'text-green-600', bgColor: 'bg-green-500' },
  ];

  return levels[score];
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthProps) {
  const strength = getPasswordStrength(password);

  if (!password) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${
              level <= strength.score ? strength.bgColor : 'bg-gray-200 dark:bg-gray-700'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${strength.color}`}>
        {strength.label}
      </p>
    </div>
  );
}

PasswordStrengthIndicator.displayName = 'PasswordStrengthIndicator';
