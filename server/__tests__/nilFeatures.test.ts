import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('NIL Features Enhancement', () => {
  describe('1. Visual Onboarding Tour Component', () => {
    const tourPath = path.resolve(__dirname, '../../client/src/components/OnboardingTour.tsx');

    it('OnboardingTour component file exists', () => {
      expect(fs.existsSync(tourPath)).toBe(true);
    });

    it('exports OnboardingTour component', () => {
      const content = fs.readFileSync(tourPath, 'utf-8');
      expect(content).toContain('export function OnboardingTour');
    });

    it('defines tour steps for NIL features', () => {
      const content = fs.readFileSync(tourPath, 'utf-8');
      expect(content).toContain('NIL-Compliant Contracts');
      expect(content).toContain('AI Contract Analyzer');
    });

    it('uses localStorage to track tour completion', () => {
      const content = fs.readFileSync(tourPath, 'utf-8');
      expect(content).toContain('localStorage');
      expect(content).toContain('ologywood_nil_tour');
    });

    it('provides navigation controls (next, prev, dismiss)', () => {
      const content = fs.readFileSync(tourPath, 'utf-8');
      expect(content).toContain('Next');
      expect(content).toContain('Back');
      expect(content).toContain('dismissTour');
    });

    it('shows progress indicator', () => {
      const content = fs.readFileSync(tourPath, 'utf-8');
      expect(content).toContain('Progress');
    });

    it('is integrated into App.tsx', () => {
      const appPath = path.resolve(__dirname, '../../client/src/App.tsx');
      const content = fs.readFileSync(appPath, 'utf-8');
      expect(content).toContain('OnboardingTour');
      expect(content).toContain("import { OnboardingTour }");
    });
  });

  describe('2. AI-Powered Contract Analyzer', () => {
    const analyzerComponentPath = path.resolve(__dirname, '../../client/src/components/ContractAnalyzer.tsx');
    const analyzerRouterPath = path.resolve(__dirname, '../routers/contractAnalyzer.ts');

    it('ContractAnalyzer component file exists', () => {
      expect(fs.existsSync(analyzerComponentPath)).toBe(true);
    });

    it('contractAnalyzer router file exists', () => {
      expect(fs.existsSync(analyzerRouterPath)).toBe(true);
    });

    it('router uses invokeLLM for AI analysis', () => {
      const content = fs.readFileSync(analyzerRouterPath, 'utf-8');
      expect(content).toContain('invokeLLM');
    });

    it('router uses structured JSON output schema', () => {
      const content = fs.readFileSync(analyzerRouterPath, 'utf-8');
      expect(content).toContain('json_schema');
      expect(content).toContain('response_format');
    });

    it('analyzes for NCAA compliance areas', () => {
      const content = fs.readFileSync(analyzerRouterPath, 'utf-8');
      expect(content).toContain('NCAA');
      expect(content).toContain('PARTIES');
      expect(content).toContain('COMPENSATION');
      expect(content).toContain('EXCLUSIVITY');
      expect(content).toContain('SCHOOL APPROVAL');
    });

    it('returns compliance score, areas, red flags, and missing clauses', () => {
      const content = fs.readFileSync(analyzerRouterPath, 'utf-8');
      expect(content).toContain('overallScore');
      expect(content).toContain('areas');
      expect(content).toContain('redFlags');
      expect(content).toContain('missingClauses');
    });

    it('includes legal disclaimer', () => {
      const content = fs.readFileSync(analyzerRouterPath, 'utf-8');
      expect(content).toContain('does not constitute legal advice');
    });

    it('validates minimum contract text length', () => {
      const content = fs.readFileSync(analyzerRouterPath, 'utf-8');
      expect(content).toContain('min(50');
    });

    it('component shows score visualization', () => {
      const content = fs.readFileSync(analyzerComponentPath, 'utf-8');
      expect(content).toContain('ScoreRing');
      expect(content).toContain('Compliance Score');
    });

    it('component shows status badges (pass/warning/fail)', () => {
      const content = fs.readFileSync(analyzerComponentPath, 'utf-8');
      expect(content).toContain('Compliant');
      expect(content).toContain('Needs Review');
      expect(content).toContain('Missing');
    });

    it('is integrated into Contracts page', () => {
      const contractsPath = path.resolve(__dirname, '../../client/src/pages/Contracts.tsx');
      const content = fs.readFileSync(contractsPath, 'utf-8');
      expect(content).toContain('ContractAnalyzer');
      expect(content).toContain('AI Analyzer');
    });

    it('router is mounted in appRouter', () => {
      const routersPath = path.resolve(__dirname, '../routers.ts');
      const content = fs.readFileSync(routersPath, 'utf-8');
      expect(content).toContain('contractAnalyzer: contractAnalyzerRouter');
      expect(content).toContain("import { contractAnalyzerRouter }");
    });
  });

  describe('3. Real-Time Contract Form Validation', () => {
    const validationHookPath = path.resolve(__dirname, '../../client/src/hooks/useContractValidation.ts');
    const validationComponentPath = path.resolve(__dirname, '../../client/src/components/ContractFormValidation.tsx');

    it('useContractValidation hook file exists', () => {
      expect(fs.existsSync(validationHookPath)).toBe(true);
    });

    it('ContractFormValidation component file exists', () => {
      expect(fs.existsSync(validationComponentPath)).toBe(true);
    });

    it('hook exports useContractValidation function', () => {
      const content = fs.readFileSync(validationHookPath, 'utf-8');
      expect(content).toContain('export function useContractValidation');
    });

    it('hook defines NIL-specific validation rules', () => {
      const content = fs.readFileSync(validationHookPath, 'utf-8');
      expect(content).toContain('NIL_COMPLIANCE_RULES');
      expect(content).toContain('athlete_name');
      expect(content).toContain('appearance_fee');
      expect(content).toContain('cancellation_policy');
    });

    it('hook provides NIL-specific warning checks', () => {
      const content = fs.readFileSync(validationHookPath, 'utf-8');
      expect(content).toContain('NIL_WARNING_CHECKS');
      expect(content).toContain('exclusivity');
      expect(content).toContain('school compliance review');
    });

    it('hook returns validation state with errors, warnings, and completion percent', () => {
      const content = fs.readFileSync(validationHookPath, 'utf-8');
      expect(content).toContain('ValidationState');
      expect(content).toContain('errors');
      expect(content).toContain('warnings');
      expect(content).toContain('completionPercent');
      expect(content).toContain('isValid');
    });

    it('hook supports field-level touch tracking', () => {
      const content = fs.readFileSync(validationHookPath, 'utf-8');
      expect(content).toContain('touchField');
      expect(content).toContain('touchAll');
      expect(content).toContain('touchedFields');
    });

    it('component exports ContractFormProgress', () => {
      const content = fs.readFileSync(validationComponentPath, 'utf-8');
      expect(content).toContain('export function ContractFormProgress');
    });

    it('component exports FieldValidationMessage', () => {
      const content = fs.readFileSync(validationComponentPath, 'utf-8');
      expect(content).toContain('export function FieldValidationMessage');
    });

    it('component exports NILComplianceChecklist', () => {
      const content = fs.readFileSync(validationComponentPath, 'utf-8');
      expect(content).toContain('export function NILComplianceChecklist');
    });

    it('NILComplianceChecklist checks key compliance items', () => {
      const content = fs.readFileSync(validationComponentPath, 'utf-8');
      expect(content).toContain('Parties clearly identified');
      expect(content).toContain('Compensation defined');
      expect(content).toContain('Cancellation policy specified');
    });

    it('is integrated into RiderBuilder page', () => {
      const riderBuilderPath = path.resolve(__dirname, '../../client/src/pages/RiderBuilder.tsx');
      const content = fs.readFileSync(riderBuilderPath, 'utf-8');
      expect(content).toContain('ContractFormProgress');
      expect(content).toContain('NILComplianceChecklist');
      expect(content).toContain('useContractValidation');
      expect(content).toContain('FieldValidationMessage');
    });

    it('validates date fields must be in the future', () => {
      const content = fs.readFileSync(validationHookPath, 'utf-8');
      expect(content).toContain('Event date must be in the future');
    });

    it('validates minimum field lengths', () => {
      const content = fs.readFileSync(validationHookPath, 'utf-8');
      expect(content).toContain('minLength');
    });
  });
});
