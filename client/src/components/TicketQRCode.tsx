import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Loader2 } from 'lucide-react';

interface TicketQRCodeProps {
  ticketCode: string;
  size?: number;
  tierName?: string;
}

export function TicketQRCode({ ticketCode, size = 160, tierName }: TicketQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(true);

  useEffect(() => {
    if (!canvasRef.current || !ticketCode) return;

    setIsGenerating(true);
    QRCode.toCanvas(canvasRef.current, ticketCode, {
      width: size,
      margin: 2,
      color: {
        dark: '#1a1a2e',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    }).then(() => {
      setIsGenerating(false);
    }).catch((err) => {
      console.error('QR code generation failed:', err);
      setIsGenerating(false);
    });
  }, [ticketCode, size]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative bg-white p-2 rounded-lg shadow-sm border">
        {isGenerating && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
        <canvas ref={canvasRef} />
      </div>
      {tierName && (
        <p className="text-xs font-medium text-muted-foreground">{tierName}</p>
      )}
      <p className="text-[10px] text-muted-foreground font-mono">{ticketCode.substring(0, 8).toUpperCase()}</p>
    </div>
  );
}
