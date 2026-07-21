import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthProps {
  password: string;
  showChecklist?: boolean;
}

export interface StrengthResult {
  score: number; // 0-4
  label: string;
  color: string;
  bgColor: string;
}

export interface PasswordRequirement {
  label: string;
  met: boolean;
}

export function getPasswordRequirements(password: string): PasswordRequirement[] {
  return [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter (A-Z)', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter (a-z)', met: /[a-z]/.test(password) },
    { label: 'One number (0-9)', met: /[0-9]/.test(password) },
  ];
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

export function PasswordStrengthIndicator({ password, showChecklist = true }: PasswordStrengthProps) {
  const strength = getPasswordStrength(password);
  const requirements = getPasswordRequirements(password);

  if (!password) return null;

  return (
    <div className="space-y-2">
      {/* Strength bar */}
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

      {/* Requirement checklist */}
      {showChecklist && (
        <ul className="space-y-1" aria-label="Password requirements">
          {requirements.map((req) => (
            <li
              key={req.label}
              className={`flex items-center gap-1.5 text-xs transition-colors duration-150 ${
                req.met
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-muted-foreground'
              }`}
            >
              {req.met ? (
                <Check className="h-3 w-3 shrink-0" />
              ) : (
                <X className="h-3 w-3 shrink-0 text-gray-400" />
              )}
              {req.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

PasswordStrengthIndicator.displayName = 'PasswordStrengthIndicator';
