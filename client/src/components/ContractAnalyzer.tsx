import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
  Info,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

interface AnalysisArea {
  name: string;
  status: 'pass' | 'warning' | 'fail';
  finding: string;
  recommendation: string;
}

interface AnalysisResult {
  overallScore: number;
  overallAssessment: string;
  areas: AnalysisArea[];
  missingClauses: string[];
  redFlags: string[];
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'pass':
      return <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
    case 'fail':
      return <XCircle className="h-4 w-4 text-red-500 shrink-0" />;
    default:
      return null;
  }
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'pass':
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 text-xs">Compliant</Badge>;
    case 'warning':
      return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 text-xs">Needs Review</Badge>;
    case 'fail':
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 text-xs">Missing</Badge>;
    default:
      return null;
  }
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-amber-500' : 'text-red-500';
  const bgColor = score >= 80 ? 'stroke-green-100' : score >= 60 ? 'stroke-amber-100' : 'stroke-red-100';
  const strokeColor = score >= 80 ? 'stroke-green-600' : score >= 60 ? 'stroke-amber-500' : 'stroke-red-500';
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-24 h-24 mx-auto">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" strokeWidth="8" className={bgColor} />
        <circle
          cx="50" cy="50" r="40" fill="none" strokeWidth="8"
          className={strokeColor}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className={`absolute inset-0 flex items-center justify-center font-bold text-xl ${color}`}>
        {score}
      </div>
    </div>
  );
}

export function ContractAnalyzer() {
  const [contractText, setContractText] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeMutation = trpc.contractAnalyzer.analyzeContract.useMutation();

  const handleAnalyze = async () => {
    if (contractText.trim().length < 50) {
      toast.error('Please paste at least 50 characters of contract text to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      const result = await analyzeMutation.mutateAsync({ contractText: contractText.trim() });
      if (result.success && result.analysis) {
        setAnalysis(result.analysis as AnalysisResult);
      } else {
        toast.error(result.error || 'Analysis failed. Please try again.');
      }
    } catch (error: any) {
      toast.error('Unable to analyze contract. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const passCount = analysis?.areas.filter(a => a.status === 'pass').length || 0;
  const warnCount = analysis?.areas.filter(a => a.status === 'warning').length || 0;
  const failCount = analysis?.areas.filter(a => a.status === 'fail').length || 0;

  return (
    <div className="space-y-4" data-tour="contract-analyzer">
      {/* Disclaimer */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
        <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-800 dark:text-amber-300">
          This tool provides educational compliance guidance only and does not constitute legal advice.
          Always consult with a qualified attorney and your school's compliance office before signing any NIL agreement.
        </p>
      </div>

      {/* Input */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            AI Contract Analyzer
          </CardTitle>
          <CardDescription className="text-xs">
            Paste your NIL contract or agreement below and our AI will review it for standard NCAA compliance requirements.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Paste your NIL contract text here... (minimum 50 characters)"
            value={contractText}
            onChange={(e) => setContractText(e.target.value)}
            className="min-h-[160px] text-sm font-mono"
            disabled={isAnalyzing}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {contractText.length.toLocaleString()} characters
            </span>
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || contractText.trim().length < 50}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Analyze for Compliance
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isAnalyzing && (
        <Card>
          <CardContent className="py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-500 mb-3" />
            <p className="text-sm text-muted-foreground">Reviewing contract for NCAA compliance...</p>
            <p className="text-xs text-muted-foreground mt-1">This may take a few seconds</p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {analysis && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {/* Score Overview */}
          <Card>
            <CardContent className="py-5">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <ScoreRing score={analysis.overallScore} />
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="font-semibold text-base mb-1">Compliance Score</h3>
                  <p className="text-sm text-muted-foreground mb-3">{analysis.overallAssessment}</p>
                  <div className="flex items-center gap-3 justify-center sm:justify-start">
                    <span className="flex items-center gap-1 text-xs">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> {passCount} Pass
                    </span>
                    <span className="flex items-center gap-1 text-xs">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> {warnCount} Warning
                    </span>
                    <span className="flex items-center gap-1 text-xs">
                      <XCircle className="h-3.5 w-3.5 text-red-500" /> {failCount} Missing
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Areas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Compliance Areas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {analysis.areas.map((area, idx) => (
                <div key={idx} className="border rounded-lg p-3">
                  <div className="flex items-start gap-2 mb-1.5">
                    <StatusIcon status={area.status} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{area.name}</span>
                        <StatusBadge status={area.status} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{area.finding}</p>
                      {area.recommendation && area.status !== 'pass' && (
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1.5 bg-blue-50 dark:bg-blue-950/20 p-2 rounded">
                          <strong>Recommendation:</strong> {area.recommendation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Red Flags */}
          {analysis.redFlags.length > 0 && (
            <Card className="border-red-200 dark:border-red-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-red-700 dark:text-red-400 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Red Flags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {analysis.redFlags.map((flag, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-red-700 dark:text-red-300">
                      <XCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      {flag}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Missing Clauses */}
          {analysis.missingClauses.length > 0 && (
            <Card className="border-amber-200 dark:border-amber-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-amber-700 dark:text-amber-400 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Missing Clauses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {analysis.missingClauses.map((clause, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
                      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      {clause}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Disclaimer footer */}
          <p className="text-[10px] text-muted-foreground text-center px-4">
            This analysis is generated by AI for educational purposes only. It does not constitute legal advice.
            Consult a qualified attorney and your school's compliance office before signing any NIL agreement.
          </p>
        </div>
      )}
    </div>
  );
}
