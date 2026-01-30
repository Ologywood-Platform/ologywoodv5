import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Clock, CreditCard, RefreshCw, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentSectionProps {
  bookingId: number;
  totalFee?: number;
  depositAmount?: number;
  paymentStatus?: string;
  isVenue: boolean;
}

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

export default function PaymentSectionEnhanced({
  bookingId,
  totalFee,
  depositAmount,
  paymentStatus,
  isVenue,
}: PaymentSectionProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentOption, setPaymentOption] = useState<'deposit' | 'full' | 'installment'>('deposit');
  const [installmentCount, setInstallmentCount] = useState(3);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  
  const { data: paymentHistory } = trpc.payment.getHistory.useQuery({ bookingId });
  const { data: paymentMethods } = trpc.payment.getPaymentMethods.useQuery({ bookingId });
  const createDepositCheckout = trpc.payment.createDepositCheckout.useMutation();
  const createFullPaymentCheckout = trpc.payment.createFullPaymentCheckout.useMutation();
  const createInstallmentCheckout = trpc.payment.createInstallmentCheckout.useMutation();
  const requestRefund = trpc.payment.requestRefund.useMutation();
  
  const handleDepositPayment = async () => {
    setIsProcessing(true);
    try {
      const result = await createDepositCheckout.mutateAsync({ 
        bookingId,
        paymentMethodId: selectedPaymentMethod,
      });
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      toast.error('Failed to create payment session');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleFullPayment = async () => {
    setIsProcessing(true);
    try {
      const result = await createFullPaymentCheckout.mutateAsync({ 
        bookingId,
        paymentMethodId: selectedPaymentMethod,
      });
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      toast.error('Failed to create payment session');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInstallmentPayment = async () => {
    setIsProcessing(true);
    try {
      const result = await createInstallmentCheckout.mutateAsync({ 
        bookingId,
        numberOfInstallments: installmentCount,
        paymentMethodId: selectedPaymentMethod,
      });
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      toast.error('Failed to create installment plan');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleRefund = async () => {
    if (!window.confirm('Are you sure you want to request a refund?')) return;
    
    try {
      await requestRefund.mutateAsync({ bookingId });
      toast.success('Refund requested successfully');
    } catch (error) {
      toast.error('Failed to request refund');
    }
  };
  
  const getPaymentStatusBadge = () => {
    switch (paymentStatus) {
      case 'unpaid':
        return <Badge variant="outline" className="bg-gray-100"><Clock className="h-3 w-3 mr-1" /> Unpaid</Badge>;
      case 'deposit_paid':
        return <Badge variant="outline" className="bg-blue-100"><CheckCircle2 className="h-3 w-3 mr-1" /> Deposit Paid</Badge>;
      case 'full_paid':
        return <Badge className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" /> Paid</Badge>;
      case 'refunded':
        return <Badge variant="outline" className="bg-orange-100"><RefreshCw className="h-3 w-3 mr-1" /> Refunded</Badge>;
      default:
        return null;
    }
  };

  const calculateInstallmentAmount = () => {
    if (!totalFee) return 0;
    return Math.round((totalFee / installmentCount) * 100) / 100;
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Information
            </CardTitle>
            <CardDescription>Manage booking payments and refunds</CardDescription>
          </div>
          {getPaymentStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Payment Summary */}
        <div className="grid grid-cols-2 gap-4">
          {depositAmount && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Deposit Amount</div>
              <div className="text-lg font-semibold">${depositAmount.toFixed(2)}</div>
            </div>
          )}
          {totalFee && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Total Fee</div>
              <div className="text-lg font-semibold">${totalFee.toFixed(2)}</div>
            </div>
          )}
        </div>
        
        {/* Payment History */}
        {paymentHistory && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Payment History</h4>
            <div className="space-y-2 text-sm">
              {paymentHistory.depositPaidAt && (
                <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <span>Deposit Paid</span>
                  <span className="text-green-700 font-medium">
                    {new Date(paymentHistory.depositPaidAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              {paymentHistory.fullPaymentPaidAt && (
                <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <span>Full Payment Paid</span>
                  <span className="text-green-700 font-medium">
                    {new Date(paymentHistory.fullPaymentPaidAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Payment Method Selection */}
        {isVenue && paymentMethods && paymentMethods.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Payment Method</h4>
            <div className="relative">
              <button
                onClick={() => setShowPaymentMethods(!showPaymentMethods)}
                className="w-full p-3 border rounded-lg flex items-center justify-between hover:bg-gray-50"
              >
                <span className="text-sm">
                  {selectedPaymentMethod 
                    ? `${paymentMethods.find((m: any) => m.id === selectedPaymentMethod)?.brand} •••• ${paymentMethods.find((m: any) => m.id === selectedPaymentMethod)?.last4}`
                    : 'Select a payment method'}
                </span>
                <ChevronDown className="h-4 w-4" />
              </button>
              
              {showPaymentMethods && (
                <div className="absolute top-full left-0 right-0 mt-1 border rounded-lg bg-white shadow-lg z-10">
                  {paymentMethods.map((method: any) => (
                    <button
                      key={method.id}
                      onClick={() => {
                        setSelectedPaymentMethod(method.id);
                        setShowPaymentMethods(false);
                      }}
                      className="w-full p-3 text-left hover:bg-gray-50 border-b last:border-b-0 flex items-center justify-between"
                    >
                      <span className="text-sm">{method.brand} •••• {method.last4}</span>
                      {method.isDefault && <Badge variant="secondary">Default</Badge>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Payment Options */}
        {isVenue && (
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Payment Options</h4>
            
            {/* Option Tabs */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setPaymentOption('deposit')}
                className={`p-2 rounded-lg text-sm font-medium transition ${
                  paymentOption === 'deposit'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Deposit
              </button>
              <button
                onClick={() => setPaymentOption('full')}
                className={`p-2 rounded-lg text-sm font-medium transition ${
                  paymentOption === 'full'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Full Payment
              </button>
              <button
                onClick={() => setPaymentOption('installment')}
                className={`p-2 rounded-lg text-sm font-medium transition ${
                  paymentOption === 'installment'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Installments
              </button>
            </div>

            {/* Deposit Option */}
            {paymentOption === 'deposit' && depositAmount && (
              <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  Pay {Math.round((depositAmount / (totalFee || 1)) * 100)}% deposit now, remaining balance due later
                </p>
                <Button
                  onClick={handleDepositPayment}
                  disabled={isProcessing || createDepositCheckout.isPending || !selectedPaymentMethod}
                  className="w-full"
                >
                  {isProcessing ? 'Processing...' : `Pay Deposit - $${depositAmount.toFixed(2)}`}
                </Button>
              </div>
            )}

            {/* Full Payment Option */}
            {paymentOption === 'full' && totalFee && (
              <div className="space-y-3 p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  Pay the full amount now and complete the booking
                </p>
                <Button
                  onClick={handleFullPayment}
                  disabled={isProcessing || createFullPaymentCheckout.isPending || !selectedPaymentMethod}
                  className="w-full"
                >
                  {isProcessing ? 'Processing...' : `Pay Full Amount - $${totalFee.toFixed(2)}`}
                </Button>
              </div>
            )}

            {/* Installment Option */}
            {paymentOption === 'installment' && totalFee && (
              <div className="space-y-3 p-4 bg-purple-50 rounded-lg">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Number of Installments</label>
                  <select
                    value={installmentCount}
                    onChange={(e) => setInstallmentCount(parseInt(e.target.value))}
                    className="w-full p-2 border rounded-lg text-sm"
                  >
                    <option value={2}>2 payments</option>
                    <option value={3}>3 payments</option>
                    <option value={4}>4 payments</option>
                    <option value={6}>6 payments</option>
                  </select>
                </div>
                <div className="p-2 bg-white rounded text-sm">
                  <p className="text-gray-600">Each payment: <span className="font-semibold">${calculateInstallmentAmount().toFixed(2)}</span></p>
                  <p className="text-gray-600 text-xs mt-1">Monthly payments starting today</p>
                </div>
                <Button
                  onClick={handleInstallmentPayment}
                  disabled={isProcessing || createInstallmentCheckout.isPending || !selectedPaymentMethod}
                  className="w-full"
                >
                  {isProcessing ? 'Processing...' : `Set Up Installments - $${calculateInstallmentAmount().toFixed(2)}/month`}
                </Button>
              </div>
            )}
            
            {/* Refund Option */}
            {(paymentStatus === 'deposit_paid' || paymentStatus === 'full_paid') && (
              <Button
                onClick={handleRefund}
                variant="outline"
                disabled={requestRefund.isPending}
                className="w-full"
              >
                {requestRefund.isPending ? 'Processing...' : 'Request Refund'}
              </Button>
            )}
          </div>
        )}
        
        {/* Info Message */}
        <div className="flex gap-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p>Payments are processed securely through Stripe. A receipt will be emailed after successful payment.</p>
        </div>
      </CardContent>
    </Card>
  );
}
