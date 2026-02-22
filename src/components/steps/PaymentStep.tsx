import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { CreditCard, Smartphone, Check } from 'lucide-react';

interface PaymentStepProps {
  eventName: string;
  price: string;
  onPaymentComplete: () => void;
}

export function PaymentStep({ eventName, price, onPaymentComplete }: PaymentStepProps) {
  const [paymentMethod, setPaymentMethod] = useState<'apple' | 'google' | 'card' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handlePayment = async () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setIsComplete(true);
      setTimeout(() => {
        onPaymentComplete();
      }, 2000);
    }, 2000);
  };

  if (isComplete) {
    return (
      <div className="text-center space-y-6">
        <div className="w-16 h-16 bg-[#33D17A] rounded-full flex items-center justify-center mx-auto">
          <Check className="h-8 w-8 text-black" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-bold">Payment Successful!</h2>
          <p className="text-sm text-muted-foreground">
            Your entry to {eventName} has been confirmed.
          </p>
        </div>

        <Card className="p-4 bg-muted/50">
          <div className="text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span>Event:</span>
              <span className="font-medium">{eventName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Amount:</span>
              <span className="font-medium">{price}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Receipt ID:</span>
              <span className="font-medium text-primary">#GRV-2024-001</span>
            </div>
          </div>
        </Card>

        <p className="text-xs text-muted-foreground">
          A receipt has been sent to your email. Redirecting to ride details...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold">Pay & Unlock</h2>
        <p className="text-sm text-muted-foreground">
          Complete payment to access ride details and continue registration
        </p>
      </div>

      <Card className="p-4 bg-muted/50">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="font-medium">{eventName}</span>
            <span className="font-bold text-primary">{price}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Entry fee includes route files, tracking support, and community access
          </p>
        </div>
      </Card>

      <div className="space-y-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">Choose Payment Method</label>
          
          <div className="space-y-2">
            <Card 
              className={`p-3 cursor-pointer transition-all duration-150 ${
                paymentMethod === 'apple' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => setPaymentMethod('apple')}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-black rounded flex items-center justify-center">
                  <Smartphone className="h-4 w-4 text-white" />
                </div>
                <span className="font-medium">Apple Pay</span>
                {paymentMethod === 'apple' && (
                  <Badge variant="outline" className="ml-auto border-primary text-primary">
                    Selected
                  </Badge>
                )}
              </div>
            </Card>

            <Card 
              className={`p-3 cursor-pointer transition-all duration-150 ${
                paymentMethod === 'google' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => setPaymentMethod('google')}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-white" />
                </div>
                <span className="font-medium">Google Pay</span>
                {paymentMethod === 'google' && (
                  <Badge variant="outline" className="ml-auto border-primary text-primary">
                    Selected
                  </Badge>
                )}
              </div>
            </Card>

            <Card 
              className={`p-3 cursor-pointer transition-all duration-150 ${
                paymentMethod === 'card' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => setPaymentMethod('card')}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                  <CreditCard className="h-4 w-4" />
                </div>
                <span className="font-medium">Credit/Debit Card</span>
                {paymentMethod === 'card' && (
                  <Badge variant="outline" className="ml-auto border-primary text-primary">
                    Selected
                  </Badge>
                )}
              </div>
            </Card>
          </div>
        </div>

        <Button 
          onClick={handlePayment}
          disabled={!paymentMethod || isProcessing}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isProcessing ? 'Processing Payment...' : `Pay ${price}`}
        </Button>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Secure payment processing. Your card details are never stored.
      </p>
    </div>
  );
}