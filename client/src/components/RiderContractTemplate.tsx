import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Save, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface RiderSection {
  id: string;
  title: string;
  items: RiderItem[];
}

interface RiderItem {
  id: string;
  description: string;
  required: boolean;
}

interface RiderTemplate {
  id?: number;
  name: string;
  description: string;
  sections: RiderSection[];
  createdAt?: Date;
  updatedAt?: Date;
}

const DEFAULT_SECTIONS: RiderSection[] = [
  {
    id: 'technical',
    title: 'Technical Requirements',
    items: [
      { id: 'tech-1', description: 'Sound system with mixing board', required: true },
      { id: 'tech-2', description: 'Stage lighting setup', required: false },
      { id: 'tech-3', description: 'Microphone and stands', required: true },
    ],
  },
  {
    id: 'hospitality',
    title: 'Hospitality & Accommodations',
    items: [
      { id: 'hosp-1', description: 'Green room with seating', required: true },
      { id: 'hosp-2', description: 'Catering (meals for band)', required: false },
      { id: 'hosp-3', description: 'Parking for tour bus', required: false },
    ],
  },
  {
    id: 'personnel',
    title: 'Personnel & Access',
    items: [
      { id: 'pers-1', description: 'Sound engineer on-site', required: false },
      { id: 'pers-2', description: 'Stage manager', required: true },
      { id: 'pers-3', description: 'Security personnel', required: false },
    ],
  },
  {
    id: 'logistics',
    title: 'Logistics & Setup',
    items: [
      { id: 'log-1', description: 'Load-in time: 2 hours before show', required: true },
      { id: 'log-2', description: 'Parking for 2 vehicles', required: true },
      { id: 'log-3', description: 'Dressing room with mirror and lighting', required: false },
    ],
  },
];

export function RiderContractTemplate() {
  const [templates, setTemplates] = useState<RiderTemplate[]>([
    {
      id: 1,
      name: 'Standard Rider',
      description: 'Basic technical and hospitality requirements',
      sections: DEFAULT_SECTIONS,
      createdAt: new Date(),
    },
  ]);

  const [selectedTemplate, setSelectedTemplate] = useState<RiderTemplate | null>(templates[0]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RiderTemplate | null>(null);

  const handleCreateNew = () => {
    const newTemplate: RiderTemplate = {
      name: 'New Rider Template',
      description: 'Custom rider requirements',
      sections: DEFAULT_SECTIONS.map(section => ({
        ...section,
        items: section.items.map(item => ({ ...item })),
      })),
    };
    setEditingTemplate(newTemplate);
    setIsEditing(true);
  };

  const handleEditTemplate = (template: RiderTemplate) => {
    setEditingTemplate({
      ...template,
      sections: template.sections.map(section => ({
        ...section,
        items: section.items.map(item => ({ ...item })),
      })),
    });
    setIsEditing(true);
  };

  const handleSaveTemplate = () => {
    if (!editingTemplate || !editingTemplate.name.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    if (editingTemplate.id) {
      setTemplates(templates.map(t => t.id === editingTemplate.id ? editingTemplate : t));
      toast.success('Template updated successfully');
    } else {
      const newTemplate = {
        ...editingTemplate,
        id: Math.max(...templates.map(t => t.id || 0), 0) + 1,
        createdAt: new Date(),
      };
      setTemplates([...templates, newTemplate]);
      toast.success('Template created successfully');
    }

    setSelectedTemplate(editingTemplate);
    setIsEditing(false);
  };

  const handleDeleteTemplate = (id: number | undefined) => {
    if (!id) return;
    setTemplates(templates.filter(t => t.id !== id));
    setSelectedTemplate(null);
    toast.success('Template deleted');
  };

  const handleAddSection = () => {
    if (!editingTemplate) return;
    const newSection: RiderSection = {
      id: `section-${Date.now()}`,
      title: 'New Section',
      items: [],
    };
    setEditingTemplate({
      ...editingTemplate,
      sections: [...editingTemplate.sections, newSection],
    });
  };

  const handleRemoveSection = (sectionId: string) => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      sections: editingTemplate.sections.filter(s => s.id !== sectionId),
    });
  };

  const handleUpdateSection = (sectionId: string, title: string) => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      sections: editingTemplate.sections.map(s =>
        s.id === sectionId ? { ...s, title } : s
      ),
    });
  };

  const handleAddItem = (sectionId: string) => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      sections: editingTemplate.sections.map(s =>
        s.id === sectionId
          ? {
              ...s,
              items: [
                ...s.items,
                {
                  id: `item-${Date.now()}`,
                  description: '',
                  required: false,
                },
              ],
            }
          : s
      ),
    });
  };

  const handleUpdateItem = (sectionId: string, itemId: string, updates: Partial<RiderItem>) => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      sections: editingTemplate.sections.map(s =>
        s.id === sectionId
          ? {
              ...s,
              items: s.items.map(i =>
                i.id === itemId ? { ...i, ...updates } : i
              ),
            }
          : s
      ),
    });
  };

  const handleRemoveItem = (sectionId: string, itemId: string) => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      sections: editingTemplate.sections.map(s =>
        s.id === sectionId
          ? {
              ...s,
              items: s.items.filter(i => i.id !== itemId),
            }
          : s
      ),
    });
  };

  const handleDuplicateTemplate = (template: RiderTemplate) => {
    const duplicated: RiderTemplate = {
      name: `${template.name} (Copy)`,
      description: template.description,
      sections: template.sections.map(section => ({
        ...section,
        items: section.items.map(item => ({ ...item })),
      })),
    };
    setEditingTemplate(duplicated);
    setIsEditing(true);
  };

  if (isEditing && editingTemplate) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Edit Rider Template</CardTitle>
            <CardDescription>Customize your technical and hospitality requirements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Template Name and Description */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Template Name</label>
                <Input
                  value={editingTemplate.name}
                  onChange={(e) =>
                    setEditingTemplate({ ...editingTemplate, name: e.target.value })
                  }
                  placeholder="e.g., Standard Rider, Festival Setup"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Textarea
                  value={editingTemplate.description}
                  onChange={(e) =>
                    setEditingTemplate({ ...editingTemplate, description: e.target.value })
                  }
                  placeholder="Describe when this rider template is used..."
                  rows={2}
                />
              </div>
            </div>

            {/* Sections */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Sections</h3>
                <Button size="sm" onClick={handleAddSection} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Section
                </Button>
              </div>

              {editingTemplate.sections.map((section) => (
                <Card key={section.id} className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Input
                        value={section.title}
                        onChange={(e) => handleUpdateSection(section.id, e.target.value)}
                        placeholder="Section title"
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveSection(section.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>

                    {/* Items */}
                    <div className="space-y-2 ml-4">
                      {section.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={item.required}
                            onChange={(e) =>
                              handleUpdateItem(section.id, item.id, { required: e.target.checked })
                            }
                            className="h-4 w-4"
                          />
                          <Input
                            value={item.description}
                            onChange={(e) =>
                              handleUpdateItem(section.id, item.id, { description: e.target.value })
                            }
                            placeholder="Requirement description"
                            className="flex-1"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveItem(section.id, item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddItem(section.id)}
                      className="ml-4"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditingTemplate(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveTemplate}>
                <Save className="h-4 w-4 mr-2" />
                Save Template
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Templates List */}
      <div className="grid gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Rider Templates</h2>
          <Button onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Template
          </Button>
        </div>

        {templates.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No rider templates yet. Create one to get started!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {templates.map((template) => (
              <Card
                key={template.id}
                className={`cursor-pointer transition ${
                  selectedTemplate?.id === template.id
                    ? 'ring-2 ring-primary'
                    : 'hover:shadow-lg'
                }`}
                onClick={() => setSelectedTemplate(template)}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {template.sections.length} sections • {template.sections.reduce((sum, s) => sum + s.items.length, 0)} items
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTemplate(template);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateTemplate(template);
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTemplate(template.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Template Preview */}
      {selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedTemplate.name}</CardTitle>
            <CardDescription>{selectedTemplate.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {selectedTemplate.sections.map((section) => (
                <div key={section.id}>
                  <h3 className="font-semibold text-lg mb-3">{section.title}</h3>
                  <ul className="space-y-2 ml-4">
                    {section.items.map((item) => (
                      <li key={item.id} className="flex items-start gap-3">
                        <span className="text-primary font-bold">•</span>
                        <span className="flex-1">{item.description}</span>
                        {item.required && (
                          <Badge variant="destructive" className="ml-2">
                            Required
                          </Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
