import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '../ui/dialog';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { X, Download, ExternalLink, HelpCircle } from 'lucide-react';

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
}

export function HelpModal({ open, onClose }: HelpModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Help & Resources
          </DialogTitle>
          <DialogDescription>
            Access rider's manual, route files, live tracking, and frequently asked questions.
          </DialogDescription>
          <DialogClose asChild>
            <Button variant="ghost" size="sm" className="absolute right-4 top-4 p-1">
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="p-4 space-y-3">
            <h3 className="font-semibold text-sm">Rider's Manual</h3>
            <p className="text-xs text-muted-foreground">
              Complete guide including rules, safety information, and what to expect
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-between"
              onClick={() => window.open('/manual', '_blank')}
            >
              View Manual
              <ExternalLink className="h-3 w-3" />
            </Button>
          </Card>

          <Card className="p-4 space-y-3">
            <h3 className="font-semibold text-sm">Route Files</h3>
            <p className="text-xs text-muted-foreground">
              Download GPX and TCX files for your GPS device
            </p>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-between"
              >
                Download GPX
                <Download className="h-3 w-3" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-between"
              >
                Download TCX
                <Download className="h-3 w-3" />
              </Button>
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <h3 className="font-semibold text-sm">Live Tracking</h3>
            <p className="text-xs text-muted-foreground">
              Follow riders during the event on Racemap
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-between"
              onClick={() => window.open('https://racemap.com', '_blank')}
            >
              Open Racemap
              <ExternalLink className="h-3 w-3" />
            </Button>
          </Card>

          <Card className="p-4 space-y-3">
            <h3 className="font-semibold text-sm">FAQ</h3>
            <div className="space-y-2 text-xs">
              <div>
                <p className="font-medium">What is a self-organised event?</p>
                <p className="text-muted-foreground">No organisers, no support crew, no aid stations. You are responsible for everything.</p>
              </div>
              <div>
                <p className="font-medium">What happens if I need help?</p>
                <p className="text-muted-foreground">Call emergency services if needed. Fellow riders may help, but it's not guaranteed.</p>
              </div>
              <div>
                <p className="font-medium">Can I change my mind?</p>
                <p className="text-muted-foreground">You can withdraw anytime, but entry fees are non-refundable.</p>
              </div>
            </div>
          </Card>

          <div className="text-center">
            <Button onClick={onClose} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}