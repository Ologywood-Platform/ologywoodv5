import React, { useRef, useEffect, useState, useCallback } from 'react';
import SignaturePadLib from 'signature_pad';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pen, Type, RotateCcw } from 'lucide-react';

interface SignaturePadProps {
  onSignatureChange: (data: string | null, type: 'drawn' | 'typed') => void;
  disabled?: boolean;
}

export function SignaturePad({ onSignatureChange, disabled = false }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePadLib | null>(null);
  const [mode, setMode] = useState<'draw' | 'type'>('draw');
  const [typedName, setTypedName] = useState('');
  const [isEmpty, setIsEmpty] = useState(true);

  // Initialize signature pad
  useEffect(() => {
    if (mode === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext('2d')?.scale(ratio, ratio);

      const pad = new SignaturePadLib(canvas, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(30, 30, 60)',
        minWidth: 1.5,
        maxWidth: 3,
      });

      pad.addEventListener('endStroke', () => {
        setIsEmpty(pad.isEmpty());
        if (!pad.isEmpty()) {
          onSignatureChange(pad.toDataURL('image/png'), 'drawn');
        }
      });

      signaturePadRef.current = pad;

      if (disabled) {
        pad.off();
      }

      return () => {
        pad.off();
      };
    }
  }, [mode, disabled]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (mode === 'draw' && canvasRef.current && signaturePadRef.current) {
        const canvas = canvasRef.current;
        const data = signaturePadRef.current.toData();
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext('2d')?.scale(ratio, ratio);
        signaturePadRef.current.clear();
        if (data.length > 0) {
          signaturePadRef.current.fromData(data);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mode]);

  const handleClear = useCallback(() => {
    if (mode === 'draw' && signaturePadRef.current) {
      signaturePadRef.current.clear();
      setIsEmpty(true);
      onSignatureChange(null, 'drawn');
    } else {
      setTypedName('');
      onSignatureChange(null, 'typed');
    }
  }, [mode, onSignatureChange]);

  const handleModeSwitch = useCallback((newMode: 'draw' | 'type') => {
    setMode(newMode);
    setIsEmpty(true);
    setTypedName('');
    onSignatureChange(null, newMode === 'draw' ? 'drawn' : 'typed');
  }, [onSignatureChange]);

  const handleTypedNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setTypedName(name);
    setIsEmpty(!name.trim());
    if (name.trim()) {
      // Generate a signature image from typed text
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 150;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 600, 150);
        ctx.fillStyle = '#1e1e3c';
        ctx.font = 'italic 48px "Georgia", "Times New Roman", serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(name, 300, 75);
        onSignatureChange(canvas.toDataURL('image/png'), 'typed');
      }
    } else {
      onSignatureChange(null, 'typed');
    }
  }, [onSignatureChange]);

  return (
    <div className="space-y-3">
      {/* Mode Toggle */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === 'draw' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleModeSwitch('draw')}
          disabled={disabled}
          className="flex-1"
        >
          <Pen className="h-4 w-4 mr-2" />
          Draw Signature
        </Button>
        <Button
          type="button"
          variant={mode === 'type' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleModeSwitch('type')}
          disabled={disabled}
          className="flex-1"
        >
          <Type className="h-4 w-4 mr-2" />
          Type Name
        </Button>
      </div>

      {/* Signature Area */}
      {mode === 'draw' ? (
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg bg-white cursor-crosshair"
            style={{ height: '150px', touchAction: 'none' }}
          />
          {isEmpty && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-gray-400 text-sm">Sign here with your mouse or finger</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <Input
            value={typedName}
            onChange={handleTypedNameChange}
            placeholder="Type your full legal name"
            disabled={disabled}
            className="text-lg"
          />
          {typedName.trim() && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white p-6 text-center">
              <p
                className="text-3xl text-[#1e1e3c]"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic' }}
              >
                {typedName}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Clear Button */}
      <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          disabled={disabled || isEmpty}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Clear
        </Button>
      </div>
    </div>
  );
}
