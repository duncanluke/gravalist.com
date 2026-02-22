import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Check, ChevronDown, Globe, MapPin, Clock } from 'lucide-react';
import { cn } from './ui/utils';
import { 
  IANA_TIMEZONES, 
  detectUserTimezone, 
  formatTimezoneDisplay, 
  formatTimeWithTimezone,
  createRouteStartTime,
  getTimezoneOffset 
} from '../utils/timezone';

interface TimezoneSelectorProps {
  value: string;
  onChange: (timezone: string) => void;
  eventDate?: Date;
  className?: string;
}

export function TimezoneSelector({ value, onChange, eventDate, className }: TimezoneSelectorProps) {
  const [open, setOpen] = useState(false);
  const [userTimezone, setUserTimezone] = useState<string>('UTC');
  
  useEffect(() => {
    const detected = detectUserTimezone();
    setUserTimezone(detected);
    
    // Auto-set to user's timezone if none selected yet
    if (!value || value === 'UTC') {
      onChange(detected);
    }
  }, [value, onChange]);

  const selectedTimezone = value || userTimezone;
  
  // Calculate time previews if event date is provided
  const timePreview = eventDate ? (() => {
    const routeStartTime = createRouteStartTime(eventDate, selectedTimezone);
    const routeTimeFormatted = formatTimeWithTimezone(routeStartTime, selectedTimezone);
    
    let userTimeFormatted = '';
    if (selectedTimezone !== userTimezone) {
      userTimeFormatted = formatTimeWithTimezone(routeStartTime, userTimezone);
    }
    
    return { routeTimeFormatted, userTimeFormatted };
  })() : null;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Globe className="w-4 h-4" />
          Event Timezone
        </Label>
        
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between bg-input-background border-border"
            >
              <span className="truncate">
                {formatTimezoneDisplay(selectedTimezone)}
              </span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant="secondary" className="text-xs">
                  {getTimezoneOffset(selectedTimezone)}
                </Badge>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <Command>
              <CommandInput placeholder="Search timezones..." />
              <CommandEmpty>No timezone found.</CommandEmpty>
              <CommandList className="max-h-64">
                <CommandGroup heading="Detected">
                  <CommandItem
                    value={userTimezone}
                    onSelect={() => {
                      onChange(userTimezone);
                      setOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <MapPin className="h-4 w-4" />
                      <div className="flex flex-col">
                        <span>{formatTimezoneDisplay(userTimezone)}</span>
                        <span className="text-xs text-muted-foreground">Your detected timezone</span>
                      </div>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        selectedTimezone === userTimezone ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                </CommandGroup>
                
                <CommandGroup heading="All Timezones">
                  {IANA_TIMEZONES.filter(tz => tz !== userTimezone).map((timezone) => (
                    <CommandItem
                      key={timezone}
                      value={timezone}
                      onSelect={() => {
                        onChange(timezone);
                        setOpen(false);
                      }}
                    >
                      <div className="flex flex-col flex-1">
                        <span>{formatTimezoneDisplay(timezone)}</span>
                        <span className="text-xs text-muted-foreground">
                          {getTimezoneOffset(timezone)}
                        </span>
                      </div>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          selectedTimezone === timezone ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Time Preview */}
      {timePreview && eventDate && (
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Clock className="w-4 h-4" />
            6:00 AM Start Time Preview
          </div>
          
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Route timezone:</span>
              <span className="font-medium">{timePreview.routeTimeFormatted}</span>
            </div>
            
            {timePreview.userTimeFormatted && selectedTimezone !== userTimezone && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Your timezone:</span>
                <span className="font-medium">{timePreview.userTimeFormatted}</span>
              </div>
            )}
          </div>
          
          {selectedTimezone !== userTimezone && (
            <div className="text-xs text-muted-foreground pt-1 border-t border-border">
              Times automatically converted for accurate countdowns
            </div>
          )}
        </div>
      )}
    </div>
  );
}