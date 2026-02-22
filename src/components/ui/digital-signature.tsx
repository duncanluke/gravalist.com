import React, { useState, useRef, useEffect } from 'react';
import { Input } from './input';
import { Button } from './button';
import { Label } from './label';
import { Check, X } from 'lucide-react';

interface DigitalSignatureProps {
  onSignature: (signature: string) => void;
  onClear: () => void;
  currentSignature?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

export function DigitalSignature({
  onSignature,
  onClear,
  currentSignature = '',
  placeholder = 'Type your full legal name',
  required = true,
  disabled = false
}: DigitalSignatureProps) {
  const [signature, setSignature] = useState(currentSignature);
  const [isValid, setIsValid] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSignature(currentSignature);
    setIsValid(currentSignature.trim().length >= 2);
  }, [currentSignature]);

  const handleSignatureChange = (value: string) => {
    setSignature(value);
    const valid = value.trim().length >= 2;
    setIsValid(valid);
    
    if (valid) {
      onSignature(value.trim());
    }
  };

  const handleClear = () => {
    setSignature('');
    setIsValid(false);
    onClear();
    inputRef.current?.focus();
  };

  const handleConfirm = () => {
    if (isValid) {
      onSignature(signature.trim());
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label className="text-xs font-medium">
          Digital Signature {required && <span className="text-destructive">*</span>}
        </Label>
        
        <div className="relative">
          <Input
            ref={inputRef}
            type="text"
            value={signature}
            onChange={(e) => handleSignatureChange(e.target.value)}
            placeholder={placeholder}
            className={`pr-10 text-center font-medium ${
              signature && isValid 
                ? 'border-success bg-success/5 text-success' 
                : signature && !isValid
                ? 'border-destructive bg-destructive/5'
                : 'bg-input-background'
            }`}
            disabled={disabled}
          />
          
          {signature && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              {isValid ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <X className="h-4 w-4 text-destructive" />
              )}
            </div>
          )}
        </div>
        
        {signature && !isValid && (
          <p className="text-xs text-destructive">
            Please enter your full legal name (minimum 2 characters)
          </p>
        )}
        
        {signature && isValid && (
          <p className="text-xs text-success">
            ✓ Signature accepted: "{signature}"
          </p>
        )}
      </div>
      
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClear}
          disabled={!signature || disabled}
          className="text-xs"
        >
          Clear
        </Button>
        
        <Button
          type="button"
          size="sm"
          onClick={handleConfirm}
          disabled={!isValid || disabled}
          className="text-xs flex-1"
        >
          Confirm Signature
        </Button>
      </div>
      
      <div className="text-xs text-muted-foreground bg-muted/20 p-2 rounded border">
        <p>By typing your name above, you are providing a legally binding digital signature equivalent to a handwritten signature.</p>
      </div>
    </div>
  );
}