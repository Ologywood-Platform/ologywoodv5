import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, MapPin, Globe } from "lucide-react";

interface AuditEntry {
  id: string;
  contractId: number;
  userId: number;
  userName: string;
  userRole: string;
  action: string;
  details?: string | null;
  changedFields?: Record<string, any> | null;
  ipAddress: string;
  userAgent: string;
  timestamp: Date | string;
}

interface ContractAuditTrailProps {
  auditTrail: AuditEntry[];
}

export function ContractAuditTrail({ auditTrail }: ContractAuditTrailProps) {
  const getActionColor = (action: string) => {
    switch (action) {
      case "created":
        return "bg-blue-100 text-blue-800";
      case "updated":
        return "bg-yellow-100 text-yellow-800";
      case "signed":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "approved":
        return "bg-purple-100 text-purple-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "signed":
        return "✓";
      case "rejected":
        return "✗";
      case "approved":
        return "✓✓";
      case "cancelled":
        return "⊘";
      default:
        return "●";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Contract Activity Log</CardTitle>
        <CardDescription>Complete audit trail of all contract changes and actions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {auditTrail.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No activity recorded yet</p>
          ) : (
            <div className="relative">
              {/* Timeline */}
              <div className="space-y-6">
                {auditTrail.map((entry, index) => (
                  <div key={entry.id} className="flex gap-4">
                    {/* Timeline marker */}
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${getActionColor(entry.action)}`}>
                        {getActionIcon(entry.action)}
                      </div>
                      {index < auditTrail.length - 1 && <div className="w-0.5 h-12 bg-gray-200 mt-2" />}
                    </div>

                    {/* Activity details */}
                    <div className="flex-1 pt-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold capitalize">{entry.action}</span>
                          <Badge className={getActionColor(entry.action)}>{entry.action}</Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm">
                        {/* User info */}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>
                            <strong>{entry.userName}</strong> ({entry.userRole})
                          </span>
                        </div>

                        {/* Details */}
                        {entry.details && (
                          <div className="flex gap-2">
                            <span className="text-muted-foreground">Details:</span>
                            <span>{entry.details}</span>
                          </div>
                        )}

                        {/* Changed fields */}
                        {entry.changedFields && Object.keys(entry.changedFields).length > 0 && (
                          <div className="bg-muted p-2 rounded text-xs space-y-1">
                            <p className="font-semibold">Changes:</p>
                            {Object.entries(entry.changedFields).map(([key, value]) => (
                              <div key={key} className="flex gap-2">
                                <span className="font-medium">{key}:</span>
                                <span className="text-muted-foreground">
                                  {typeof value === "object" ? JSON.stringify(value) : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* IP and User Agent */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground border-t pt-2">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>IP: {entry.ipAddress}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            <span className="truncate" title={entry.userAgent}>
                              {entry.userAgent.substring(0, 30)}...
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
