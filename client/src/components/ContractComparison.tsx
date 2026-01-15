import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ContractVersion {
  id: number;
  version: number;
  contractId: number;
  title: string;
  content: string;
  createdAt: Date | string;
  createdBy: string;
}

interface ContractComparisonProps {
  contractId: number;
  versions: ContractVersion[];
}

export function ContractComparison({ contractId, versions }: ContractComparisonProps) {
  const [selectedVersion1, setSelectedVersion1] = useState<number>(versions[versions.length - 1]?.id || 0);
  const [selectedVersion2, setSelectedVersion2] = useState<number>(versions[versions.length - 2]?.id || 0);
  const [showDifferences, setShowDifferences] = useState(true);

  const version1 = versions.find((v) => v.id === selectedVersion1);
  const version2 = versions.find((v) => v.id === selectedVersion2);

  if (!version1 || !version2) {
    return null;
  }

  // Simple diff algorithm to highlight changes
  const highlightDifferences = (text1: string, text2: string) => {
    const lines1 = text1.split("\n");
    const lines2 = text2.split("\n");
    const maxLines = Math.max(lines1.length, lines2.length);

    const diffs = [];
    for (let i = 0; i < maxLines; i++) {
      const line1 = lines1[i] || "";
      const line2 = lines2[i] || "";

      if (line1 !== line2) {
        diffs.push({
          lineNumber: i + 1,
          original: line1,
          modified: line2,
          isDifferent: true,
        });
      } else {
        diffs.push({
          lineNumber: i + 1,
          original: line1,
          modified: line2,
          isDifferent: false,
        });
      }
    }
    return diffs;
  };

  const diffs = highlightDifferences(version1.content, version2.content);
  const changedLines = diffs.filter((d) => d.isDifferent).length;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Contract Comparison</CardTitle>
        <CardDescription>Compare different versions of the contract to track changes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Version Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Version 1 (Original)</label>
            <Select value={selectedVersion1.toString()} onValueChange={(v) => setSelectedVersion1(parseInt(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {versions.map((v) => (
                  <SelectItem key={v.id} value={v.id.toString()}>
                    v{v.version} - {new Date(v.createdAt).toLocaleDateString()} by {v.createdBy}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Version 2 (Comparison)</label>
            <Select value={selectedVersion2.toString()} onValueChange={(v) => setSelectedVersion2(parseInt(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {versions.map((v) => (
                  <SelectItem key={v.id} value={v.id.toString()}>
                    v{v.version} - {new Date(v.createdAt).toLocaleDateString()} by {v.createdBy}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Comparison Stats */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Changes detected</p>
            <p className="text-2xl font-bold">{changedLines} lines</p>
          </div>
          <Button
            variant={showDifferences ? "default" : "outline"}
            onClick={() => setShowDifferences(!showDifferences)}
          >
            {showDifferences ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Hide Differences
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Show Differences
              </>
            )}
          </Button>
        </div>

        {/* Side-by-side Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Version 1 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Version {version1.version}</h3>
              <Badge variant="outline">{new Date(version1.createdAt).toLocaleDateString()}</Badge>
            </div>
            <div className="bg-muted p-4 rounded-lg max-h-96 overflow-y-auto text-sm space-y-1 font-mono">
              {diffs.map((diff, idx) => (
                <div
                  key={idx}
                  className={`${
                    diff.isDifferent && showDifferences ? "bg-red-100 text-red-900" : ""
                  } p-1 rounded`}
                >
                  <span className="text-xs text-muted-foreground mr-2">{diff.lineNumber}</span>
                  {diff.original}
                </div>
              ))}
            </div>
          </div>

          {/* Version 2 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Version {version2.version}</h3>
              <Badge variant="outline">{new Date(version2.createdAt).toLocaleDateString()}</Badge>
            </div>
            <div className="bg-muted p-4 rounded-lg max-h-96 overflow-y-auto text-sm space-y-1 font-mono">
              {diffs.map((diff, idx) => (
                <div
                  key={idx}
                  className={`${
                    diff.isDifferent && showDifferences ? "bg-green-100 text-green-900" : ""
                  } p-1 rounded`}
                >
                  <span className="text-xs text-muted-foreground mr-2">{diff.lineNumber}</span>
                  {diff.modified}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Change Summary */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">Summary of Changes</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            {diffs
              .filter((d) => d.isDifferent)
              .slice(0, 5)
              .map((diff, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="font-medium">Line {diff.lineNumber}:</span>
                  <span className="line-through text-red-600">{diff.original.substring(0, 40)}</span>
                  <span className="text-green-600">→ {diff.modified.substring(0, 40)}</span>
                </li>
              ))}
            {changedLines > 5 && <li className="text-blue-600">... and {changedLines - 5} more changes</li>}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
