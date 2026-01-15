import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle2, XCircle, MessageSquare, Edit2 } from 'lucide-react';
import { ModificationTimeline } from './ModificationTimeline';
import { toast } from 'sonner';

interface RiderModificationNegotiationUIProps {
  riderTemplateId: number;
  bookingId: number;
  acknowledgmentId: number;
  currentUserRole: 'artist' | 'venue';
  currentStatus: 'pending' | 'acknowledged' | 'modifications_proposed' | 'accepted' | 'rejected';
  riderData: Record<string, any>;
  modificationHistory: any[];
}

interface ProposedModification {
  fieldName: string;
  originalValue: string;
  proposedValue: string;
  reason: string;
}

export function RiderModificationNegotiationUI({
  riderTemplateId,
  bookingId,
  acknowledgmentId,
  currentUserRole,
  currentStatus,
  riderData,
  modificationHistory,
}: RiderModificationNegotiationUIProps) {
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [selectedField, setSelectedField] = useState<string>('');
  const [proposedValue, setProposedValue] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const riderFields = Object.keys(riderData).filter(key => 
    !['id', 'artistId', 'createdAt', 'updatedAt', 'isPublished', 'version'].includes(key)
  );

  const handleProposeModification = async () => {
    if (!selectedField || !proposedValue || !reason) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      // In a real implementation, call TRPC endpoint
      // await trpc.riderAcknowledgment.proposeModification.mutate({
      //   acknowledgmentId,
      //   fieldName: selectedField,
      //   originalValue: riderData[selectedField],
      //   proposedValue,
      //   reason,
      //   notes,
      // });

      toast.success('Modification proposed successfully');
      setShowProposalForm(false);
      setSelectedField('');
      setProposedValue('');
      setReason('');
      setNotes('');
    } catch (error) {
      toast.error('Failed to propose modification');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveModification = async (modificationId: number) => {
    setIsSubmitting(true);
    try {
      // In a real implementation, call TRPC endpoint
      // await trpc.riderAcknowledgment.approveModifications.mutate({
      //   acknowledgmentId,
      //   modificationIds: [modificationId],
      // });

      toast.success('Modification approved');
    } catch (error) {
      toast.error('Failed to approve modification');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectModification = async (modificationId: number) => {
    setIsSubmitting(true);
    try {
      // In a real implementation, call TRPC endpoint
      // await trpc.riderAcknowledgment.rejectModifications.mutate({
      //   acknowledgmentId,
      //   modificationIds: [modificationId],
      //   reason: 'Modification not acceptable',
      // });

      toast.success('Modification rejected');
    } catch (error) {
      toast.error('Failed to reject modification');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcknowledge = async () => {
    setIsSubmitting(true);
    try {
      // In a real implementation, call TRPC endpoint
      // await trpc.riderAcknowledgment.acknowledge.mutate({
      //   acknowledgmentId,
      //   notes,
      // });

      toast.success('Rider acknowledged successfully');
    } catch (error) {
      toast.error('Failed to acknowledge rider');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalize = async () => {
    setIsSubmitting(true);
    try {
      // In a real implementation, call TRPC endpoint
      // await trpc.riderAcknowledgment.finalize.mutate({
      //   acknowledgmentId,
      // });

      toast.success('Rider finalized successfully');
    } catch (error) {
      toast.error('Failed to finalize rider');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'acknowledged':
        return 'bg-green-100 text-green-800';
      case 'modifications_proposed':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Rider Negotiation Status</CardTitle>
              <CardDescription>Track and manage rider modifications</CardDescription>
            </div>
            <Badge className={getStatusColor(currentStatus)}>
              {currentStatus.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Action Buttons */}
      {currentUserRole === 'venue' && currentStatus === 'pending' && (
        <div className="flex gap-2">
          <Button
            onClick={handleAcknowledge}
            disabled={isSubmitting}
            className="flex-1"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Acknowledge Rider
          </Button>
          <Button
            onClick={() => setShowProposalForm(true)}
            variant="outline"
            disabled={isSubmitting}
            className="flex-1"
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Propose Modifications
          </Button>
        </div>
      )}

      {currentUserRole === 'artist' && currentStatus === 'modifications_proposed' && (
        <div className="flex gap-2">
          <Button
            onClick={handleFinalize}
            disabled={isSubmitting}
            className="flex-1"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Accept All Modifications
          </Button>
          <Button
            onClick={() => setShowProposalForm(true)}
            variant="outline"
            disabled={isSubmitting}
            className="flex-1"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Counter-Propose
          </Button>
        </div>
      )}

      {/* Modification Proposal Form */}
      {showProposalForm && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="text-lg">
              {currentUserRole === 'venue' ? 'Propose Modification' : 'Counter-Propose Modification'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Field Selection */}
            <div>
              <label className="text-sm font-semibold mb-2 block">Select Field to Modify</label>
              <Select value={selectedField} onValueChange={setSelectedField}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a rider field..." />
                </SelectTrigger>
                <SelectContent>
                  {riderFields.map(field => (
                    <SelectItem key={field} value={field}>
                      {field.replace(/([A-Z])/g, ' $1').trim()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Current Value Display */}
            {selectedField && (
              <div>
                <label className="text-sm font-semibold mb-2 block">Current Value</label>
                <div className="bg-white p-3 rounded border text-sm font-mono break-words">
                  {String(riderData[selectedField] || 'N/A')}
                </div>
              </div>
            )}

            {/* Proposed Value */}
            <div>
              <label className="text-sm font-semibold mb-2 block">Proposed Value</label>
              <Input
                placeholder="Enter the new value..."
                value={proposedValue}
                onChange={(e) => setProposedValue(e.target.value)}
              />
            </div>

            {/* Reason */}
            <div>
              <label className="text-sm font-semibold mb-2 block">Reason for Change</label>
              <Textarea
                placeholder="Explain why this modification is necessary..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>

            {/* Additional Notes */}
            <div>
              <label className="text-sm font-semibold mb-2 block">Additional Notes (Optional)</label>
              <Textarea
                placeholder="Any other details to share..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleProposeModification}
                disabled={isSubmitting}
                className="flex-1"
              >
                {currentUserRole === 'venue' ? 'Propose Modification' : 'Send Counter-Proposal'}
              </Button>
              <Button
                onClick={() => {
                  setShowProposalForm(false);
                  setSelectedField('');
                  setProposedValue('');
                  setReason('');
                  setNotes('');
                }}
                variant="outline"
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modification Timeline */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Modification History</h3>
        <ModificationTimeline 
          events={modificationHistory}
          currentUserRole={currentUserRole}
        />
      </div>

      {/* Pending Modifications Alert */}
      {modificationHistory.some(m => m.type === 'proposed' || m.type === 'counter_proposed') && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <CardTitle className="text-base">Pending Modifications</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-800">
              {currentUserRole === 'artist' 
                ? 'The venue has proposed modifications to your rider. Please review and respond.'
                : 'You have proposed modifications awaiting artist response.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Negotiation Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Negotiation Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {modificationHistory.filter(m => m.type === 'approved').length}
              </p>
              <p className="text-sm text-muted-foreground">Approved</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {modificationHistory.filter(m => m.type === 'proposed' || m.type === 'counter_proposed').length}
              </p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {modificationHistory.filter(m => m.type === 'rejected').length}
              </p>
              <p className="text-sm text-muted-foreground">Rejected</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
