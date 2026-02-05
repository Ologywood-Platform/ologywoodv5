import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit2, Trash2, Share2, Download } from "lucide-react";

interface SavedRider {
  id: number;
  templateName: string;
  description?: string;
  sections: Array<{
    title: string;
    content: string;
    isRequired: boolean;
  }>;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function SavedRiders() {
  const [riders, setRiders] = useState<SavedRider[]>([
    {
      id: 1,
      templateName: "Standard Jazz Rider",
      description: "Professional rider for jazz performances",
      sections: [
        { title: "Technical", content: "Sound system required", isRequired: true },
        { title: "Hospitality", content: "Green room with seating", isRequired: true },
        { title: "Payment", content: "50% deposit required", isRequired: true },
      ],
      isPublic: true,
      createdAt: "2026-02-01",
      updatedAt: "2026-02-01",
    },
  ]);

  const [selectedRider, setSelectedRider] = useState<SavedRider | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState("");

  const downloadRider = (rider: SavedRider) => {
    let content = `RIDER: ${rider.templateName}\n`;
    content += `Created: ${rider.createdAt}\n`;
    content += `${"=".repeat(50)}\n\n`;

    rider.sections.forEach((section) => {
      content += `${section.title.toUpperCase()}\n`;
      content += `${"-".repeat(section.title.length)}\n`;
      content += `${section.content}\n\n`;
    });

    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(content)
    );
    element.setAttribute("download", `${rider.templateName.replace(/\s+/g, "_")}_rider.txt`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const deleteRider = (id: number) => {
    if (confirm("Are you sure you want to delete this rider template?")) {
      setRiders(riders.filter((r) => r.id !== id));
    }
  };

  const shareRider = () => {
    if (!shareEmail.trim()) {
      alert("Please enter an email address");
      return;
    }
    alert(`Rider shared with ${shareEmail}`);
    setShowShareModal(false);
    setShareEmail("");
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
          <Link href="/rider-builder">
            <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Builder
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-3 sm:px-4 py-8 sm:py-12 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-foreground">
            My Rider Templates
          </h1>
          <p className="text-muted-foreground mb-8">
            Manage your saved rider templates. Reuse, edit, share, and download your riders for bookings.
          </p>

          {riders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No saved riders yet</p>
              <Link href="/rider-builder">
                <Button className="gap-2">
                  Create Your First Rider
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {riders.map((rider) => (
                <div
                  key={rider.id}
                  className="border rounded-lg p-6 hover:shadow-lg transition"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-foreground">
                        {rider.templateName}
                      </h3>
                      {rider.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {rider.description}
                        </p>
                      )}
                      <div className="flex gap-2 mt-2">
                        {rider.isPublic && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            Public
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {rider.sections.length} sections
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Sections Preview */}
                  <div className="bg-gray-50 rounded p-4 mb-4 max-h-32 overflow-y-auto">
                    {rider.sections.map((section, idx) => (
                      <div key={idx} className="mb-2">
                        <p className="font-semibold text-sm">{section.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {section.content}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-wrap">
                    <Link href="/rider-builder">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Edit2 className="h-4 w-4" />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        setSelectedRider(rider);
                        setShowShareModal(true);
                      }}
                    >
                      <Share2 className="h-4 w-4" />
                      Share
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => downloadRider(rider)}
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="gap-2 ml-auto"
                      onClick={() => deleteRider(rider.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">
              Share "{selectedRider?.templateName}"
            </h2>
            <input
              type="email"
              placeholder="Enter email address"
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-4"
            />
            <div className="flex gap-2">
              <Button
                onClick={shareRider}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Share
              </Button>
              <Button
                onClick={() => setShowShareModal(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
