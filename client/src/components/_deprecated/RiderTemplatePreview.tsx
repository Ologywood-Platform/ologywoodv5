import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { AlertCircle, CheckCircle2, Clock, Users, DollarSign, Music } from 'lucide-react';

interface RiderTemplateData {
  templateName?: string;
  description?: string;
  performanceType?: string;
  performanceDuration?: number;
  setupTimeRequired?: number;
  soundcheckTimeRequired?: number;
  numberOfPerformers?: number;
  paSystemRequired?: boolean;
  lightingRequired?: boolean;
  microphoneCount?: number;
  monitorMixRequired?: boolean;
  stageDimensions?: string;
  powerRequirements?: string;
  bringingOwnEquipment?: boolean;
  equipmentList?: string;
  dressingRoomRequired?: boolean;
  cateringProvided?: boolean;
  dietaryRestrictions?: string;
  parkingRequired?: boolean;
  performanceFee?: number;
  feeType?: 'fixed' | 'percentage';
  paymentMethod?: string;
  paymentTiming?: string;
  depositRequired?: boolean;
  depositAmount?: number;
  specialRequests?: string;
  cancellationPolicy?: string;
  emergencyContact?: string;
}

interface RiderTemplatePreviewProps {
  riderData?: RiderTemplateData;
  artistName?: string;
  isLoading?: boolean;
}

export function RiderTemplatePreview({
  riderData,
  artistName = 'Artist',
  isLoading = false,
}: RiderTemplatePreviewProps) {
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Performance Requirements</CardTitle>
          <CardDescription>Loading rider information...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-20 bg-gray-200 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (!riderData) {
    return (
      <Card className="w-full border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            No Rider Template
          </CardTitle>
          <CardDescription>This artist hasn't set up performance requirements yet.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const performanceType = riderData.performanceType || 'Not specified';
  const duration = riderData.performanceDuration || 0;
  const setupTime = riderData.setupTimeRequired || 0;
  const feeType = riderData.feeType === 'percentage' ? '%' : '$';
  const fee = riderData.performanceFee || 0;

  return (
    <div className="space-y-4 w-full">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{riderData.templateName || 'Performance Requirements'}</CardTitle>
          <CardDescription>{riderData.description || `${artistName}'s standard performance requirements`}</CardDescription>
        </CardHeader>
      </Card>

      {/* Quick Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Performance Type</p>
              <p className="font-semibold capitalize">{performanceType}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Clock className="h-4 w-4" /> Duration
              </p>
              <p className="font-semibold">{duration} min</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Setup Time</p>
              <p className="font-semibold">{setupTime} min</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Users className="h-4 w-4" /> Performers
              </p>
              <p className="font-semibold">{riderData.numberOfPerformers || 1}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Music className="h-5 w-5" />
            Technical Requirements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* PA System */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              {riderData.paSystemRequired ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">PA System</p>
                <p className="text-sm text-gray-600">
                  {riderData.paSystemRequired ? 'Required' : 'Not required'}
                </p>
              </div>
            </div>

            {/* Lighting */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              {riderData.lightingRequired ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">Lighting</p>
                <p className="text-sm text-gray-600">
                  {riderData.lightingRequired ? 'Required' : 'Not required'}
                </p>
              </div>
            </div>

            {/* Monitor Mix */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              {riderData.monitorMixRequired ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">Monitor Mix</p>
                <p className="text-sm text-gray-600">
                  {riderData.monitorMixRequired ? 'Required' : 'Not required'}
                </p>
              </div>
            </div>

            {/* Own Equipment */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              {riderData.bringingOwnEquipment ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">Own Equipment</p>
                <p className="text-sm text-gray-600">
                  {riderData.bringingOwnEquipment ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          </div>

          {/* Additional Technical Details */}
          <div className="space-y-3 border-t pt-4">
            {riderData.microphoneCount && (
              <div className="flex justify-between">
                <span className="text-gray-600">Microphones Needed:</span>
                <span className="font-semibold">{riderData.microphoneCount}</span>
              </div>
            )}
            {riderData.stageDimensions && (
              <div className="flex justify-between">
                <span className="text-gray-600">Stage Dimensions:</span>
                <span className="font-semibold">{riderData.stageDimensions}</span>
              </div>
            )}
            {riderData.powerRequirements && (
              <div className="flex justify-between">
                <span className="text-gray-600">Power Requirements:</span>
                <span className="font-semibold">{riderData.powerRequirements}</span>
              </div>
            )}
            {riderData.bringingOwnEquipment && riderData.equipmentList && (
              <div className="space-y-2">
                <p className="text-gray-600">Equipment Being Brought:</p>
                <p className="text-sm bg-blue-50 p-2 rounded text-blue-900">{riderData.equipmentList}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hospitality Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Hospitality Requirements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Dressing Room */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              {riderData.dressingRoomRequired ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">Dressing Room</p>
                <p className="text-sm text-gray-600">
                  {riderData.dressingRoomRequired ? 'Required' : 'Not required'}
                </p>
              </div>
            </div>

            {/* Catering */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              {riderData.cateringProvided ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">Catering</p>
                <p className="text-sm text-gray-600">
                  {riderData.cateringProvided ? 'Provided' : 'Not provided'}
                </p>
              </div>
            </div>

            {/* Parking */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              {riderData.parkingRequired ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">Parking</p>
                <p className="text-sm text-gray-600">
                  {riderData.parkingRequired ? 'Required' : 'Not required'}
                </p>
              </div>
            </div>
          </div>

          {riderData.cateringProvided && riderData.dietaryRestrictions && (
            <div className="space-y-2 border-t pt-4">
              <p className="text-gray-600">Dietary Restrictions:</p>
              <p className="text-sm bg-amber-50 p-2 rounded text-amber-900">{riderData.dietaryRestrictions}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial Terms */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Financial Terms
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Performance Fee</p>
              <p className="text-2xl font-bold text-blue-900">
                {feeType}{fee}
                {riderData.feeType === 'percentage' && ' of ticket sales'}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Fee Type</p>
              <p className="text-lg font-semibold capitalize">
                {riderData.feeType === 'percentage' ? 'Percentage' : 'Fixed'}
              </p>
            </div>
          </div>

          <div className="space-y-3 border-t pt-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method:</span>
              <span className="font-semibold capitalize">{riderData.paymentMethod?.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Timing:</span>
              <span className="font-semibold capitalize">{riderData.paymentTiming?.replace('_', ' ')}</span>
            </div>
            {riderData.depositRequired && (
              <div className="flex justify-between p-3 bg-orange-50 rounded-lg">
                <span className="text-gray-600">Deposit Required:</span>
                <span className="font-semibold text-orange-900">${riderData.depositAmount || 0}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Special Requests & Policies */}
      {(riderData.specialRequests || riderData.cancellationPolicy || riderData.emergencyContact) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {riderData.specialRequests && (
              <div className="space-y-2">
                <p className="font-semibold">Special Requests</p>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{riderData.specialRequests}</p>
              </div>
            )}
            {riderData.cancellationPolicy && (
              <div className="space-y-2 border-t pt-4">
                <p className="font-semibold">Cancellation Policy</p>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{riderData.cancellationPolicy}</p>
              </div>
            )}
            {riderData.emergencyContact && (
              <div className="space-y-2 border-t pt-4">
                <p className="font-semibold">Emergency Contact</p>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{riderData.emergencyContact}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Info Banner */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> These are the performance requirements for this artist. Please review carefully before booking. If you have any questions or cannot meet certain requirements, contact the artist through the messaging system to discuss alternatives.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
