import { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { QrCode, Printer, Download, X } from "lucide-react";

interface TipLinks {
  cashapp?: string;
  venmo?: string;
  paypal?: string;
  zelle?: string;
}

interface TipQRCodeProps {
  tipLinks: TipLinks;
  artistName: string;
  /** Show in compact mode for edit profile preview */
  compact?: boolean;
}

const SERVICES = [
  {
    key: "cashapp" as const,
    label: "Cash App",
    color: "#00D54B",
    letter: "$",
    getUrl: (handle: string) =>
      handle.startsWith("http") ? handle : `https://cash.app/${handle.replace(/^\$/, "$")}`,
  },
  {
    key: "venmo" as const,
    label: "Venmo",
    color: "#3D95CE",
    letter: "V",
    getUrl: (handle: string) =>
      handle.startsWith("http") ? handle : `https://venmo.com/${handle.replace(/^@/, "")}`,
  },
  {
    key: "paypal" as const,
    label: "PayPal",
    color: "#00457C",
    letter: "P",
    getUrl: (handle: string) =>
      handle.startsWith("http") ? handle : `https://paypal.me/${handle}`,
  },
  {
    key: "zelle" as const,
    label: "Zelle",
    color: "#6D1ED4",
    letter: "Z",
    getUrl: (handle: string) => `mailto:${handle}?subject=Zelle%20Payment`,
  },
];

function QRCard({
  service,
  handle,
  size = 120,
}: {
  service: (typeof SERVICES)[number];
  handle: string;
  size?: number;
}) {
  const url = service.getUrl(handle);
  return (
    <div className="flex flex-col items-center gap-2">
      <a href={url} target="_blank" rel="noopener noreferrer" className="block">
        <div className="bg-white p-2 rounded-lg shadow-sm border hover:border-purple-300 hover:shadow-md transition-all cursor-pointer">
          <QRCodeSVG
            value={url}
            size={size}
            bgColor="#ffffff"
            fgColor="#000000"
            level="M"
            includeMargin={false}
          />
        </div>
      </a>
      <div className="flex items-center gap-1.5">
        <span
          className="inline-flex items-center justify-center w-4 h-4 rounded"
          style={{ backgroundColor: service.color }}
        >
          <span className="text-white text-[10px] font-bold">{service.letter}</span>
        </span>
        <span className="text-xs font-medium">{service.label}</span>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[10px] text-purple-600 hover:text-purple-800 underline truncate max-w-[140px] font-medium"
      >
        Click to send tip
      </a>
    </div>
  );
}

/** Compact QR preview for Edit Profile page */
export function TipQRPreview({ tipLinks }: { tipLinks: TipLinks }) {
  const activeServices = SERVICES.filter((s) => tipLinks[s.key]?.trim());
  if (activeServices.length === 0) return null;

  return (
    <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-dashed">
      <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
        <QrCode className="h-3.5 w-3.5" />
        QR Code Preview — fans will see these on your profile
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        {activeServices.map((service) => (
          <QRCard
            key={service.key}
            service={service}
            handle={tipLinks[service.key]!}
            size={80}
          />
        ))}
      </div>
    </div>
  );
}

/** Full QR display for Artist Profile page with print card option */
export function TipQRSection({ tipLinks, artistName }: TipQRCodeProps) {
  const [showQR, setShowQR] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const activeServices = SERVICES.filter((s) => tipLinks[s.key]?.trim());

  if (activeServices.length === 0) return null;

  const handlePrint = () => {
    if (!printRef.current) return;
    const printContent = printRef.current.innerHTML;
    const printWindow = window.open("", "_blank", "width=600,height=800");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tip ${artistName} - QR Codes</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            display: flex; justify-content: center; align-items: center;
            min-height: 100vh; background: white; padding: 20px;
          }
          .card {
            border: 2px solid #e5e7eb; border-radius: 16px; padding: 32px;
            max-width: 500px; width: 100%; text-align: center;
          }
          .card h1 { font-size: 24px; margin-bottom: 4px; color: #111; }
          .card .subtitle { font-size: 14px; color: #6b7280; margin-bottom: 24px; }
          .qr-grid { 
            display: flex; flex-wrap: wrap; gap: 24px; 
            justify-content: center; margin-bottom: 20px;
          }
          .qr-item { text-align: center; }
          .qr-item svg { border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px; }
          .qr-label { 
            display: flex; align-items: center; justify-content: center;
            gap: 6px; margin-top: 8px; font-size: 13px; font-weight: 600;
          }
          .qr-label .dot {
            width: 14px; height: 14px; border-radius: 3px;
            display: inline-flex; align-items: center; justify-content: center;
            color: white; font-size: 9px; font-weight: bold;
          }
          .qr-handle { font-size: 11px; color: #9ca3af; margin-top: 2px; }
          .footer { font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 16px; }
          .footer .brand { color: #6D28D9; font-weight: 600; }
          @media print {
            body { padding: 0; }
            .card { border: none; }
          }
        </style>
      </head>
      <body>
        ${printContent}
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowQR(true)}
        className="w-full mt-2 gap-2"
      >
        <QrCode className="h-4 w-4" />
        Show QR Codes
      </Button>

      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              Tip {artistName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Scan any QR code below to send a tip directly — no platform fees.
            </p>

            <div className="flex flex-wrap gap-6 justify-center py-2">
              {activeServices.map((service) => (
                <QRCard
                  key={service.key}
                  service={service}
                  handle={tipLinks[service.key]!}
                  size={120}
                />
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={handlePrint}>
                <Printer className="h-4 w-4" />
                Print Card
              </Button>
              <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => setShowQR(false)}>
                <X className="h-4 w-4" />
                Close
              </Button>
            </div>
          </div>

          {/* Hidden printable card content */}
          <div className="hidden">
            <div ref={printRef}>
              <div className="card">
                <h1>Support {artistName}</h1>
                <p className="subtitle">Scan to send a tip — no platform fees</p>
                <div className="qr-grid">
                  {activeServices.map((service) => {
                    const url = service.getUrl(tipLinks[service.key]!);
                    return (
                      <div key={service.key} className="qr-item">
                        <QRCodeSVG value={url} size={140} bgColor="#ffffff" fgColor="#000000" level="M" />
                        <div className="qr-label">
                          <span className="dot" style={{ backgroundColor: service.color }}>
                            {service.letter}
                          </span>
                          {service.label}
                        </div>
                        <div className="qr-handle">{tipLinks[service.key]}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="footer">
                  Powered by <span className="brand">Ologywood</span> — ologywood.com
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
