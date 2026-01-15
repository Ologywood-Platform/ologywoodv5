import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, ChevronUp, Check, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface RiderTemplate {
  id: number;
  templateName: string;
  description?: string;
  genre?: string;
  performanceType?: string;
  performanceDuration?: number;
  setupTimeRequired?: number;
  paSystemRequired?: boolean;
  microphoneCount?: number;
  lightingRequired?: boolean;
  stageSize?: string;
  dressroomRequired?: boolean;
  cateringProvided?: boolean;
  beverageOptions?: string;
  parkingRequired?: boolean;
  parkingSpaces?: number;
  travelAccommodation?: string;
  merchandiseAllowed?: boolean;
  promotionRequirements?: string;
  additionalNotes?: string;
  [key: string]: any;
}

interface RiderComparisonToolProps {
  riders: RiderTemplate[];
  onSelect?: (riderId: number) => void;
  onCompare?: (riderIds: number[]) => void;
}

const COMPARISON_CATEGORIES = {
  'Technical Requirements': [
    'paSystemRequired',
    'microphoneCount',
    'lightingRequired',
    'stageSize',
    'setupTimeRequired',
  ],
  'Hospitality': [
    'dressroomRequired',
    'cateringProvided',
    'beverageOptions',
    'parkingRequired',
    'parkingSpaces',
  ],
  'Travel & Accommodation': [
    'travelAccommodation',
    'performanceDuration',
  ],
  'Promotion & Merchandise': [
    'merchandiseAllowed',
    'promotionRequirements',
  ],
  'Additional': [
    'additionalNotes',
  ],
};

export function RiderComparisonTool({ riders, onSelect, onCompare }: RiderComparisonToolProps) {
  const [selectedRiders, setSelectedRiders] = useState<number[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('Technical Requirements');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date'>('name');

  const filteredRiders = useMemo(() => {
    let filtered = riders.filter(r =>
      r.templateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortBy === 'name') {
      filtered.sort((a, b) => a.templateName.localeCompare(b.templateName));
    }

    return filtered;
  }, [riders, searchTerm, sortBy]);

  const toggleRiderSelection = (riderId: number) => {
    setSelectedRiders(prev =>
      prev.includes(riderId)
        ? prev.filter(id => id !== riderId)
        : [...prev, riderId]
    );
  };

  const handleCompare = () => {
    if (selectedRiders.length < 2) {
      toast.error('Please select at least 2 riders to compare');
      return;
    }

    if (selectedRiders.length > 4) {
      toast.error('You can compare up to 4 riders at a time');
      return;
    }

    onCompare?.(selectedRiders);
  };

  const getComparisonValue = (rider: RiderTemplate, field: string): any => {
    const value = rider[field];
    if (value === undefined || value === null) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return value;
    return String(value);
  };

  const formatFieldName = (field: string): string => {
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  const getValueColor = (value: any): string => {
    if (value === 'Yes' || value === true) return 'text-green-600';
    if (value === 'No' || value === false) return 'text-red-600';
    return 'text-gray-600';
  };

  const comparisonRiders = selectedRiders
    .map(id => riders.find(r => r.id === id))
    .filter(Boolean) as RiderTemplate[];

  return (
    <div className="space-y-6">
      {/* Rider Selection Section */}
      <Card>
        <CardHeader>
          <CardTitle>Select Riders to Compare</CardTitle>
          <CardDescription>
            Choose 2-4 riders to compare side by side
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Sort */}
          <div className="flex gap-3">
            <Input
              placeholder="Search riders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select value={sortBy} onValueChange={(value: 'name' | 'date') => setSortBy(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Sort by Name</SelectItem>
                <SelectItem value="date">Sort by Date</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Rider Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
            {filteredRiders.map(rider => (
              <div
                key={rider.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedRiders.includes(rider.id)
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => toggleRiderSelection(rider.id)}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedRiders.includes(rider.id)}
                    onCheckedChange={() => toggleRiderSelection(rider.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">{rider.templateName}</h4>
                    {rider.description && (
                      <p className="text-sm text-muted-foreground truncate">
                        {rider.description}
                      </p>
                    )}
                    {rider.genre && (
                      <Badge variant="outline" className="mt-2">
                        {rider.genre}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Selection Info */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="text-sm">
              <span className="font-semibold">{selectedRiders.length}</span> rider{selectedRiders.length !== 1 ? 's' : ''} selected
            </div>
            <Button
              onClick={handleCompare}
              disabled={selectedRiders.length < 2 || selectedRiders.length > 4}
              className="ml-auto"
            >
              Compare Selected
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Comparison View */}
      {comparisonRiders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Rider Comparison</CardTitle>
            <CardDescription>
              Side-by-side comparison of {comparisonRiders.length} riders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Rider Headers */}
            <div className="overflow-x-auto">
              <div className="grid gap-2" style={{ gridTemplateColumns: `200px repeat(${comparisonRiders.length}, 1fr)` }}>
                <div className="font-semibold text-sm">Field</div>
                {comparisonRiders.map(rider => (
                  <div key={rider.id} className="p-3 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold text-sm truncate">{rider.templateName}</h4>
                    {rider.genre && (
                      <p className="text-xs text-muted-foreground">{rider.genre}</p>
                    )}
                  </div>
                ))}

                {/* Category Rows */}
                {Object.entries(COMPARISON_CATEGORIES).map(([category, fields]) => (
                  <React.Fragment key={category}>
                    {/* Category Header */}
                    <div
                      className="col-span-full p-3 bg-gray-100 rounded cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() =>
                        setExpandedCategory(
                          expandedCategory === category ? null : category
                        )
                      }
                    >
                      <div className="flex items-center gap-2 font-semibold text-sm">
                        {expandedCategory === category ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                        {category}
                      </div>
                    </div>

                    {/* Category Fields */}
                    {expandedCategory === category &&
                      fields.map(field => (
                        <React.Fragment key={field}>
                          <div className="p-3 text-sm font-medium text-gray-600">
                            {formatFieldName(field)}
                          </div>
                          {comparisonRiders.map(rider => {
                            const value = getComparisonValue(rider, field);
                            return (
                              <div
                                key={`${rider.id}-${field}`}
                                className={`p-3 text-sm border rounded ${
                                  value === 'N/A' ? 'bg-gray-50' : ''
                                }`}
                              >
                                <div className={`font-medium ${getValueColor(value)}`}>
                                  {typeof value === 'boolean' ? (
                                    value ? (
                                      <Check className="h-4 w-4 inline" />
                                    ) : (
                                      <X className="h-4 w-4 inline" />
                                    )
                                  ) : (
                                    value
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </React.Fragment>
                      ))}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Comparison Summary */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">Comparison Tips:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Green values indicate "Yes" or requirements that are met</li>
                    <li>Red values indicate "No" or requirements that are not met</li>
                    <li>Look for riders that best match your venue's capabilities</li>
                    <li>Consider proposing modifications for riders with mismatches</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedRiders([]);
                  setSearchTerm('');
                }}
              >
                Clear Selection
              </Button>
              {comparisonRiders.length > 0 && (
                <Button
                  onClick={() => onSelect?.(comparisonRiders[0].id)}
                  className="ml-auto"
                >
                  Select First Rider
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {riders.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">No riders available</p>
            <p className="text-sm text-muted-foreground">
              Create or import riders to start comparing
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
