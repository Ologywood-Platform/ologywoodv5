import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

interface RiderRequirement {
  category: string;
  requirement: string;
  canMeet: boolean;
}

interface RiderAcknowledgmentWorkflowProps {
  artistName: string;
  riderRequirements: RiderRequirement[];
  onAcknowledge?: (acknowledged: boolean, notes?: string) => void;
  isLoading?: boolean;
}

export function RiderAcknowledgmentWorkflow({
  artistName,
  riderRequirements,
  onAcknowledge,
  isLoading = false,
}: RiderAcknowledgmentWorkflowProps) {
  const [acknowledgedRequirements, setAcknowledgedRequirements] = useState<Set<number>>(new Set());
  const [notes, setNotes] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showSummary, setShowSummary] = useState(false);

  const handleRequirementToggle = (index: number) => {
    const newSet = new Set(acknowledgedRequirements);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setAcknowledgedRequirements(newSet);
  };

  const toggleCategory = (category: string) => {
    const newSet = new Set(expandedCategories);
    if (newSet.has(category)) {
      newSet.delete(category);
    } else {
      newSet.add(category);
    }
    setExpandedCategories(newSet);
  };

  const allRequirementsAcknowledged = acknowledgedRequirements.size === riderRequirements.length;
  const requirementsMet = riderRequirements.filter(req => req.canMeet).length;
  const requirementsNotMet = riderRequirements.filter(req => !req.canMeet).length;

  const handleAcknowledge = () => {
    if (!allRequirementsAcknowledged) {
      toast.error('Please acknowledge all requirements before proceeding');
      return;
    }

    if (requirementsNotMet > 0 && !notes.trim()) {
      toast.error('Please provide notes explaining which requirements cannot be met');
      return;
    }

    onAcknowledge?.(true, notes);
    toast.success('Rider requirements acknowledged successfully');
  };

  const groupedByCategory = riderRequirements.reduce(
    (acc, req, index) => {
      if (!acc[req.category]) {
        acc[req.category] = [];
      }
      acc[req.category].push({ ...req, index });
      return acc;
    },
    {} as Record<string, (RiderRequirement & { index: number })[]>
  );

  return (
    <div className="space-y-4 w-full">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Acknowledge Rider Requirements</CardTitle>
          <CardDescription>
            Review and acknowledge {artistName}'s performance requirements before confirming the booking
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Requirements Not Met Alert */}
      {requirementsNotMet > 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-900">
            <strong>{requirementsNotMet} requirement(s) cannot be met.</strong> Please provide details in the notes section below explaining which requirements you cannot fulfill and propose alternatives.
          </AlertDescription>
        </Alert>
      )}

      {/* Progress Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Requirements Acknowledged:</span>
              <span className="font-semibold">
                {acknowledgedRequirements.size} / {riderRequirements.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{
                  width: `${(acknowledgedRequirements.size / riderRequirements.length) * 100}%`,
                }}
              />
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="text-center p-2 bg-green-50 rounded">
                <p className="text-green-900 font-semibold">{requirementsMet}</p>
                <p className="text-green-700">Can Meet</p>
              </div>
              <div className="text-center p-2 bg-amber-50 rounded">
                <p className="text-amber-900 font-semibold">{requirementsNotMet}</p>
                <p className="text-amber-700">Cannot Meet</p>
              </div>
              <div className="text-center p-2 bg-blue-50 rounded">
                <p className="text-blue-900 font-semibold">{acknowledgedRequirements.size}</p>
                <p className="text-blue-700">Acknowledged</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requirements by Category */}
      <div className="space-y-3">
        {Object.entries(groupedByCategory).map(([category, requirements]) => (
          <Card key={category}>
            <div
              className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
              onClick={() => toggleCategory(category)}
            >
              <div className="flex items-center gap-3 flex-1">
                <h3 className="font-semibold text-lg capitalize">{category}</h3>
                <span className="text-sm text-gray-500">
                  ({requirements.filter(r => acknowledgedRequirements.has(r.index)).length}/{requirements.length})
                </span>
              </div>
              {expandedCategories.has(category) ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </div>

            {expandedCategories.has(category) && (
              <CardContent className="space-y-4 border-t pt-4">
                {requirements.map((req) => (
                  <div
                    key={req.index}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      acknowledgedRequirements.has(req.index)
                        ? 'border-green-200 bg-green-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={`req-${req.index}`}
                        checked={acknowledgedRequirements.has(req.index)}
                        onCheckedChange={() => handleRequirementToggle(req.index)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <Label htmlFor={`req-${req.index}`} className="cursor-pointer">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{req.requirement}</span>
                            {req.canMeet ? (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                Can Meet
                              </span>
                            ) : (
                              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                                Cannot Meet
                              </span>
                            )}
                          </div>
                        </Label>
                        <p className="text-sm text-gray-600 mt-1">
                          {req.canMeet
                            ? 'You have confirmed you can meet this requirement.'
                            : 'You have indicated you cannot meet this requirement. Please explain in the notes section.'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Notes Section */}
      {requirementsNotMet > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-lg">Notes on Unmet Requirements</CardTitle>
            <CardDescription>
              Explain which requirements you cannot meet and propose alternatives
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Example: We cannot provide a dressing room, but we can offer a private green room with comfortable seating. We also cannot provide catering, but there are several restaurants within walking distance..."
              className="min-h-32"
            />
            <p className="text-sm text-amber-700 mt-2">
              These notes will be sent to {artistName} for review and approval.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Summary Section */}
      {allRequirementsAcknowledged && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <CardTitle className="text-lg text-green-900">Ready to Proceed</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-green-900">
              {requirementsNotMet === 0
                ? `You have confirmed you can meet all of ${artistName}'s requirements. You're ready to book this artist!`
                : `You have acknowledged all requirements. The notes about unmet requirements will be sent to ${artistName} for approval.`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end">
        <Button
          variant="outline"
          onClick={() => setShowSummary(!showSummary)}
          disabled={isLoading}
        >
          {showSummary ? 'Hide' : 'Show'} Summary
        </Button>
        <Button
          onClick={handleAcknowledge}
          disabled={isLoading || !allRequirementsAcknowledged}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? 'Processing...' : 'Confirm Booking'}
        </Button>
      </div>

      {/* Summary Modal */}
      {showSummary && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>Booking Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Artist</p>
              <p className="font-semibold">{artistName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Requirements Acknowledged</p>
              <p className="font-semibold">
                {acknowledgedRequirements.size} of {riderRequirements.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Requirements Status</p>
              <div className="flex gap-2 mt-1">
                <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                  {requirementsMet} Can Meet
                </span>
                {requirementsNotMet > 0 && (
                  <span className="text-sm bg-amber-100 text-amber-800 px-2 py-1 rounded">
                    {requirementsNotMet} Cannot Meet
                  </span>
                )}
              </div>
            </div>
            {notes && (
              <div>
                <p className="text-sm text-gray-600">Notes</p>
                <p className="text-sm bg-white p-2 rounded border">{notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
