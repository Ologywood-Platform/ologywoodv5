import React, { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Plus, Trash2 } from "lucide-react";

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
            <img src="/logo-icon.png" alt="Ologywood" className="h-6 sm:h-8 w-6 sm:w-8 rounded" />
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
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-foreground">
            Rider Contract Template Builder
          </h1>
          <p className="text-muted-foreground mb-8">
            Create a professional rider template for your bookings. Customize technical requirements, hospitality needs, and payment terms.
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
          <div className="space-y-6 mb-8">
            {sections.map((section) => (
              <div key={section.id} className="border rounded-lg p-6 bg-gray-50">
                <div className="flex justify-between items-start mb-4">
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => updateSection(section.id, "title", e.target.value)}
                    className="flex-1 text-lg font-semibold px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={() => deleteSection(section.id)}
                    className="ml-2 p-2 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
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
              onClick={downloadRider}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Download className="h-5 w-5" />
              Download Rider
            </button>
            <Link href="/">
              <Button variant="outline" className="w-full sm:w-auto">
                Back to Home
              </Button>
            </Link>
          </div>

          {/* Info Box */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>💡 Tip:</strong> Your rider template will be saved to your profile and can be shared with venues when making booking inquiries. You can update it anytime to reflect your current needs.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
