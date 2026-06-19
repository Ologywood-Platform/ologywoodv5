import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { X, Heart, DollarSign, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const PRESET_AMOUNTS = [
  { label: '$5', value: 500 },
  { label: '$10', value: 1000 },
  { label: '$25', value: 2500 },
  { label: '$50', value: 5000 },
];

interface TipModalProps {
  isOpen: boolean;
  onClose: () => void;
  artistId: number;
  artistName: string;
}

function TipPaymentForm({
  amount,
  artistName,
  onSuccess,
  onClose,
}: {
  amount: number;
  artistName: string;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: 'if_required',
    });

    if (error) {
      toast.error(error.message || 'Payment failed. Please try again.');
      setProcessing(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-purple-50 rounded-lg p-3 text-center">
        <p className="text-sm text-purple-700">
          Sending <span className="font-bold">${(amount / 100).toFixed(2)}</span> to {artistName}
        </p>
        <p className="text-xs text-purple-500 mt-1">100% goes directly to the artist</p>
      </div>
      <PaymentElement />
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="flex-1"
          disabled={processing}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || processing}
          className="flex-1 bg-purple-600 hover:bg-purple-700"
        >
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Processing...
            </>
          ) : (
            <>
              <Heart className="h-4 w-4 mr-2" />
              Send Tip
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export function TipModal({ isOpen, onClose, artistId, artistName }: TipModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [tipperName, setTipperName] = useState('');
  const [message, setMessage] = useState('');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [step, setStep] = useState<'amount' | 'payment' | 'success'>('amount');

  const createTipMutation = trpc.tip.createTipPayment.useMutation({
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      setStep('payment');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create tip payment');
    },
  });

  useEffect(() => {
    if (!isOpen) {
      setSelectedAmount(null);
      setCustomAmount('');
      setTipperName('');
      setMessage('');
      setClientSecret(null);
      setStep('amount');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const finalAmount = selectedAmount || (customAmount ? Math.round(parseFloat(customAmount) * 100) : 0);

  const handleProceedToPayment = () => {
    if (!finalAmount || finalAmount < 100) {
      toast.error('Minimum tip amount is $1.00');
      return;
    }
    if (finalAmount > 50000) {
      toast.error('Maximum tip amount is $500.00');
      return;
    }
    createTipMutation.mutate({
      artistId,
      amount: finalAmount,
      tipperName: tipperName || undefined,
      message: message || undefined,
    });
  };

  const handleSuccess = () => {
    setStep('success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="h-5 w-5 text-slate-500" />
        </button>

        <CardHeader className="text-center pb-2">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-2">
            <Heart className="h-6 w-6 text-purple-600" />
          </div>
          <CardTitle className="text-lg">
            {step === 'success' ? 'Thank You!' : `Tip ${artistName}`}
          </CardTitle>
          {step === 'amount' && (
            <p className="text-sm text-slate-500 mt-1">
              Show your support — 100% goes directly to the artist
            </p>
          )}
        </CardHeader>

        <CardContent>
          {step === 'amount' && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-2">
                {PRESET_AMOUNTS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => {
                      setSelectedAmount(preset.value);
                      setCustomAmount('');
                    }}
                    className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-all ${
                      selectedAmount === preset.value
                        ? 'border-purple-600 bg-purple-50 text-purple-700 ring-2 ring-purple-200'
                        : 'border-slate-200 hover:border-purple-300 hover:bg-purple-50/50'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="number"
                  step="0.01"
                  min="1"
                  max="500"
                  placeholder="Custom amount"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setSelectedAmount(null);
                  }}
                  className="pl-8"
                />
              </div>

              <Input
                placeholder="Your name (optional)"
                value={tipperName}
                onChange={(e) => setTipperName(e.target.value)}
                maxLength={50}
              />

              <Input
                placeholder="Leave a message (optional)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={200}
              />

              <Button
                onClick={handleProceedToPayment}
                disabled={!finalAmount || finalAmount < 100 || createTipMutation.isPending}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {createTipMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Setting up...
                  </>
                ) : (
                  <>
                    Continue to Payment
                    {finalAmount >= 100 && (
                      <span className="ml-2 opacity-80">
                        (${(finalAmount / 100).toFixed(2)})
                      </span>
                    )}
                  </>
                )}
              </Button>
            </div>
          )}

          {step === 'payment' && clientSecret && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#7c3aed',
                    borderRadius: '8px',
                  },
                },
              }}
            >
              <TipPaymentForm
                amount={finalAmount}
                artistName={artistName}
                onSuccess={handleSuccess}
                onClose={onClose}
              />
            </Elements>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <p className="text-lg font-medium text-slate-900">
                  ${(finalAmount / 100).toFixed(2)} sent to {artistName}!
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Your tip has been sent directly to the artist. Thank you for your support!
                </p>
              </div>
              <Button onClick={onClose} className="w-full bg-purple-600 hover:bg-purple-700">
                Done
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
