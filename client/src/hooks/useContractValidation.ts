import { useState, useCallback, useMemo } from 'react';

export interface ValidationRule {
  fieldId: string;
  label: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  patternMessage?: string;
  custom?: (value: any, allData: Record<string, any>) => string | null;
}

export interface ValidationError {
  fieldId: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationState {
  errors: Record<string, ValidationError>;
  warnings: Record<string, ValidationError>;
  isValid: boolean;
  completionPercent: number;
  totalFields: number;
  completedFields: number;
}

// NIL-specific validation rules
const NIL_COMPLIANCE_RULES: ValidationRule[] = [
  {
    fieldId: 'athlete_name',
    label: 'Athlete Name',
    required: true,
    minLength: 2,
  },
  {
    fieldId: 'event_name',
    label: 'Event Name',
    required: true,
    minLength: 3,
  },
  {
    fieldId: 'event_date',
    label: 'Event Date',
    required: true,
    custom: (value) => {
      if (!value) return null;
      const date = new Date(value);
      if (isNaN(date.getTime())) return 'Invalid date format';
      if (date < new Date()) return 'Event date must be in the future';
      return null;
    },
  },
  {
    fieldId: 'event_time',
    label: 'Event Time',
    required: true,
  },
  {
    fieldId: 'venue_name',
    label: 'Venue / Location',
    required: true,
    minLength: 2,
  },
  {
    fieldId: 'appearance_fee',
    label: 'Appearance Fee',
    required: true,
    min: 1,
    custom: (value) => {
      if (value && isNaN(Number(value))) return 'Must be a valid number';
      return null;
    },
  },
  {
    fieldId: 'appearance_duration',
    label: 'Appearance Duration',
    required: true,
  },
  {
    fieldId: 'appearance_type',
    label: 'Type of Appearance',
    required: true,
  },
  {
    fieldId: 'cancellation_policy',
    label: 'Cancellation Policy',
    required: true,
  },
];

// NIL compliance-specific warnings (not blocking but important)
const NIL_WARNING_CHECKS: Array<{
  fieldId: string;
  check: (value: any, allData: Record<string, any>) => string | null;
}> = [
  {
    fieldId: 'exclusivity',
    check: (value) => {
      if (value && value.includes('30-day')) {
        return 'A 30-day exclusivity clause may limit other NIL opportunities. Consider a shorter period.';
      }
      return null;
    },
  },
  {
    fieldId: 'photo_policy',
    check: (value) => {
      if (value === 'No photos or video') {
        return 'Restricting all media may limit promotional value. Consider allowing some coverage.';
      }
      return null;
    },
  },
  {
    fieldId: 'appearance_fee',
    check: (value) => {
      if (value && Number(value) > 50000) {
        return 'High-value NIL deals may require additional school compliance review.';
      }
      return null;
    },
  },
  {
    fieldId: 'social_media_tag',
    check: (value, allData) => {
      if (!value && allData.appearance_type !== 'Charity Event') {
        return 'Adding a social media tag helps with NIL disclosure requirements.';
      }
      return null;
    },
  },
  {
    fieldId: 'deposit_required',
    check: (value) => {
      if (value === '100% upfront') {
        return 'Requiring 100% upfront may deter bookers. Consider a deposit structure.';
      }
      return null;
    },
  },
];

export function useContractValidation(
  templateType?: string,
  customRules?: ValidationRule[]
) {
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Determine which rules to use based on template type
  const rules = useMemo(() => {
    if (customRules) return customRules;
    if (templateType?.startsWith('athlete_')) return NIL_COMPLIANCE_RULES;
    // For non-athlete templates, use a subset of rules
    return NIL_COMPLIANCE_RULES.filter(r =>
      ['event_name', 'event_date', 'venue_name'].includes(r.fieldId) || r.required
    );
  }, [templateType, customRules]);

  // Validate a single field
  const validateField = useCallback(
    (fieldId: string, value: any, allData: Record<string, any>): ValidationError | null => {
      const rule = rules.find((r) => r.fieldId === fieldId);
      if (!rule) return null;

      // Required check
      if (rule.required && (value === undefined || value === null || value === '')) {
        return {
          fieldId,
          message: `${rule.label} is required`,
          severity: 'error',
        };
      }

      // Skip other checks if empty and not required
      if (value === undefined || value === null || value === '') return null;

      // Min length
      if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
        return {
          fieldId,
          message: `${rule.label} must be at least ${rule.minLength} characters`,
          severity: 'error',
        };
      }

      // Max length
      if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
        return {
          fieldId,
          message: `${rule.label} must be no more than ${rule.maxLength} characters`,
          severity: 'error',
        };
      }

      // Min/max for numbers
      if (rule.min !== undefined && Number(value) < rule.min) {
        return {
          fieldId,
          message: `${rule.label} must be at least ${rule.min}`,
          severity: 'error',
        };
      }
      if (rule.max !== undefined && Number(value) > rule.max) {
        return {
          fieldId,
          message: `${rule.label} must be no more than ${rule.max}`,
          severity: 'error',
        };
      }

      // Pattern
      if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
        return {
          fieldId,
          message: rule.patternMessage || `${rule.label} format is invalid`,
          severity: 'error',
        };
      }

      // Custom validation
      if (rule.custom) {
        const customError = rule.custom(value, allData);
        if (customError) {
          return { fieldId, message: customError, severity: 'error' };
        }
      }

      return null;
    },
    [rules]
  );

  // Validate all fields and compute state
  const validate = useCallback(
    (data: Record<string, any>): ValidationState => {
      const errors: Record<string, ValidationError> = {};
      const warnings: Record<string, ValidationError> = {};
      let completedFields = 0;

      // Check required fields
      for (const rule of rules) {
        const value = data[rule.fieldId];
        const error = validateField(rule.fieldId, value, data);
        if (error) {
          errors[rule.fieldId] = error;
        } else if (value !== undefined && value !== null && value !== '') {
          completedFields++;
        }
      }

      // Check NIL warnings
      for (const warnCheck of NIL_WARNING_CHECKS) {
        const value = data[warnCheck.fieldId];
        const warning = warnCheck.check(value, data);
        if (warning) {
          warnings[warnCheck.fieldId] = {
            fieldId: warnCheck.fieldId,
            message: warning,
            severity: 'warning',
          };
        }
      }

      const totalFields = rules.filter((r) => r.required).length;
      const completionPercent = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 100;

      return {
        errors,
        warnings,
        isValid: Object.keys(errors).length === 0,
        completionPercent,
        totalFields,
        completedFields,
      };
    },
    [rules, validateField]
  );

  // Mark a field as touched (for showing errors only after interaction)
  const touchField = useCallback((fieldId: string) => {
    setTouchedFields((prev) => new Set([...prev, fieldId]));
  }, []);

  // Touch all fields (for form submission attempt)
  const touchAll = useCallback(() => {
    const allFieldIds = rules.map((r) => r.fieldId);
    setTouchedFields(new Set(allFieldIds));
  }, [rules]);

  // Update form data and revalidate
  const updateField = useCallback((fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  }, []);

  // Get the current validation state
  const validationState = useMemo(() => validate(formData), [validate, formData]);

  // Get error for a specific field (only if touched)
  const getFieldError = useCallback(
    (fieldId: string): string | null => {
      if (!touchedFields.has(fieldId)) return null;
      return validationState.errors[fieldId]?.message || null;
    },
    [touchedFields, validationState]
  );

  // Get warning for a specific field
  const getFieldWarning = useCallback(
    (fieldId: string): string | null => {
      return validationState.warnings[fieldId]?.message || null;
    },
    [validationState]
  );

  return {
    validationState,
    touchField,
    touchAll,
    updateField,
    getFieldError,
    getFieldWarning,
    setFormData,
    touchedFields,
  };
}
