import React, { useState } from 'react';
import { trpc } from '../lib/trpc';
import { Button } from './ui/button';
import { Card } from './ui/card';

/**
 * TestScenarioRunner Component
 * Executes pre-configured test workflows to validate complete booking lifecycle
 */
export function TestScenarioRunner() {
  const [loading, setLoading] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string>('complete-booking');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const completeBookingMutation = trpc.testWorkflows.runCompleteBookingWorkflow.useMutation();
  const paymentMutation = trpc.testWorkflows.runPaymentWorkflow.useMutation();
  const contractMutation = trpc.testWorkflows.runContractSigningWorkflow.useMutation();
  const lifecycleMutation = trpc.testWorkflows.runFullBookingLifecycle.useMutation();

  const scenarios = [
    {
      id: 'complete-booking',
      name: 'Complete Booking Flow',
      description: 'Create user, artist, venue, send booking request, accept, and confirm'
    },
    {
      id: 'payment-processing',
      name: 'Payment Processing',
      description: 'Process deposit and full payment through Stripe'
    },
    {
      id: 'contract-signing',
      name: 'Contract Signing',
      description: 'Create contract, sign with both parties, generate PDF'
    },
    {
      id: 'full-lifecycle',
      name: 'Full Lifecycle',
      description: 'Complete workflow from booking through contract to payment'
    }
  ];

  const handleRunScenario = async () => {
    setLoading(true);
    setError(null);
    try {
      let result;
      switch (selectedScenario) {
        case 'complete-booking':
          result = await completeBookingMutation.mutateAsync({
            artistName: 'Test Artist',
            venueName: 'Test Venue'
          });
          break;
        case 'payment-processing':
          result = await paymentMutation.mutateAsync({
            depositAmount: 500,
            fullAmount: 2000
          });
          break;
        case 'contract-signing':
          result = await contractMutation.mutateAsync({
            contractType: 'ryder'
          });
          break;
        case 'full-lifecycle':
          result = await lifecycleMutation.mutateAsync({
            includePayment: true,
            includeContract: true,
            includeReview: true
          });
          break;
        default:
          throw new Error('Unknown scenario');
      }
      setResult(result);
    } catch (err: any) {
      setError(err.message || 'Failed to run scenario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Test Scenario Runner</h3>
        <p className="text-sm text-gray-600 mb-6">
          Execute pre-configured test workflows to validate complete booking lifecycle scenarios
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-3">Select Scenario</label>
            <div className="grid grid-cols-1 gap-3">
              {scenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  onClick={() => setSelectedScenario(scenario.id)}
                  className={`p-4 border rounded cursor-pointer transition ${
                    selectedScenario === scenario.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <h4 className="font-medium">{scenario.name}</h4>
                  <p className="text-sm text-gray-600">{scenario.description}</p>
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={handleRunScenario}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Running Scenario...' : 'Run Selected Scenario'}
          </Button>

          {result && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
              <h4 className="font-medium text-green-900 mb-2">Scenario Generated</h4>
              <div className="space-y-3 text-sm text-green-800">
                {result.workflow && (
                  <>
                    <p><strong>Steps:</strong> {result.workflow.steps?.length || 0}</p>
                    <p><strong>Expected Outcome:</strong> {result.workflow.expectedOutcome}</p>
                    {result.workflow.steps && (
                      <div className="mt-3 space-y-1 bg-white p-3 rounded border border-green-200">
                        {result.workflow.steps.map((step: any, idx: number) => (
                          <div key={idx} className="text-xs">
                            <strong>Step {step.step}:</strong> {step.action}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
                {result.lifecycle && (
                  <>
                    <p><strong>Estimated Duration:</strong> {result.lifecycle.estimatedDuration}</p>
                    <p><strong>Phases:</strong> {result.lifecycle.phases?.length || 0}</p>
                    {result.lifecycle.phases && (
                      <div className="mt-3 space-y-2 bg-white p-3 rounded border border-green-200">
                        {result.lifecycle.phases.map((phase: any, idx: number) => (
                          <div key={idx} className="text-xs">
                            <strong>{phase.phase}:</strong>
                            <ul className="ml-4 mt-1">
                              {phase.steps.map((step: string, sidx: number) => (
                                <li key={sidx}>• {step}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
              <pre className="text-xs mt-4 overflow-auto max-h-40 bg-white p-2 rounded border border-green-200">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded">
              <h4 className="font-medium text-red-900 mb-2">Scenario Failed</h4>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6 bg-amber-50 border-amber-200">
        <h4 className="font-medium mb-3">Scenario Details</h4>
        <div className="text-sm space-y-3 text-gray-700">
          <div>
            <strong>Complete Booking Flow:</strong> Validates end-to-end booking creation and acceptance
          </div>
          <div>
            <strong>Payment Processing:</strong> Tests Stripe integration for deposits and full payments
          </div>
          <div>
            <strong>Contract Signing:</strong> Verifies digital signature capture and PDF generation
          </div>
          <div>
            <strong>Full Lifecycle:</strong> Executes all workflows in sequence to catch integration issues
          </div>
        </div>
      </Card>
    </div>
  );
}
