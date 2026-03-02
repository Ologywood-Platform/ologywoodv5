import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle, AlertCircle, Edit2, Send, X } from 'lucide-react';
import { toast } from 'sonner';

interface RiderTemplate {
  id: number;
  templateName: string;
  description?: string | null;
  [key: string]: any;
}

interface ProposedModification {
  field: string;
  originalValue: any;
  proposedValue: any;
  reason?: string;
}

interface RiderAcknowledgmentFormProps {
  riderTemplate: RiderTemplate;
  bookingId: number;
  artistName: string;
  venueName: string;
  isVenue?: boolean;
  onAcknowledge?: () => void;
  onProposeModifications?: (modifications: ProposedModification[]) => void;
  onApproveModifications?: () => void;
  onRejectModifications?: (reason: string) => void;
  currentStatus?: 'pending' | 'acknowledged' | 'accepted' | 'modifications_proposed' | 'rejected';
  proposedModifications?: ProposedModification[];
}

export function RiderAcknowledgmentForm({
  riderTemplate,
  bookingId,
  artistName,
  venueName,
  isVenue = false,
  onAcknowledge,
  onProposeModifications,
  onApproveModifications,
  onRejectModifications,
  currentStatus = 'pending',
  proposedModifications = [],
}: RiderAcknowledgmentFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedModifications, setSelectedModifications] = useState<ProposedModification[]>([]);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAcknowledge = async () => {
    setIsLoading(true);
    try {
      onAcknowledge?.();
      toast.success('Rider acknowledged successfully');
    } catch (error) {
      toast.error('Failed to acknowledge rider');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProposeModifications = async () => {
    if (selectedModifications.length === 0) {
      toast.error('Please select at least one modification');
      return;
    }
    setIsLoading(true);
    try {
      onProposeModifications?.(selectedModifications);
      toast.success('Modifications proposed successfully');
      setIsEditing(false);
      setSelectedModifications([]);
    } catch (error) {
      toast.error('Failed to propose modifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveModifications = async () => {
    setIsLoading(true);
    try {
      onApproveModifications?.();
      toast.success('Modifications approved');
    } catch (error) {
      toast.error('Failed to approve modifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectModifications = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    setIsLoading(true);
    try {
      onRejectModifications?.(rejectionReason);
      toast.success('Modifications rejected');
      setShowRejectionForm(false);
      setRejectionReason('');
    } catch (error) {
      toast.error('Failed to reject modifications');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    const statusConfig = {
      pending: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800' },
      acknowledged: { label: 'Acknowledged', color: 'bg-blue-100 text-blue-800' },
      accepted: { label: 'Accepted', color: 'bg-green-100 text-green-800' },
      modifications_proposed: { label: 'Modifications Proposed', color: 'bg-orange-100 text-orange-800' },
      rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
    };
    const config = statusConfig[currentStatus];
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Rider Acknowledgment</CardTitle>
            <CardDescription>Review and acknowledge performance requirements</CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Booking Info */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>{artistName}</strong> has submitted a rider for <strong>{venueName}</strong>. 
            {isVenue ? ' Please review and acknowledge the requirements.' : ' Awaiting venue acknowledgment.'}
          </AlertDescription>
        </Alert>

        {/* Rider Template Summary */}
        <div className="border rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-sm">Rider Template: {riderTemplate.templateName}</h3>
          {riderTemplate.description && (
            <p className="text-sm text-gray-600">{riderTemplate.description}</p>
          )}
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            {riderTemplate.performanceDuration && (
              <div>
                <span className="font-medium">Duration:</span> {riderTemplate.performanceDuration} min
              </div>
            )}
            {riderTemplate.numberOfPerformers && (
              <div>
                <span className="font-medium">Performers:</span> {riderTemplate.numberOfPerformers}
              </div>
            )}
            {riderTemplate.setupTimeRequired && (
              <div>
                <span className="font-medium">Setup:</span> {riderTemplate.setupTimeRequired} min
              </div>
            )}
            {riderTemplate.soundcheckTimeRequired && (
              <div>
                <span className="font-medium">Soundcheck:</span> {riderTemplate.soundcheckTimeRequired} min
              </div>
            )}
          </div>
        </div>

        {/* Key Requirements */}
        <div className="border rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-sm">Key Requirements</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {riderTemplate.paSystemRequired && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>PA System Required</span>
              </div>
            )}
            {riderTemplate.lightingRequired && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Lighting ({riderTemplate.lightingType || 'Standard'})</span>
              </div>
            )}
            {riderTemplate.cateringProvided && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Catering Required</span>
              </div>
            )}
            {riderTemplate.dressingRoomRequired && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Dressing Room</span>
              </div>
            )}
            {riderTemplate.parkingRequired && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Parking ({riderTemplate.parkingType || 'General'})</span>
              </div>
            )}
            {riderTemplate.accommodationProvided && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Hotel ({riderTemplate.numberOfRooms || 1} room{riderTemplate.numberOfRooms !== 1 ? 's' : ''})</span>
              </div>
            )}
          </div>
        </div>

        {/* Proposed Modifications Display */}
        {proposedModifications.length > 0 && (
          <div className="border rounded-lg p-4 space-y-3 bg-orange-50">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              Proposed Modifications
            </h3>
            <div className="space-y-2">
              {proposedModifications.map((mod, idx) => (
                <div key={idx} className="bg-white p-3 rounded border border-orange-200 text-sm">
                  <div className="font-medium text-gray-700">{mod.field}</div>
                  <div className="text-gray-600 mt-1">
                    <span className="line-through">Original: {String(mod.originalValue)}</span>
                  </div>
                  <div className="text-green-700 mt-1">
                    <span>Proposed: {String(mod.proposedValue)}</span>
                  </div>
                  {mod.reason && (
                    <div className="text-gray-600 mt-2 italic">
                      Reason: {mod.reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Venue Actions */}
        {isVenue && (
          <Tabs defaultValue="acknowledge" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="acknowledge">Acknowledge</TabsTrigger>
              <TabsTrigger value="modify">Propose Changes</TabsTrigger>
            </TabsList>

            <TabsContent value="acknowledge" className="space-y-4">
              {currentStatus === 'pending' && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Click below to acknowledge that you have reviewed and can meet these requirements.
                  </AlertDescription>
                </Alert>
              )}
              
              {currentStatus === 'acknowledged' && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    You have acknowledged this rider. The artist will be notified.
                  </AlertDescription>
                </Alert>
              )}

              {currentStatus === 'pending' && (
                <Button 
                  onClick={handleAcknowledge} 
                  disabled={isLoading}
                  className="w-full gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Acknowledge Rider
                </Button>
              )}
            </TabsContent>

            <TabsContent value="modify" className="space-y-4">
              {!isEditing ? (
                <Button 
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <Edit2 className="h-4 w-4" />
                  Propose Modifications
                </Button>
              ) : (
                <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
                  <div className="text-sm font-medium">
                    Select requirements you'd like to modify:
                  </div>
                  
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {/* Technical Requirements */}
                    <div className="space-y-2">
                      <div className="font-medium text-xs text-gray-600 uppercase">Technical</div>
                      {riderTemplate.paSystemRequired && (
                        <label className="flex items-center gap-2 text-sm cursor-pointer p-2 hover:bg-white rounded">
                          <input 
                            type="checkbox" 
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedModifications([...selectedModifications, {
                                  field: 'PA System Required',
                                  originalValue: true,
                                  proposedValue: false,
                                }]);
                              } else {
                                setSelectedModifications(selectedModifications.filter(m => m.field !== 'PA System Required'));
                              }
                            }}
                          />
                          <span>PA System Required</span>
                        </label>
                      )}
                      {riderTemplate.lightingRequired && (
                        <label className="flex items-center gap-2 text-sm cursor-pointer p-2 hover:bg-white rounded">
                          <input 
                            type="checkbox"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedModifications([...selectedModifications, {
                                  field: 'Lighting Required',
                                  originalValue: true,
                                  proposedValue: false,
                                }]);
                              } else {
                                setSelectedModifications(selectedModifications.filter(m => m.field !== 'Lighting Required'));
                              }
                            }}
                          />
                          <span>Special Lighting ({riderTemplate.lightingType})</span>
                        </label>
                      )}
                    </div>

                    {/* Hospitality Requirements */}
                    <div className="space-y-2">
                      <div className="font-medium text-xs text-gray-600 uppercase">Hospitality</div>
                      {riderTemplate.cateringProvided && (
                        <label className="flex items-center gap-2 text-sm cursor-pointer p-2 hover:bg-white rounded">
                          <input 
                            type="checkbox"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedModifications([...selectedModifications, {
                                  field: 'Catering',
                                  originalValue: true,
                                  proposedValue: false,
                                }]);
                              } else {
                                setSelectedModifications(selectedModifications.filter(m => m.field !== 'Catering'));
                              }
                            }}
                          />
                          <span>Catering</span>
                        </label>
                      )}
                      {riderTemplate.dressingRoomRequired && (
                        <label className="flex items-center gap-2 text-sm cursor-pointer p-2 hover:bg-white rounded">
                          <input 
                            type="checkbox"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedModifications([...selectedModifications, {
                                  field: 'Dressing Room',
                                  originalValue: true,
                                  proposedValue: false,
                                }]);
                              } else {
                                setSelectedModifications(selectedModifications.filter(m => m.field !== 'Dressing Room'));
                              }
                            }}
                          />
                          <span>Dressing Room</span>
                        </label>
                      )}
                      {riderTemplate.parkingRequired && (
                        <label className="flex items-center gap-2 text-sm cursor-pointer p-2 hover:bg-white rounded">
                          <input 
                            type="checkbox"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedModifications([...selectedModifications, {
                                  field: 'Parking',
                                  originalValue: riderTemplate.parkingType,
                                  proposedValue: 'Not Available',
                                }]);
                              } else {
                                setSelectedModifications(selectedModifications.filter(m => m.field !== 'Parking'));
                              }
                            }}
                          />
                          <span>Parking</span>
                        </label>
                      )}
                    </div>
                  </div>

                  <Textarea
                    placeholder="Explain why you need these modifications..."
                    className="text-sm"
                    rows={3}
                  />

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => setIsEditing(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleProposeModifications}
                      disabled={isLoading || selectedModifications.length === 0}
                      className="flex-1 gap-2"
                    >
                      <Send className="h-4 w-4" />
                      Propose Changes
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Artist Actions */}
        {!isVenue && currentStatus === 'modifications_proposed' && (
          <div className="space-y-4 border rounded-lg p-4 bg-blue-50">
            <h3 className="font-semibold text-sm">Respond to Modifications</h3>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                The venue has proposed modifications to your rider. Please review and respond.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button 
                onClick={handleApproveModifications}
                disabled={isLoading}
                className="flex-1 gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Approve Changes
              </Button>
              <Button 
                onClick={() => setShowRejectionForm(!showRejectionForm)}
                variant="outline"
                className="flex-1"
              >
                Reject
              </Button>
            </div>

            {showRejectionForm && (
              <div className="space-y-2">
                <Textarea
                  placeholder="Explain why you cannot accept these modifications..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setShowRejectionForm(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleRejectModifications}
                    disabled={isLoading || !rejectionReason.trim()}
                    variant="destructive"
                    className="flex-1"
                  >
                    Send Rejection
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {currentStatus === 'accepted' && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Rider has been finalized and accepted by both parties. You're all set for the performance!
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
