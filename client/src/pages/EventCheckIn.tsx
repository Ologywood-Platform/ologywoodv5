import { useState, useEffect, useRef, useCallback, Component, type ReactNode } from 'react';

// Inline error boundary to prevent scanner crashes from taking down the page
class ScannerErrorBoundary extends Component<{ children: ReactNode; onError: () => void }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch() { this.props.onError(); }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
import { useParams, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Camera, CameraOff, CheckCircle2, XCircle, Loader2, Users, Ticket, Search, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import SiteHeader from '@/components/SiteHeader';

type ScanResult = {
  status: 'success' | 'error' | 'already_used';
  message: string;
  ticketInfo?: {
    tierName: string;
    attendeeName: string | null;
    attendeeEmail: string | null;
  };
};

export default function EventCheckIn() {
  const { id: idParam } = useParams();
  const eventId = idParam ? parseInt(idParam) : 0;
  const [, navigate] = useLocation();

  const [scannerActive, setScannerActive] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const scannerRef = useRef<any>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);
  const lastScannedRef = useRef<string>('');

  const { data: event, isLoading: eventLoading } = trpc.events.getById.useQuery(
    { id: eventId },
    { enabled: eventId > 0 }
  );

  const { data: checkInStats, refetch: refetchStats } = trpc.ticketing.getCheckInStats.useQuery(
    { eventId },
    { enabled: eventId > 0, refetchInterval: 10000 }
  );

  const validateMutation = trpc.ticketing.validateTicket.useMutation();

  const handleValidate = useCallback(async (ticketCode: string) => {
    if (!ticketCode.trim() || isValidating) return;
    
    // Prevent duplicate scans within 3 seconds
    if (ticketCode === lastScannedRef.current) return;
    lastScannedRef.current = ticketCode;
    setTimeout(() => { lastScannedRef.current = ''; }, 3000);

    setIsValidating(true);
    setLastResult(null);

    try {
      const result = await validateMutation.mutateAsync({
        ticketCode: ticketCode.trim(),
      });

      if (result.valid) {
        const ticket = result.ticket as any;
        setLastResult({
          status: 'success',
          message: `Checked in: ${ticket?.tierName || 'Ticket'}`,
          ticketInfo: {
            tierName: ticket?.tierName || '',
            attendeeName: ticket?.attendeeName || null,
            attendeeEmail: null,
          },
        });
        toast.success('Ticket validated!');
      } else {
        const isAlreadyUsed = result.message?.includes('already used');
        setLastResult({
          status: isAlreadyUsed ? 'already_used' : 'error',
          message: result.message || 'Invalid ticket',
        });
        toast.error(result.message || 'Invalid ticket');
      }
      refetchStats();
    } catch (err: any) {
      setLastResult({
        status: 'error',
        message: err.message || 'Validation failed',
      });
      toast.error(err.message || 'Validation failed');
    } finally {
      setIsValidating(false);
      setManualCode('');
    }
  }, [eventId, isValidating, validateMutation, refetchStats]);

  // Initialize QR scanner
  useEffect(() => {
    if (!scannerActive || !scannerContainerRef.current) return;

    let html5QrCode: any = null;
    let mounted = true;

    const startScanner = async () => {
      try {
        // Check if camera is available before importing the library
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera not available. Please allow camera access or use manual entry below.');
        }

        // Wait a tick for DOM to be ready
        await new Promise(resolve => setTimeout(resolve, 100));
        if (!mounted) return;

        const container = document.getElementById('qr-reader');
        if (!container) {
          throw new Error('Scanner container not ready');
        }

        const { Html5Qrcode } = await import('html5-qrcode');
        if (!mounted) return;
        
        html5QrCode = new Html5Qrcode('qr-reader');
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText: string) => {
            handleValidate(decodedText);
          },
          () => {} // ignore errors during scanning
        );
      } catch (err: any) {
        console.error('Scanner error:', err);
        if (mounted) {
          toast.error(err?.message || 'Could not access camera. Please use manual entry.');
          setScannerActive(false);
        }
      }
    };

    startScanner();

    return () => {
      mounted = false;
      if (html5QrCode) {
        try {
          html5QrCode.stop().catch(() => {});
          html5QrCode.clear();
        } catch (e) {
          // ignore cleanup errors
        }
        scannerRef.current = null;
      }
    };
  }, [scannerActive]); // eslint-disable-line react-hooks/exhaustive-deps

  if (eventLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <SiteHeader />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <SiteHeader />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
          <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-4 max-w-lg">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/events/${eventId}/tickets`)} className="text-white hover:bg-white/10">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">Check-In</h1>
            <p className="text-xs text-slate-400 truncate">{event.eventTitle}</p>
          </div>
        </div>

        {/* Check-in Stats */}
        {checkInStats && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            <Card className="bg-white/10 border-white/20">
              <CardContent className="pt-3 pb-2 px-3 text-center">
                <p className="text-2xl font-bold text-green-400">{checkInStats.checkedIn}</p>
                <p className="text-[10px] text-slate-400">Checked In</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-white/20">
              <CardContent className="pt-3 pb-2 px-3 text-center">
                <p className="text-2xl font-bold text-white">{checkInStats.total}</p>
                <p className="text-[10px] text-slate-400">Total Sold</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-white/20">
              <CardContent className="pt-3 pb-2 px-3 text-center">
                <p className="text-2xl font-bold text-blue-400">
                  {checkInStats.percentCheckedIn}%
                </p>
                <p className="text-[10px] text-slate-400">Attendance</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Scanner */}
        <Card className="bg-white/10 border-white/20 mb-4">
          <CardContent className="pt-4">
            {scannerActive ? (
              <ScannerErrorBoundary onError={() => { toast.error('Camera scanner failed. Please use manual entry.'); setScannerActive(false); }}>
                <div className="space-y-3">
                  <div
                    id="qr-reader"
                    ref={scannerContainerRef}
                    className="rounded-lg overflow-hidden"
                    style={{ minHeight: '280px' }}
                  />
                  <Button
                    variant="outline"
                    className="w-full border-white/30 text-white hover:bg-white/10"
                    onClick={() => setScannerActive(false)}
                  >
                    <CameraOff className="h-4 w-4 mr-2" />
                    Stop Camera
                  </Button>
                </div>
              </ScannerErrorBoundary>
            ) : (
              <Button
                className="w-full h-32 text-lg bg-purple-600 hover:bg-purple-700"
                onClick={() => setScannerActive(true)}
              >
                <Camera className="h-8 w-8 mr-3" />
                Scan QR Code
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Manual Entry */}
        <Card className="bg-white/10 border-white/20 mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
              <Search className="h-4 w-4" />
              Manual Entry
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter ticket code..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleValidate(manualCode)}
                className="bg-white/10 border-white/20 text-white placeholder:text-slate-500"
              />
              <Button
                onClick={() => handleValidate(manualCode)}
                disabled={!manualCode.trim() || isValidating}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Check'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Last Scan Result */}
        {lastResult && (
          <Card className={`mb-4 border-2 ${
            lastResult.status === 'success' 
              ? 'bg-green-900/30 border-green-500' 
              : lastResult.status === 'already_used'
              ? 'bg-yellow-900/30 border-yellow-500'
              : 'bg-red-900/30 border-red-500'
          }`}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                {lastResult.status === 'success' ? (
                  <CheckCircle2 className="h-10 w-10 text-green-400 flex-shrink-0" />
                ) : (
                  <XCircle className={`h-10 w-10 flex-shrink-0 ${lastResult.status === 'already_used' ? 'text-yellow-400' : 'text-red-400'}`} />
                )}
                <div>
                  <p className="font-bold text-lg">
                    {lastResult.status === 'success' ? 'Admitted' : lastResult.status === 'already_used' ? 'Already Used' : 'Invalid'}
                  </p>
                  <p className="text-sm text-slate-300">{lastResult.message}</p>
                  {lastResult.ticketInfo?.attendeeName && (
                    <p className="text-sm text-slate-400 mt-1">{lastResult.ticketInfo.attendeeName}</p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-3 text-slate-400 hover:text-white hover:bg-white/10"
                onClick={() => setLastResult(null)}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Remaining Info */}
        {checkInStats && checkInStats.remaining > 0 && (
          <Card className="bg-white/10 border-white/20">
            <CardContent className="pt-4 text-center">
              <p className="text-sm text-slate-400">
                <span className="text-white font-bold">{checkInStats.remaining}</span> tickets remaining to check in
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
