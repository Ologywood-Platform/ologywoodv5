import { useState } from 'react';
import { toSlug } from '@/lib/slugify';
import { useParams, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Calendar, MapPin, Ticket, ArrowLeft, Loader2, FileDown, Share2, Copy, Check, Facebook, Linkedin, CalendarPlus } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { TicketQRCode } from '@/components/TicketQRCode';
import { TicketTransfer } from '@/components/TicketTransfer';
import SiteHeader from '@/components/SiteHeader';
import { toast } from 'sonner';

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function calendarDateParts(value: Date | string | null, time?: string | null): Date | null {
  if (!value) return null;
  const raw = typeof value === 'string' ? value.slice(0, 10) : value.toISOString().slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!match) return null;
  const result = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const timeMatch = /^(\d{1,2}):(\d{2})/.exec(time || '');
  if (timeMatch) result.setHours(Number(timeMatch[1]), Number(timeMatch[2]), 0, 0);
  return result;
}

function calendarStamp(value: Date): string {
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${value.getFullYear()}${pad(value.getMonth() + 1)}${pad(value.getDate())}T${pad(value.getHours())}${pad(value.getMinutes())}00`;
}

function icsEscape(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll(';', '\\;').replaceAll(',', '\\,').replaceAll('\n', '\\n');
}

export default function TicketConfirmation() {
  const { orderNumber } = useParams();
  const [, navigate] = useLocation();
  const sessionId = new URLSearchParams(window.location.search).get('session_id') || undefined;
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  const { data: order, isLoading, error } = trpc.ticketing.getOrderByNumber.useQuery(
    { orderNumber: orderNumber || '', sessionId },
    { enabled: !!orderNumber }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <SiteHeader />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <SiteHeader />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
          <p className="text-muted-foreground mb-6">We couldn't find this order. Please check your order number.</p>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </div>
    );
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'TBD';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const downloadPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    const filename = `ologywood-ticket-${order.orderNumber}.pdf`;
    const qrImages = Array.from(document.querySelectorAll<HTMLCanvasElement>('#ticket-confirmation-content canvas'))
      .map((canvas) => canvas.toDataURL('image/png'));
    const eventTitle = escapeHtml(order.event?.title || 'Ologywood Event');
    const eventDate = escapeHtml(formatDate(order.event?.date || null));
    const eventTime = escapeHtml(order.event?.time || '');
    const eventLocation = escapeHtml(order.event?.location || '');
    const ticketRows = order.items.map((item: any, index: number) => `
      <section style="border:1px solid #d1d5db;border-radius:10px;padding:18px;margin:14px 0;page-break-inside:avoid;">
        <div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;">
          <div><h2 style="font-size:18px;margin:0 0 6px;">${escapeHtml(item.tierName)}</h2><p style="margin:0;color:#4b5563;">Status: ${escapeHtml(item.status)}</p></div>
          ${qrImages[index] ? `<img src="${qrImages[index]}" alt="Ticket QR code" style="width:170px;height:170px;" />` : ''}
        </div>
        <p style="font-family:monospace;font-size:12px;margin:12px 0 0;">Ticket code: ${escapeHtml(item.ticketCode)}</p>
      </section>`).join('');
    const element = document.createElement('div');
    element.style.cssText = 'font-family:Arial,sans-serif;color:#111827;background:#fff;padding:28px;width:760px;';
    element.innerHTML = `
      <h1 style="font-size:28px;margin:0 0 6px;">Ologywood Ticket Confirmation</h1>
      <p style="margin:0 0 18px;color:#4b5563;">Order ${escapeHtml(order.orderNumber)}</p>
      <div style="background:#f3f4f6;border-radius:10px;padding:16px;">
        <h2 style="font-size:20px;margin:0 0 8px;">${eventTitle}</h2>
        <p style="margin:4px 0;">${eventDate}${eventTime ? ` at ${eventTime}` : ''}</p>
        ${eventLocation ? `<p style="margin:4px 0;">${eventLocation}</p>` : ''}
      </div>
      ${ticketRows}
      <p style="font-size:12px;color:#4b5563;margin-top:20px;">Present a valid QR code at the venue entrance. Each ticket can be checked in once. Keep this PDF available offline.</p>`;
    try {
      const module = await import('html2pdf.js');
      const html2pdf = module.default ?? module;
      if (typeof html2pdf !== 'function') throw new Error('PDF generator unavailable');
      document.body.appendChild(element);
      const pdfBlob = await html2pdf().set({
        margin: 10,
        filename,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, onclone: (clonedDocument: Document) => clonedDocument.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => node.remove()) },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
      }).from(element).outputPdf('blob');
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success('Ticket PDF downloaded');
    } catch (error) {
      console.error('[Ticket PDF] Export failed:', error instanceof Error ? error.name : 'UnknownError');
      toast.error('Could not download the ticket PDF. Please try again.');
    } finally {
      element.remove();
      setIsExportingPdf(false);
    }
  };

  const eventShareUrl = order.event
    ? `${window.location.origin}/events/${toSlug(order.event.title || '')}`
    : window.location.origin;
  const eventShareText = order.event
    ? `I'm attending ${order.event.title} — see you there!`
    : "I'm attending an event on Ologywood!";

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(eventShareUrl);
      setCopiedShareLink(true);
      toast.success('Event link copied');
      window.setTimeout(() => setCopiedShareLink(false), 1800);
    } catch {
      toast.error('Could not copy the event link');
    }
  };

  const shareEvent = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: order.event?.title || 'Ologywood event', text: eventShareText, url: eventShareUrl });
      } catch (error) {
        if (!(error && typeof error === 'object' && 'name' in error && error.name === 'AbortError')) {
          toast.error('Could not open device sharing. Try Copy Link.');
        }
      }
      return;
    }
    await copyShareLink();
  };

  const calendarStart = calendarDateParts(order.event?.date || null, order.event?.time);
  const calendarEnd = calendarStart ? new Date(calendarStart.getTime() + (order.event?.time ? 2 : 24) * 60 * 60 * 1000) : null;
  const calendarTitle = order.event?.title || 'Ologywood event';
  const calendarDetails = `Ticket confirmation for ${calendarTitle}. View your ticket and QR code in Ologywood.`;
  const calendarLocation = order.event?.location || '';

  const addToGoogleCalendar = () => {
    if (!calendarStart || !calendarEnd) {
      toast.error('This event does not have a usable date yet.');
      return;
    }
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: calendarTitle,
      dates: `${calendarStamp(calendarStart)}/${calendarStamp(calendarEnd)}`,
      details: calendarDetails,
      location: calendarLocation,
    });
    window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank', 'noopener,noreferrer');
  };

  const addToAppleCalendar = () => {
    if (!calendarStart || !calendarEnd) {
      toast.error('This event does not have a usable date yet.');
      return;
    }
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Ologywood//Ticket Confirmation//EN',
      'BEGIN:VEVENT',
      `UID:ologywood-ticket-${order.orderNumber}@ologywood.com`,
      `DTSTAMP:${calendarStamp(new Date())}Z`,
      `DTSTART;TZID=${timezone}:${calendarStamp(calendarStart)}`,
      `DTEND;TZID=${timezone}:${calendarStamp(calendarEnd)}`,
      `SUMMARY:${icsEscape(calendarTitle)}`,
      `DESCRIPTION:${icsEscape(calendarDetails)}`,
      `LOCATION:${icsEscape(calendarLocation)}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `ologywood-${toSlug(calendarTitle)}.ics`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success('Apple Calendar file downloaded');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <SiteHeader />
      <div id="ticket-confirmation-content" className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-slate-900">You're In!</h1>
          <p className="text-muted-foreground mt-2">
            Your tickets have been confirmed. Show the QR codes below at the door.
          </p>
        </div>

        {/* Order Details */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Order #{order.orderNumber}</CardTitle>
              <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                {order.status === 'completed' ? 'Confirmed' : order.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Event Info */}
            {order.event && (
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-bold text-lg">{order.event.title}</h3>
                <div className="flex flex-col gap-1 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(order.event.date)}
                    {order.event.time && ` at ${order.event.time}`}
                  </span>
                  {order.event.location && (
                    <span className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {order.event.location}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Tickets with QR Codes */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Ticket className="h-4 w-4" />
                Your Tickets ({order.items.length})
              </h4>
              <div className="space-y-4">
                {order.items.map((item: any) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold">{item.tierName}</p>
                        {item.attendeeName && (
                          <p className="text-sm text-muted-foreground">{item.attendeeName}</p>
                        )}
                      </div>
                      <Badge variant={item.status === 'valid' ? 'default' : item.status === 'used' ? 'secondary' : 'destructive'}>
                        {item.status === 'valid' ? 'Valid' : item.status === 'used' ? 'Used' : item.status}
                      </Badge>
                    </div>
                    {/* QR Code */}
                    <div className="flex justify-center py-2">
                      <TicketQRCode
                        ticketCode={item.ticketCode}
                        tierName={item.tierName}
                        size={180}
                      />
                    </div>
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      Show this QR code at the venue entrance
                    </p>
                    {/* Transfer / Gift option */}
                    {item.status === 'valid' && (
                      <TicketTransfer
                        ticketItemId={item.id}
                        ticketCode={item.ticketCode}
                        tierName={item.tierName}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Summary */}
            <div className="border-t pt-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${((order.totalAmount - order.platformFee) / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Service fee</span>
                <span>${(order.platformFee / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold mt-1 pt-1 border-t">
                <span>Total paid</span>
                <span>${(order.totalAmount / 100).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={downloadPdf} disabled={isExportingPdf} className="flex-1 min-w-[170px]">
            {isExportingPdf ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
            {isExportingPdf ? 'Preparing PDF…' : 'Download PDF'}
          </Button>
          <Button variant="outline" onClick={() => navigate('/')} className="flex-1">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          {order.event && (
            <Button onClick={() => navigate(`/events/${toSlug(order.event!.title || '')}`)} className="flex-1">
              View Event
            </Button>
          )}
        </div>

        {order.event && (
          <div className="mt-4 rounded-lg border bg-white/70 p-3">
            <p className="mb-2 flex items-center gap-2 text-sm font-medium"><Share2 className="h-4 w-4" /> Let friends know you’re attending</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={shareEvent} className="gap-2"><Share2 className="h-4 w-4" /> Share</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventShareUrl)}`, '_blank', 'noopener,noreferrer')} className="gap-2"><Facebook className="h-4 w-4" /> Facebook</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(eventShareUrl)}`, '_blank', 'noopener,noreferrer')} className="gap-2"><Linkedin className="h-4 w-4" /> LinkedIn</Button>
              <Button type="button" variant="outline" size="sm" onClick={copyShareLink} className="gap-2">{copiedShareLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copiedShareLink ? 'Copied' : 'Copy Link'}</Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Only the public event link is shared—never your order number, email, or QR code.</p>
          </div>
        )}

        {order.event && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={addToGoogleCalendar} className="gap-2"><CalendarPlus className="h-4 w-4" /> Add to Google Calendar</Button>
            <Button type="button" variant="outline" size="sm" onClick={addToAppleCalendar} className="gap-2"><CalendarPlus className="h-4 w-4" /> Add to Apple Calendar</Button>
          </div>
        )}

        {/* Info */}
        <p className="text-xs text-center text-muted-foreground mt-6">
          A confirmation email has been sent to {order.buyerEmail}. 
          Present your ticket QR code at the venue entrance for check-in.
        </p>
        <p className="text-xs text-center text-muted-foreground mt-2 font-medium">
          Tip: Screenshot this page or save the QR — you'll need it at the door.
        </p>
      </div>

    </div>
  );
}
