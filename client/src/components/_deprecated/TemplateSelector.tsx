import React, { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { ChevronRight, Check } from "lucide-react";

interface BookingTemplate {
  id: number;
  name: string;
  description: string;
  eventType: string;
  suggestedFee: { min: number; max: number };
  duration: string;
  riderRequirements: string[];
  logistics: {
    setup: string;
    breakdown: string;
    capacity: string;
  };
}

interface TemplateSelectorProps {
  templates: BookingTemplate[];
  onSelect: (template: BookingTemplate) => void;
  selectedId?: number;
}

export function TemplateSelector({
  templates,
  onSelect,
  selectedId,
}: TemplateSelectorProps) {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Select Event Type</h3>
        <p className="text-sm text-gray-600 mb-4">
          Choose a template to auto-populate pricing, requirements, and logistics
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template) => (
          <Card
            key={template.id}
            className={`p-4 cursor-pointer transition-all ${
              selectedId === template.id
                ? "ring-2 ring-purple-600 bg-purple-50"
                : "hover:shadow-md"
            }`}
            onClick={() => {
              onSelect(template);
              setExpanded(expanded === template.id ? null : template.id);
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{template.name}</h4>
                <p className="text-sm text-gray-600">{template.description}</p>
              </div>
              {selectedId === template.id && (
                <Check className="w-5 h-5 text-purple-600 flex-shrink-0 ml-2" />
              )}
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Suggested Fee:</span>
                <span className="font-medium text-gray-900">
                  ${template.suggestedFee.min} - ${template.suggestedFee.max}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium text-gray-900">{template.duration}</span>
              </div>
            </div>

            {/* Expandable Details */}
            {expanded === template.id && (
              <div className="border-t pt-3 space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-2">
                    Suggested Rider Requirements:
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {template.riderRequirements.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-purple-600 mt-1">•</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-900 mb-2">Logistics:</p>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      <strong>Setup:</strong> {template.logistics.setup}
                    </p>
                    <p>
                      <strong>Breakdown:</strong> {template.logistics.breakdown}
                    </p>
                    <p>
                      <strong>Capacity:</strong> {template.logistics.capacity}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {expanded !== template.id && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(template.id);
                }}
              >
                View Details <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </Card>
        ))}
      </div>

      {selectedId && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            ✓ Template selected. Pricing and requirements will be auto-populated in the booking form.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Template Preview Component - Shows selected template details
 */
export function TemplatePreview({ template }: { template: BookingTemplate }) {
  return (
    <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50">
      <h3 className="text-lg font-semibold mb-4">{template.name}</h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Suggested Fee Range</p>
          <p className="text-2xl font-bold text-purple-600">
            ${template.suggestedFee.min} - ${template.suggestedFee.max}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Duration</p>
          <p className="text-2xl font-bold text-blue-600">{template.duration}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-gray-900 mb-2">Typical Requirements:</p>
          <div className="flex flex-wrap gap-2">
            {template.riderRequirements.slice(0, 3).map((req, idx) => (
              <span key={idx} className="px-3 py-1 bg-white rounded-full text-sm text-gray-700">
                {req}
              </span>
            ))}
            {template.riderRequirements.length > 3 && (
              <span className="px-3 py-1 bg-white rounded-full text-sm text-gray-700">
                +{template.riderRequirements.length - 3} more
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
