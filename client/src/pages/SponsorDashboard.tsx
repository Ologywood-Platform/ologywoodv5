import { useState, useRef } from "react";
import { trpc } from "../lib/trpc";
import SiteHeader from "../components/SiteHeader";
import { 
  Handshake, MessageCircle, Send, Clock, CheckCircle, XCircle, 
  Building2, DollarSign, Tag, ChevronDown, ChevronUp 
} from "lucide-react";

export default function SponsorDashboard() {
  const [activeTab, setActiveTab] = useState<"applications" | "active" | "messages">("applications");
  const [expandedApp, setExpandedApp] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  const { data: applications = [], isLoading: loadingApps } = trpc.venueSponsor.getSponsorDashboardApplications.useQuery();
  const { data: activeSponsors = [], isLoading: loadingActive } = trpc.venueSponsor.getSponsorDashboardActiveSponsors.useQuery();
  const { data: messages = [], refetch: refetchMessages } = trpc.venueSponsor.getMessages.useQuery(
    { applicationId: expandedApp! },
    { enabled: !!expandedApp }
  );

  const sendMessageMutation = trpc.venueSponsor.sendMessage.useMutation({
    onSuccess: () => {
      setMessageText("");
      refetchMessages();
    },
  });

  const handleSendMessage = () => {
    if (!messageText.trim() || !expandedApp) return;
    sendMessageMutation.mutate({ applicationId: expandedApp, content: messageText.trim() });
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "rejected": return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "approved": return "Approved";
      case "rejected": return "Rejected";
      default: return "Pending Review";
    }
  };

  const tierColor = (tier: string) => {
    switch (tier) {
      case "platinum": return "bg-purple-100 text-purple-800";
      case "gold": return "bg-yellow-100 text-yellow-800";
      case "silver": return "bg-gray-100 text-gray-700";
      case "bronze": return "bg-orange-100 text-orange-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-indigo-100 rounded-xl">
            <Handshake className="w-7 h-7 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sponsor Dashboard</h1>
            <p className="text-gray-500">Track your sponsorship applications and active partnerships</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Tag className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Applications</p>
                <p className="text-xl font-bold">{applications.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Sponsorships</p>
                <p className="text-xl font-bold">{activeSponsors.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-xl font-bold">{applications.filter(a => a.status === "pending").length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
          {[
            { key: "applications" as const, label: "My Applications" },
            { key: "active" as const, label: "Active Sponsorships" },
            { key: "messages" as const, label: "Messages" },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Applications Tab */}
        {activeTab === "applications" && (
          <div className="space-y-4">
            {loadingApps ? (
              <div className="text-center py-12 text-gray-500">Loading applications...</div>
            ) : applications.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <Handshake className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No applications yet</p>
                <p className="text-sm text-gray-400 mt-1">Browse sponsor opportunities to get started</p>
                <a href="/sponsor-opportunities" className="inline-block mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
                  Browse Opportunities
                </a>
              </div>
            ) : (
              applications.map(app => (
                <div key={app.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                    onClick={() => setExpandedApp(expandedApp === app.id ? null : app.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {statusIcon(app.status)}
                        <span className="text-sm font-medium">{statusLabel(app.status)}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{app.packageName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Building2 className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm text-gray-500">{app.venueName}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${tierColor(app.tier)}`}>
                            {app.tier}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">${parseFloat(app.price).toLocaleString()}</p>
                        <p className="text-xs text-gray-400">{app.packageType.replace(/_/g, " ")}</p>
                      </div>
                      {expandedApp === app.id ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </div>
                  </div>

                  {/* Expanded: Messages */}
                  {expandedApp === app.id && (
                    <div className="border-t border-gray-100 p-5 bg-gray-50">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <MessageCircle className="w-4 h-4" /> Messages
                      </h4>
                      <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                        {messages.length === 0 ? (
                          <p className="text-sm text-gray-400 text-center py-4">No messages yet. Start a conversation!</p>
                        ) : (
                          messages.map(msg => (
                            <div
                              key={msg.id}
                              className={`p-3 rounded-lg max-w-[80%] ${
                                msg.senderRole === "sponsor"
                                  ? "bg-indigo-100 text-indigo-900 ml-auto"
                                  : "bg-white text-gray-900 border border-gray-200"
                              }`}
                            >
                              <p className="text-sm">{msg.content}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {msg.senderRole === "venue" ? "Venue" : "You"} · {new Date(msg.createdAt).toLocaleString()}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="flex gap-2">
                        <textarea
                          ref={messageInputRef}
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          placeholder="Type a message..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          rows={2}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                        />
                        <button
                          onClick={handleSendMessage}
                          disabled={!messageText.trim() || sendMessageMutation.isPending}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 self-end"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Active Sponsorships Tab */}
        {activeTab === "active" && (
          <div className="space-y-4">
            {loadingActive ? (
              <div className="text-center py-12 text-gray-500">Loading active sponsorships...</div>
            ) : activeSponsors.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No active sponsorships yet</p>
                <p className="text-sm text-gray-400 mt-1">Once your applications are approved, they'll appear here</p>
              </div>
            ) : (
              activeSponsors.map(sponsor => (
                <div key={sponsor.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {sponsor.companyLogoUrl && (
                        <img src={sponsor.companyLogoUrl} alt="" className="w-12 h-12 rounded-lg object-contain border" />
                      )}
                      <div>
                        <p className="font-semibold text-gray-900">{sponsor.companyName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Building2 className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm text-gray-500">{sponsor.venueName}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${tierColor(sponsor.tier)}`}>
                            {sponsor.tier}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Active</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Since {new Date(sponsor.startDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === "messages" && (
          <div className="space-y-4">
            {applications.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No conversations</p>
                <p className="text-sm text-gray-400 mt-1">Messages will appear here once you have applications</p>
              </div>
            ) : (
              applications.map(app => (
                <div
                  key={app.id}
                  className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:border-indigo-300 transition-colors"
                  onClick={() => {
                    setExpandedApp(app.id);
                    setActiveTab("applications");
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 rounded-lg">
                        <MessageCircle className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{app.packageName}</p>
                        <p className="text-sm text-gray-500">{app.venueName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {statusIcon(app.status)}
                      <span className="text-sm text-gray-500">{statusLabel(app.status)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
