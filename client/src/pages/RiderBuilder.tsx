import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Plus, Trash2, Save, Share2, GripVertical, Eye, Copy } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

interface RiderSection {
  id: string;
  title: string;
  content: string;
}

export default function RiderBuilder() {
  const [riderName, setRiderName] = useState("My Rider");
  const [sections, setSections] = useState<RiderSection[]>([
    {
      id: "1",
      title: "Technical Requirements",
      content: "- Sound system with at least 2 main speakers\n- Microphone and stand\n- Monitor speakers for stage\n- Lighting setup",
    },
    {
      id: "2",
      title: "Hospitality Requirements",
      content: "- Green room with seating\n- Complimentary beverages (water, coffee, tea)\n- Light snacks\n- Parking for band members",
    },
    {
      id: "3",
      title: "Payment Terms",
      content: "- 50% deposit required to confirm booking\n- Remaining balance due 7 days before event\n- Payment method: Bank transfer or credit card",
    },
  ]);

  const [templateName, setTemplateName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const saveTemplateMutation = trpc.riderManagement.saveTemplate.useMutation();

  const addSection = () => {
    const newId = Math.max(...sections.map((s) => parseInt(s.id)), 0) + 1;
    setSections([
      ...sections,
      {
        id: newId.toString(),
        title: "New Section",
        content: "Add your requirements here",
      },
    ]);
  };

  const updateSection = (id: string, field: "title" | "content", value: string) => {
    setSections(
      sections.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const deleteSection = (id: string) => {
    setSections(sections.filter((s) => s.id !== id));
  };

  const reorderSections = (fromIndex: number, toIndex: number) => {
    const newSections = [...sections];
    const [movedSection] = newSections.splice(fromIndex, 1);
    newSections.splice(toIndex, 0, movedSection);
    setSections(newSections);
    setDraggedId(null);
  };

  const duplicateSection = (id: string) => {
    const sectionToDuplicate = sections.find((s) => s.id === id);
    if (sectionToDuplicate) {
      const newId = Math.max(...sections.map((s) => parseInt(s.id)), 0) + 1;
      const newSection = {
        ...sectionToDuplicate,
        id: newId.toString(),
        title: `${sectionToDuplicate.title} (Copy)`,
      };
      setSections([...sections, newSection]);
    }
  };

  const saveAsTemplate = async () => {
    if (!templateName.trim()) {
      alert("Please enter a template name");
      return;
    }

    setIsSaving(true);
    try {
      const cleanedSections = sections.map((s) => ({
        title: s.title,
        content: s.content,
        isRequired: true,
      }));

      await saveTemplateMutation.mutateAsync({
        templateName,
        description: `Rider template created on ${new Date().toLocaleDateString()}`,
        sections: cleanedSections,
        isPublic,
      });

      alert("Rider template saved successfully!");
      setShowSaveModal(false);
      setTemplateName("");
    } catch (error) {
      alert("Failed to save template. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const downloadRider = () => {
    let content = `RIDER FOR: ${riderName}\n`;
    content += `Date Created: ${new Date().toLocaleDateString()}\n`;
    content += `${"=".repeat(50)}\n\n`;

    sections.forEach((section) => {
      content += `${section.title.toUpperCase()}\n`;
      content += `${"-".repeat(section.title.length)}\n`;
      content += `${section.content}\n\n`;
    });

    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(content)
    );
    element.setAttribute("download", `${riderName.replace(/\s+/g, "_")}_rider.txt`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-lg sm:text-2xl font-bold text-primary">
            <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663275372790/wPGyxTylibVlwkYr.png" alt="Ologywood" className="h-6 sm:h-8 w-6 sm:w-8 rounded" />
            <span className="hidden sm:inline">Ologywood</span>
            <span className="sm:hidden">OW</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-3 sm:px-4 py-8 sm:py-12 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
              Rider Contract Template Builder
            </h1>
            <Button
              onClick={() => setShowSaveModal(true)}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              <Save className="h-4 w-4" />
              Save Template
            </Button>
          </div>

          {/* Save Modal */}
          {showSaveModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h2 className="text-2xl font-bold mb-4">Save Rider Template</h2>
                <input
                  type="text"
                  placeholder="Template name (e.g., 'Standard Rider')"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full border rounded px-3 py-2 mb-4"
                />
                <label className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                  />
                  <span>Make this template public (shareable)</span>
                </label>
                <div className="flex gap-2">
                  <Button
                    onClick={saveAsTemplate}
                    disabled={isSaving}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {isSaving ? "Saving..." : "Save Template"}
                  </Button>
                  <Button
                    onClick={() => setShowSaveModal(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          <p className="text-muted-foreground mb-8">
            Create a professional rider template for your bookings. Customize technical requirements, hospitality needs, and payment terms. Drag sections to reorder, or copy sections to reuse them.
          </p>

          {/* Rider Name */}
          <div className="mb-8">
            <label className="block text-sm font-semibold mb-2">Rider Name</label>
            <input
              type="text"
              value={riderName}
              onChange={(e) => setRiderName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., Jazz Quartet Standard Rider"
            />
          </div>

          {/* Sections */}
          <div className="space-y-4 mb-8">
            {sections.map((section, index) => (
              <div
                key={section.id}
                draggable
                onDragStart={() => setDraggedId(section.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  const draggedIndex = sections.findIndex((s) => s.id === draggedId);
                  if (draggedIndex !== index && draggedIndex !== -1) {
                    reorderSections(draggedIndex, index);
                  }
                }}
                className={`border rounded-lg p-6 bg-gray-50 transition ${
                  draggedId === section.id ? "opacity-50" : ""
                }`}
              >
                <div className="flex justify-between items-start mb-4 gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <GripVertical className="h-5 w-5 text-gray-400 cursor-grab" />
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => updateSection(section.id, "title", e.target.value)}
                      className="flex-1 text-lg font-semibold px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => duplicateSection(section.id)}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded"
                      title="Duplicate section"
                    >
                      <Copy className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => deleteSection(section.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded"
                      title="Delete section"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <textarea
                  value={section.content}
                  onChange={(e) => updateSection(section.id, "content", e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={5}
                  placeholder="Enter your requirements here..."
                />
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={addSection}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
            >
              <Plus className="h-5 w-5" />
              Add Section
            </button>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              <Eye className="h-5 w-5" />
              {showPreview ? "Hide" : "Preview"}
            </button>
            <button
              onClick={downloadRider}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Download className="h-5 w-5" />
              Download Rider
            </button>
            <Link href="/saved-riders">
              <Button variant="outline" className="w-full sm:w-auto gap-2">
                <Share2 className="h-4 w-4" />
                My Templates
              </Button>
            </Link>
          </div>

          {/* Preview Section */}
          {showPreview && (
            <div className="mt-8 p-6 bg-gray-100 border-2 border-gray-300 rounded-lg">
              <h2 className="text-2xl font-bold mb-4">Preview: {riderName}</h2>
              <div className="bg-white p-6 rounded-lg space-y-6">
                {sections.map((section) => (
                  <div key={section.id}>
                    <h3 className="text-lg font-semibold mb-2">{section.title}</h3>
                    <div className="text-gray-700 whitespace-pre-wrap text-sm">
                      {section.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>💡 Tip:</strong> Click "Save Template" to store your rider in your profile. You can reuse, edit, and share saved templates with venues when making booking inquiries. Drag sections to reorder them, or use the copy icon to duplicate sections.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
