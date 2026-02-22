import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { X, Search, Copy, Users } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface Rider {
  id: string;
  name: string;
  initial: string;
  flag: string;
  isVisible: boolean;
}

interface RidersListModalProps {
  open: boolean;
  onClose: () => void;
}

export function RidersListModal({ open, onClose }: RidersListModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnList, setShowOnList] = useState(true);

  const riders: Rider[] = [
    { id: '1', name: 'Sarah', initial: 'M', flag: '🇬🇧', isVisible: true },
    { id: '2', name: 'Tom', initial: 'J', flag: '🇺🇸', isVisible: true },
    { id: '3', name: 'Alex', initial: 'R', flag: '🇨🇦', isVisible: true },
    { id: '4', name: 'Maria', initial: 'S', flag: '🇪🇸', isVisible: true },
    { id: '5', name: 'James', initial: 'W', flag: '🇬🇧', isVisible: true },
    { id: '6', name: 'Lisa', initial: 'P', flag: '🇫🇷', isVisible: true },
    { id: '7', name: 'Mike', initial: 'B', flag: '🇩🇪', isVisible: true },
    { id: '8', name: 'Anna', initial: 'K', flag: '🇳🇱', isVisible: true },
  ];

  const filteredRiders = riders.filter(rider => 
    rider.name.toLowerCase().includes(searchTerm.toLowerCase()) && rider.isVisible
  );

  const copyTrackingLink = () => {
    navigator.clipboard.writeText('https://racemap.com/event/peak-district-300');
    toast.success('Live tracking link copied to clipboard');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto bg-card border-border h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Participants ({filteredRiders.length})
          </DialogTitle>
          <DialogDescription>
            View other participants, manage your visibility, and copy the live tracking link.
          </DialogDescription>
          <DialogClose asChild>
            <Button variant="ghost" size="sm" className="absolute right-4 top-4 p-1">
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </DialogHeader>

        <div className="space-y-4 flex-1 flex flex-col">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search riders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-input-background border-border"
            />
          </div>

          {/* Visibility Toggle */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="space-y-1">
              <p className="text-sm font-medium">Show me on participants list</p>
              <p className="text-xs text-muted-foreground">Others can see you're participating</p>
            </div>
            <Switch 
              checked={showOnList}
              onCheckedChange={setShowOnList}
            />
          </div>

          {/* Riders List */}
          <div className="flex-1 space-y-2 overflow-y-auto">
            {filteredRiders.map((rider) => (
              <div 
                key={rider.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-all duration-150"
              >
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-sm font-medium">{rider.initial}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{rider.name}</span>
                    <span className="text-lg">{rider.flag}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Copy Tracking Link */}
          <div className="space-y-3 pt-4 border-t border-border">
            <Button 
              onClick={copyTrackingLink}
              variant="outline" 
              className="w-full justify-between border-border hover:bg-muted"
            >
              Copy Live Tracking Link
              <Copy className="h-4 w-4" />
            </Button>
            
            <Button 
              onClick={onClose} 
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}