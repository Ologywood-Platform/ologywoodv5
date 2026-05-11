import React, { useState, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SignaturePad } from './SignaturePad';
import {
  FileText,
  CheckCircle2,
  Clock,
  PenTool,
  Shield,
  Download,
  Eye,
  AlertTriangle,
  Loader2,
  Upload,
  Send,
  Plus,
  X,
  FileUp,
  Edit3,
  Trash2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

// ============= CONTRACT FORM (Platform-Generated) =============

const DEFAULT_CLAUSES = [
  { key: 'liability', label: 'Liability & Insurance', text: 'The performing artist/group shall maintain adequate liability insurance coverage for the duration of the event. The venue shall not be held liable for any injuries or damages caused by the artist or their crew during the event.' },
  { key: 'loadInOut', label: 'Load-In / Load-Out', text: 'Load-in time: [TBD]. Load-out must be completed within 2 hours after the event ends. The artist agrees to use designated loading areas only.' },
  { key: 'soundRestrictions', label: 'Sound Restrictions', text: 'Sound levels must comply with local noise ordinances. The venue reserves the right to request volume adjustments. Sound check times will be coordinated with venue management.' },
  { key: 'cancellation', label: 'Cancellation Policy', text: 'Either party may cancel with 30 days written notice for a full refund. Cancellations within 14 days will result in a 50% fee. Cancellations within 7 days will result in full payment due.' },
  { key: 'alcohol', label: 'Alcohol & Beverage Policy', text: 'All alcohol service is managed exclusively by the venue. The artist and crew may not bring outside alcohol onto the premises. The venue reserves all beverage sales rights.' },
  { key: 'venueRules', label: 'Venue Rules & Conduct', text: 'The artist agrees to comply with all venue rules and regulations. Any damage to venue property caused by the artist or their crew will be the financial responsibility of the artist.' },
  { key: 'parking', label: 'Parking & Access', text: 'The venue will provide [TBD] parking spaces for the artist and crew. Vehicle access to loading areas is subject to venue scheduling.' },
  { key: 'merch', label: 'Merchandise Sales', text: 'The artist may sell merchandise at the venue with prior approval. The venue retains [TBD]% of merchandise sales as a venue fee. Merchandise table location will be designated by venue management.' },
];

interface ContractFormData {
  title: string;
  description: string;
  clauses: { key: string; label: string; text: string; enabled: boolean }[];
  customTerms: string;
  venueRep: string;
  eventSpecifics: string;
}

function ContractForm({
  bookingId,
  onCreated,
  onCancel,
}: {
  bookingId: number;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<ContractFormData>({
    title: 'Venue Agreement',
    description: '',
    clauses: DEFAULT_CLAUSES.map(c => ({ ...c, enabled: true })),
    customTerms: '',
    venueRep: '',
    eventSpecifics: '',
  });

  const createMutation = trpc.venueContract.create.useMutation({
    onSuccess: () => {
      toast.success('Contract created as draft');
      onCreated();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast.error('Please enter a contract title');
      return;
    }
    const enabledClauses = formData.clauses.filter(c => c.enabled);
    if (enabledClauses.length === 0 && !formData.customTerms.trim()) {
      toast.error('Please include at least one clause or custom terms');
      return;
    }

    createMutation.mutate({
      bookingId,
      title: formData.title,
      description: formData.description,
      contractType: 'platform_generated',
      contractData: {
        clauses: enabledClauses.map(c => ({ label: c.label, text: c.text })),
        customTerms: formData.customTerms,
        venueRep: formData.venueRep,
        eventSpecifics: formData.eventSpecifics,
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Contract Title</label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="e.g., Venue Performance Agreement"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description (Optional)</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Brief description of this agreement..."
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Venue Representative Name</label>
        <Input
          value={formData.venueRep}
          onChange={(e) => setFormData(prev => ({ ...prev, venueRep: e.target.value }))}
          placeholder="Name of authorized venue representative"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Event-Specific Details</label>
        <Textarea
          value={formData.eventSpecifics}
          onChange={(e) => setFormData(prev => ({ ...prev, eventSpecifics: e.target.value }))}
          placeholder="Doors open time, set times, curfew, capacity limits, etc."
          rows={3}
        />
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium">Contract Clauses</label>
        <p className="text-xs text-muted-foreground">Toggle clauses on/off and edit the text as needed for your venue.</p>
        {formData.clauses.map((clause, idx) => (
          <div key={clause.key} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={clause.enabled}
                  onChange={(e) => {
                    const updated = [...formData.clauses];
                    updated[idx] = { ...updated[idx], enabled: e.target.checked };
                    setFormData(prev => ({ ...prev, clauses: updated }));
                  }}
                  className="rounded"
                />
                {clause.label}
              </label>
            </div>
            {clause.enabled && (
              <Textarea
                value={clause.text}
                onChange={(e) => {
                  const updated = [...formData.clauses];
                  updated[idx] = { ...updated[idx], text: e.target.value };
                  setFormData(prev => ({ ...prev, clauses: updated }));
                }}
                rows={3}
                className="text-sm"
              />
            )}
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Additional Custom Terms</label>
        <Textarea
          value={formData.customTerms}
          onChange={(e) => setFormData(prev => ({ ...prev, customTerms: e.target.value }))}
          placeholder="Any additional terms, requirements, or special conditions..."
          rows={4}
        />
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={createMutation.isPending}>
          {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
          Save as Draft
        </Button>
      </div>
    </div>
  );
}

// ============= PDF UPLOAD FORM =============

function PdfUploadForm({
  bookingId,
  onCreated,
  onCancel,
}: {
  bookingId: number;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState('Venue Agreement');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createMutation = trpc.venueContract.create.useMutation();
  const uploadMutation = trpc.venueContract.uploadPdf.useMutation();

  const handleUpload = async () => {
    if (!title.trim()) {
      toast.error('Please enter a contract title');
      return;
    }
    if (!file) {
      toast.error('Please select a PDF file');
      return;
    }

    setUploading(true);
    try {
      // Create the contract first
      const contract = await createMutation.mutateAsync({
        bookingId,
        title,
        description,
        contractType: 'uploaded_pdf',
      });

      // Upload the PDF
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        await uploadMutation.mutateAsync({
          venueContractId: contract.id,
          fileData: base64,
          fileName: file.name,
          mimeType: file.type || 'application/pdf',
        });
        toast.success('Contract uploaded successfully');
        onCreated();
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload contract');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Contract Title</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Venue Performance Agreement"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description (Optional)</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of this contract..."
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Upload Contract PDF</label>
        <div
          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          {file ? (
            <div className="flex items-center justify-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">{file.name}</span>
              <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(0)} KB)</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <div>
              <FileUp className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Click to select a PDF file</p>
              <p className="text-xs text-muted-foreground mt-1">Max 10MB</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              const selected = e.target.files?.[0];
              if (selected) {
                if (selected.size > 10 * 1024 * 1024) {
                  toast.error('File size must be under 10MB');
                  return;
                }
                setFile(selected);
              }
            }}
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleUpload} disabled={uploading || !file}>
          {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
          Upload & Save as Draft
        </Button>
      </div>
    </div>
  );
}

// ============= CONTRACT PREVIEW (Platform-Generated) =============

function ContractPreview({ contractData, title }: { contractData: Record<string, any>; title: string }) {
  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-lg border text-sm">
      <h3 className="text-lg font-bold text-center">{title}</h3>
      {contractData.venueRep && (
        <p><strong>Venue Representative:</strong> {contractData.venueRep}</p>
      )}
      {contractData.eventSpecifics && (
        <div>
          <strong>Event Details:</strong>
          <p className="mt-1 whitespace-pre-wrap">{contractData.eventSpecifics}</p>
        </div>
      )}
      {contractData.clauses?.map((clause: { label: string; text: string }, idx: number) => (
        <div key={idx}>
          <h4 className="font-semibold">{idx + 1}. {clause.label}</h4>
          <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{clause.text}</p>
        </div>
      ))}
      {contractData.customTerms && (
        <div>
          <h4 className="font-semibold">Additional Terms</h4>
          <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{contractData.customTerms}</p>
        </div>
      )}
    </div>
  );
}

// ============= STATUS BADGE =============

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    draft: { label: 'Draft', variant: 'secondary' },
    sent: { label: 'Sent to Artist', variant: 'default' },
    viewed: { label: 'Viewed by Artist', variant: 'default' },
    signed_by_venue: { label: 'Signed by Venue', variant: 'outline' },
    signed_by_artist: { label: 'Signed by Artist', variant: 'outline' },
    fully_signed: { label: 'Fully Signed', variant: 'default' },
    declined: { label: 'Declined', variant: 'destructive' },
  };
  const c = config[status] || { label: status, variant: 'secondary' as const };
  return <Badge variant={c.variant}>{c.label}</Badge>;
}

// ============= SIGNING FORM =============

function SigningForm({
  venueContractId,
  signerRole,
  onComplete,
  onCancel,
}: {
  venueContractId: number;
  signerRole: 'artist' | 'venue';
  onComplete: () => void;
  onCancel: () => void;
}) {
  const [signerName, setSignerName] = useState('');
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signatureType, setSignatureType] = useState<'drawn' | 'typed'>('drawn');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const signMutation = trpc.venueContract.sign.useMutation({
    onSuccess: (result) => {
      toast.success(
        result.contractStatus === 'fully_signed'
          ? 'Contract fully signed! Both parties have agreed.'
          : 'Signature recorded. Waiting for the other party to countersign.'
      );
      onComplete();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSign = () => {
    if (!signerName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (!signatureData) {
      toast.error('Please provide your signature');
      return;
    }
    if (!agreedToTerms) {
      toast.error('Please agree to the terms');
      return;
    }

    signMutation.mutate({
      venueContractId,
      signatureData,
      signerName: signerName.trim(),
      signatureType,
    });
  };

  return (
    <div className="space-y-4 border-t pt-4 mt-4">
      <h4 className="font-semibold flex items-center gap-2">
        <PenTool className="w-4 h-4" />
        Sign this Contract
      </h4>

      <div className="space-y-2">
        <label className="text-sm font-medium">Your Full Legal Name</label>
        <Input
          value={signerName}
          onChange={(e) => setSignerName(e.target.value)}
          placeholder="Enter your full name"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Signature</label>
        <div className="flex gap-2 mb-2">
          <Button
            variant={signatureType === 'drawn' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSignatureType('drawn')}
          >
            Draw Signature
          </Button>
          <Button
            variant={signatureType === 'typed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSignatureType('typed')}
          >
            Type Signature
          </Button>
        </div>

        {signatureType === 'drawn' ? (
          <SignaturePad
            onSignatureChange={(data) => setSignatureData(data)}
          />
        ) : (
          <div className="border rounded-lg p-4 bg-white">
            <Input
              value={signatureData || ''}
              onChange={(e) => setSignatureData(e.target.value)}
              placeholder="Type your full name as signature"
              className="text-2xl italic font-serif text-center border-0 border-b-2 rounded-none focus:ring-0"
            />
          </div>
        )}
      </div>

      <label className="flex items-start gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={agreedToTerms}
          onChange={(e) => setAgreedToTerms(e.target.checked)}
          className="mt-0.5 rounded"
        />
        <span>
          I, <strong>{signerName || '[Your Name]'}</strong>, acknowledge that I have read and agree to the terms
          of this venue agreement. This electronic signature is legally binding.
        </span>
      </label>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button
          onClick={handleSign}
          disabled={signMutation.isPending || !signerName || !signatureData || !agreedToTerms}
        >
          {signMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
          Sign Contract
        </Button>
      </div>
    </div>
  );
}

// ============= SINGLE CONTRACT CARD =============

function VenueContractCard({
  contract,
  currentUserRole,
  onRefresh,
}: {
  contract: any;
  currentUserRole: 'artist' | 'venue';
  onRefresh: () => void;
}) {
  const [showPreview, setShowPreview] = useState(false);
  const [showSigning, setShowSigning] = useState(false);

  const sendMutation = trpc.venueContract.send.useMutation({
    onSuccess: () => {
      toast.success('Contract sent to artist');
      onRefresh();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.venueContract.delete.useMutation({
    onSuccess: () => {
      toast.success('Contract deleted');
      onRefresh();
    },
    onError: (err) => toast.error(err.message),
  });

  const declineMutation = trpc.venueContract.decline.useMutation({
    onSuccess: () => {
      toast.success('Contract declined');
      onRefresh();
    },
    onError: (err) => toast.error(err.message),
  });

  const markViewedMutation = trpc.venueContract.markViewed.useMutation();

  // Mark as viewed when artist opens preview
  const handlePreviewToggle = () => {
    const newState = !showPreview;
    setShowPreview(newState);
    if (newState && currentUserRole === 'artist' && contract.status === 'sent') {
      markViewedMutation.mutate({ venueContractId: contract.id });
    }
  };

  const canSign = () => {
    if (currentUserRole === 'venue') {
      return ['draft', 'sent', 'viewed', 'signed_by_artist'].includes(contract.status) && !contract.venueSigned;
    }
    if (currentUserRole === 'artist') {
      return ['sent', 'viewed', 'signed_by_venue'].includes(contract.status) && !contract.artistSigned;
    }
    return false;
  };

  const canSend = currentUserRole === 'venue' && (contract.status === 'draft' || contract.status === 'signed_by_venue');
  const canDelete = currentUserRole === 'venue' && contract.status === 'draft';
  const canDecline = currentUserRole === 'artist' && ['sent', 'viewed'].includes(contract.status);

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-sm">{contract.title}</h4>
            <StatusBadge status={contract.status} />
          </div>
          {contract.description && (
            <p className="text-xs text-muted-foreground mt-1">{contract.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span>Type: {contract.contractType === 'uploaded_pdf' ? 'PDF Upload' : 'Platform Generated'}</span>
            {contract.sentAt && <span>Sent: {new Date(contract.sentAt).toLocaleDateString()}</span>}
          </div>
        </div>
      </div>

      {/* Signature status */}
      <div className="flex gap-4 text-xs">
        <div className="flex items-center gap-1">
          {contract.venueSigned ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
          ) : (
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          )}
          <span>Venue: {contract.venueSigned ? `Signed by ${contract.venueSignerName}` : 'Pending'}</span>
        </div>
        <div className="flex items-center gap-1">
          {contract.artistSigned ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
          ) : (
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          )}
          <span>Artist: {contract.artistSigned ? `Signed by ${contract.artistSignerName}` : 'Pending'}</span>
        </div>
      </div>

      {contract.status === 'fully_signed' && (
        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded">
          <CheckCircle2 className="w-4 h-4" />
          <span className="font-medium">Contract fully executed — both parties have signed</span>
        </div>
      )}

      {contract.status === 'declined' && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
          <XCircle className="w-4 h-4" />
          <span className="font-medium">Contract declined by artist</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={handlePreviewToggle}>
          <Eye className="w-3.5 h-3.5 mr-1" />
          {showPreview ? 'Hide' : 'View'}
        </Button>

        {contract.contractType === 'uploaded_pdf' && contract.fileUrl && (
          <Button variant="outline" size="sm" asChild>
            <a href={contract.fileUrl} target="_blank" rel="noopener noreferrer">
              <Download className="w-3.5 h-3.5 mr-1" />
              Download PDF
            </a>
          </Button>
        )}

        {canSend && (
          <Button
            size="sm"
            onClick={() => sendMutation.mutate({ venueContractId: contract.id })}
            disabled={sendMutation.isPending}
          >
            {sendMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Send className="w-3.5 h-3.5 mr-1" />}
            Send to Artist
          </Button>
        )}

        {canSign() && (
          <Button size="sm" variant="default" onClick={() => setShowSigning(true)}>
            <PenTool className="w-3.5 h-3.5 mr-1" />
            Sign Contract
          </Button>
        )}

        {canDecline && (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              if (confirm('Are you sure you want to decline this contract?')) {
                declineMutation.mutate({ venueContractId: contract.id });
              }
            }}
            disabled={declineMutation.isPending}
          >
            <XCircle className="w-3.5 h-3.5 mr-1" />
            Decline
          </Button>
        )}

        {canDelete && (
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={() => {
              if (confirm('Delete this draft contract?')) {
                deleteMutation.mutate({ venueContractId: contract.id });
              }
            }}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Delete
          </Button>
        )}
      </div>

      {/* Preview */}
      {showPreview && (
        <div className="mt-2">
          {contract.contractType === 'platform_generated' && contract.contractData ? (
            <ContractPreview contractData={contract.contractData} title={contract.title} />
          ) : contract.contractType === 'uploaded_pdf' && contract.fileUrl ? (
            <div className="border rounded-lg overflow-hidden" style={{ height: '500px' }}>
              <iframe
                src={contract.fileUrl}
                className="w-full h-full"
                title="Contract PDF"
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No contract content available</p>
          )}
        </div>
      )}

      {/* Signing Form */}
      {showSigning && (
        <SigningForm
          venueContractId={contract.id}
          signerRole={currentUserRole}
          onComplete={() => {
            setShowSigning(false);
            onRefresh();
          }}
          onCancel={() => setShowSigning(false)}
        />
      )}
    </div>
  );
}

// ============= MAIN COMPONENT =============

interface VenueContractSectionProps {
  bookingId: number;
  currentUserRole: 'artist' | 'venue';
  onContractChange?: () => void;
}

export function VenueContractSection({
  bookingId,
  currentUserRole,
  onContractChange,
}: VenueContractSectionProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createMode, setCreateMode] = useState<'form' | 'upload' | null>(null);

  const { data: contracts, isLoading, refetch } = trpc.venueContract.getForBooking.useQuery(
    { bookingId },
    { enabled: bookingId > 0 }
  );

  const handleRefresh = () => {
    refetch();
    onContractChange?.();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground mt-2">Loading venue contracts...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Venue Agreement
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              {currentUserRole === 'venue'
                ? 'Upload or create your venue contract for the artist to review and sign'
                : 'Review and sign the venue agreement for this booking'}
            </CardDescription>
          </div>
          {currentUserRole === 'venue' && !showCreateForm && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Contract
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create new contract form */}
        {showCreateForm && !createMode && (
          <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
            <h4 className="font-semibold text-sm">How would you like to create the contract?</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                className="border rounded-lg p-4 text-left hover:border-primary/50 hover:bg-primary/5 transition-colors"
                onClick={() => setCreateMode('form')}
              >
                <Edit3 className="w-5 h-5 text-primary mb-2" />
                <h5 className="font-medium text-sm">Create on Platform</h5>
                <p className="text-xs text-muted-foreground mt-1">
                  Build your contract using our template with customizable clauses
                </p>
              </button>
              <button
                className="border rounded-lg p-4 text-left hover:border-primary/50 hover:bg-primary/5 transition-colors"
                onClick={() => setCreateMode('upload')}
              >
                <FileUp className="w-5 h-5 text-primary mb-2" />
                <h5 className="font-medium text-sm">Upload PDF</h5>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload your existing venue contract as a PDF document
                </p>
              </button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setShowCreateForm(false); setCreateMode(null); }}
            >
              Cancel
            </Button>
          </div>
        )}

        {showCreateForm && createMode === 'form' && (
          <div className="border rounded-lg p-4 bg-muted/30">
            <ContractForm
              bookingId={bookingId}
              onCreated={() => {
                setShowCreateForm(false);
                setCreateMode(null);
                handleRefresh();
              }}
              onCancel={() => { setShowCreateForm(false); setCreateMode(null); }}
            />
          </div>
        )}

        {showCreateForm && createMode === 'upload' && (
          <div className="border rounded-lg p-4 bg-muted/30">
            <PdfUploadForm
              bookingId={bookingId}
              onCreated={() => {
                setShowCreateForm(false);
                setCreateMode(null);
                handleRefresh();
              }}
              onCancel={() => { setShowCreateForm(false); setCreateMode(null); }}
            />
          </div>
        )}

        {/* Existing contracts */}
        {contracts && contracts.length > 0 ? (
          contracts.map((contract: any) => (
            <VenueContractCard
              key={contract.id}
              contract={contract}
              currentUserRole={currentUserRole}
              onRefresh={handleRefresh}
            />
          ))
        ) : !showCreateForm ? (
          <div className="text-center py-6 text-muted-foreground">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">
              {currentUserRole === 'venue'
                ? 'No venue contracts yet. Click "Add Contract" to create one.'
                : 'No venue contracts for this booking yet.'}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
