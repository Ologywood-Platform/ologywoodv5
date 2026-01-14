import { useEffect, useRef, useState } from 'react';
import SignaturePad from 'signature_pad';
import { Card } from './ui/card';
import { Button } from './ui/button';

interface SignatureCaptureProps {
  signerName: string;
  signerRole: 'artist' | 'venue';
  onSignatureCapture: (signatureData: string, signatureType: 'canvas' | 'typed') => void;
  onCancel?: () => void;
}

export function SignatureCapture({
  signerName,
  signerRole,
  onSignatureCapture,
  onCancel,
}: SignatureCaptureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);
  const [signatureType, setSignatureType] = useState<'canvas' | 'typed'>('canvas');
  const [typedSignature, setTypedSignature] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (signatureType === 'canvas' && canvasRef.current) {
      // Set canvas size to match display size
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;

      // Scale the drawing context to match device pixel ratio
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }

      // Initialize SignaturePad
      signaturePadRef.current = new SignaturePad(canvas, {
        penColor: 'rgb(0, 0, 0)',
        backgroundColor: 'rgb(255, 255, 255)',
      });
    }
  }, [signatureType]);

  const handleClearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
    setError('');
  };

  const handleSubmitSignature = () => {
    setError('');

    if (signatureType === 'canvas') {
      if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) {
        setError('Please draw your signature');
        return;
      }

      const signatureData = signaturePadRef.current.toDataURL('image/png');
      onSignatureCapture(signatureData, 'canvas');
    } else {
      if (!typedSignature.trim()) {
        setError('Please enter your signature');
        return;
      }

      // Create a canvas with typed signature
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = 'italic 48px "Brush Script MT", cursive';
        ctx.fillStyle = 'black';
        ctx.textBaseline = 'middle';
        ctx.fillText(typedSignature, 20, canvas.height / 2);
      }

      const signatureData = canvas.toDataURL('image/png');
      onSignatureCapture(signatureData, 'typed');
    }
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Sign Contract</h3>
        <p className="text-sm text-gray-600">
          <strong>{signerName}</strong> ({signerRole === 'artist' ? 'Artist' : 'Venue'})
        </p>
      </div>

      <div className="mb-6">
        <div className="flex gap-4 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="signatureType"
              value="canvas"
              checked={signatureType === 'canvas'}
              onChange={() => setSignatureType('canvas')}
              className="w-4 h-4"
            />
            <span className="text-sm">Draw Signature</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="signatureType"
              value="typed"
              checked={signatureType === 'typed'}
              onChange={() => setSignatureType('typed')}
              className="w-4 h-4"
            />
            <span className="text-sm">Type Signature</span>
          </label>
        </div>
      </div>

      {signatureType === 'canvas' ? (
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Draw your signature below</label>
          <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
            <canvas
              ref={canvasRef}
              className="w-full h-48 cursor-crosshair"
              style={{ touchAction: 'none' }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Use your mouse or touch screen to draw your signature
          </p>
          <Button
            onClick={handleClearSignature}
            variant="outline"
            className="mt-3 w-full"
          >
            Clear Signature
          </Button>
        </div>
      ) : (
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Type your signature</label>
          <input
            type="text"
            value={typedSignature}
            onChange={(e) => setTypedSignature(e.currentTarget.value)}
            placeholder="Enter your full name"
            className="w-full px-4 py-2 border rounded-lg font-italic text-xl"
            style={{ fontFamily: '"Brush Script MT", cursive' }}
          />
          <p className="text-xs text-gray-500 mt-2">
            Your signature will be displayed in a stylized font
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          onClick={handleSubmitSignature}
          className="flex-1 bg-primary text-white"
        >
          Sign Contract
        </Button>
        {onCancel && (
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-xs text-blue-900">
          <strong>Legal Notice:</strong> By signing this contract digitally, you acknowledge that
          you have read and agree to all terms and conditions. This digital signature is legally
          binding and equivalent to a handwritten signature.
        </p>
      </div>
    </Card>
  );
}
