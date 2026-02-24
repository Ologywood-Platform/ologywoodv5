import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, Plus, Trash2, Save, Eye, Check } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useLocation } from "wouter";

interface RiderItem {
  id: string;
  title: string;
  checked: boolean;
}

const DEFAULT_ITEMS = [
  { title: "Sound system with main speakers", category: "Technical" },
  { title: "Microphone and stand", category: "Technical" },
  { title: "Monitor speakers for stage", category: "Technical" },
  { title: "Lighting setup", category: "Technical" },
  { title: "Green room with seating", category: "Hospitality" },
  { title: "Complimentary beverages", category: "Hospitality" },
  { title: "Light snacks", category: "Hospitality" },
  { title: "Parking for band members", category: "Hospitality" },
  { title: "50% deposit to confirm", category: "Payment" },
  { title: "Balance due 7 days before event", category: "Payment" },
];

export default function RiderBuilder() {
  const [, navigate] = useLocation();
  const [riderName, setRiderName] = useState("My Rider");
  const [items, setItems] = useState<RiderItem[]>(
    DEFAULT_ITEMS.map((item, i) => ({
      id: i.toString(),
      title: item.title,
      checked: false,
    }))
  );
  const [newItemTitle, setNewItemTitle] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // saveTemplate router not implemented
  const saveTemplateMutation = { mutate: () => {}, isPending: false } as any;

  const toggleItem = (id: string) => {
    setItems(items.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const addItem = () => {
    if (!newItemTitle.trim()) return;
    const newId = Math.max(...items.map((i) => parseInt(i.id)), -1) + 1;
    setItems([
      ...items,
      {
        id: newId.toString(),
        title: newItemTitle,
        checked: false,
      },
    ]);
    setNewItemTitle("");
  };

  const deleteItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const saveAsTemplate = async () => {
    if (!riderName.trim()) {
      alert("Please enter a rider name");
      return;
    }

    setIsSaving(true);
    try {
      const checkedItems = items.filter((item) => item.checked);
      await saveTemplateMutation.mutateAsync({
        name: riderName,
        description: `Rider template with ${checkedItems.length} selected requirements`,
        content: JSON.stringify(checkedItems),
      });
      alert("Rider template saved successfully!");
      navigate("/riders");
    } catch (error) {
      alert("Failed to save template. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const checkedCount = items.filter((item) => item.checked).length;
  const completionPercent = Math.round((checkedCount / items.length) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/riders")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Rider Builder</h1>
              <p className="text-sm text-slate-600">Select your performance requirements</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">{showPreview ? "Edit" : "Preview"}</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Rider Name */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Rider Name</CardTitle>
              </CardHeader>
              <CardContent>
                <input
                  type="text"
                  value={riderName}
                  onChange={(e) => setRiderName(e.target.value)}
                  placeholder="e.g., My Standard Rider"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </CardContent>
            </Card>

            {/* Requirements Checklist */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Requirements</CardTitle>
                <CardDescription>
                  Select the requirements that apply to your performances
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition"
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => toggleItem(item.id)}
                      className="w-5 h-5 rounded cursor-pointer accent-primary"
                    />
                    <span className="flex-1 text-sm">{item.title}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteItem(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Add Custom Item */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add Custom Requirement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <input
                  type="text"
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addItem()}
                  placeholder="e.g., Specific equipment or hospitality need"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button
                  onClick={addItem}
                  disabled={!newItemTitle.trim()}
                  className="w-full gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Requirement
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Preview & Actions */}
          <div className="lg:col-span-1">
            {/* Progress Card */}
            <Card className="mb-6 sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Requirements Selected</span>
                    <span className="text-sm font-bold">{checkedCount}/{items.length}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${completionPercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-600 mt-2">{completionPercent}% complete</p>
                </div>

                {showPreview && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h4 className="font-semibold text-sm text-blue-900 mb-2">Preview</h4>
                    <div className="text-xs text-blue-800 space-y-1">
                      <p><strong>Name:</strong> {riderName}</p>
                      <p><strong>Requirements:</strong> {checkedCount} selected</p>
                    </div>
                  </div>
                )}

                <Button
                  onClick={saveAsTemplate}
                  disabled={isSaving || checkedCount === 0}
                  className="w-full gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Rider"}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => navigate("/riders")}
                  className="w-full"
                >
                  View Saved Riders
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
