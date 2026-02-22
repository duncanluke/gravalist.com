import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Separator } from './ui/separator';
import { TimezoneSelector } from './TimezoneSelector';
import { toast } from 'sonner@2.0.3';
import { useEvents } from '../hooks/useEvents';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../utils/supabase/client';
import { 
  Upload, 
  MapPin, 
  Calendar as CalendarIcon, 
  Clock, 
  Route, 
  Users, 
  Tag, 
  Settings,
  Plus,
  X,
  Save,
  ArrowLeft,
  FileText,
  Target
} from 'lucide-react';

interface RouteFormData {
  // Basic event info
  name: string;
  slug: string;
  location: string;
  timezone: string;
  eventDate: Date | undefined;
  eventTime: string;
  
  // Event details
  distanceKm: number;
  description: string;
  routeDescription: string;
  
  // Event tags and categorization
  eventTags: string[];
  difficultyLevel: string;
  
  // Registration timing
  registrationOpensAt: Date | undefined;
  registrationClosesAt: Date | undefined;
  
  // Route data
  routeFile: File | null;
  routeFileName: string;
  
  // Publishing
  isPublished: boolean;
  
  // Event highlights
  highlights: Array<{
    title: string;
    description: string;
    order: number;
  }>;
}

interface AddRoutePageProps {
  onNavigateBack: () => void;
  isAuthenticated: boolean;
  authLoading: boolean;
}



const DIFFICULTY_LEVELS = [
  'Beginner', 'Intermediate', 'Advanced', 'Expert'
];

const DEFAULT_TAGS = [
  'Unsupported', 'Ultracycling', 'Gravel', 'Road', 'Mixed Terrain', 
  'Multi-day', 'Single Day', 'Timed', 'Self-supported'
];

export function AddRoutePage({ onNavigateBack, isAuthenticated, authLoading }: AddRoutePageProps) {
  const { refreshEvents } = useEvents();
  const { refreshProfile } = useAuth();
  const [formData, setFormData] = useState<RouteFormData>({
    name: '',
    slug: '',
    location: '',
    timezone: 'UTC',
    eventDate: undefined,
    eventTime: '06:00',
    distanceKm: 500,
    description: '',
    routeDescription: '',
    eventTags: ['Unsupported', 'Ultracycling'],
    difficultyLevel: 'Advanced',
    registrationOpensAt: undefined,
    registrationClosesAt: undefined,
    routeFile: null,
    routeFileName: '',
    isPublished: true,
    highlights: [
      { title: '', description: '', order: 1 },
      { title: '', description: '', order: 2 },
      { title: '', description: '', order: 3 }
    ]
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTag, setNewTag] = useState('');

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast.error('Please sign in to add a route');
      // Dispatch custom event to trigger auth modal
      window.dispatchEvent(new CustomEvent('requestAuth', { 
        detail: { mode: 'signin' } 
      }));
      onNavigateBack();
    }
  }, [authLoading, isAuthenticated, onNavigateBack]);

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/gpx+xml' || file.name.endsWith('.gpx')) {
        setFormData(prev => ({
          ...prev,
          routeFile: file,
          routeFileName: file.name
        }));
        toast.success('GPX file uploaded successfully');
      } else {
        toast.error('Please upload a valid GPX file');
      }
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.eventTags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        eventTags: [...prev.eventTags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      eventTags: prev.eventTags.filter(tag => tag !== tagToRemove)
    }));
  };

  const updateHighlight = (index: number, field: 'title' | 'description', value: string) => {
    setFormData(prev => ({
      ...prev,
      highlights: prev.highlights.map((highlight, i) => 
        i === index ? { ...highlight, [field]: value } : highlight
      )
    }));
  };

  const addHighlight = () => {
    setFormData(prev => ({
      ...prev,
      highlights: [...prev.highlights, {
        title: '',
        description: '',
        order: prev.highlights.length + 1
      }]
    }));
  };

  const removeHighlight = (index: number) => {
    if (formData.highlights.length > 1) {
      setFormData(prev => ({
        ...prev,
        highlights: prev.highlights.filter((_, i) => i !== index)
          .map((highlight, i) => ({ ...highlight, order: i + 1 }))
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Please sign in to add a route');
      return;
    }
    
    if (!formData.name.trim()) {
      toast.error('Please enter an event name');
      return;
    }
    
    if (!formData.location.trim()) {
      toast.error('Please enter a location');
      return;
    }
    
    if (!formData.eventDate) {
      toast.error('Please select an event date');
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('Submitting route data:', formData);
      
      let gpxFilePath = '';
      let gpxFileName = '';
      let gpxFileSize = 0;

      // Handle GPX file upload if file is provided
      if (formData.routeFile) {
        try {
          toast.info('Uploading GPX file...');
          const uploadResult = await apiClient.uploadGpxFile(formData.routeFile, formData.slug);
          
          gpxFilePath = uploadResult.filePath;
          gpxFileName = uploadResult.fileName;
          gpxFileSize = uploadResult.fileSize;
          
          toast.success('GPX file uploaded successfully');
        } catch (uploadError) {
          console.error('Error uploading GPX file:', uploadError);
          toast.error('Failed to upload GPX file. Creating route without file.');
          // Continue with route creation even if file upload fails
        }
      }

      // Prepare the event data for submission
      const eventData = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim() || undefined,
        location: formData.location.trim(),
        timezone: formData.timezone,
        eventDate: formData.eventDate.toISOString(),
        startTime: formData.eventTime || undefined,
        distanceKm: formData.distanceKm || undefined,
        registrationOpensAt: formData.registrationOpensAt?.toISOString() || undefined,
        registrationClosesAt: formData.registrationClosesAt?.toISOString() || undefined,
        difficultyLevel: formData.difficultyLevel,
        eventTags: formData.eventTags || [],
        routeDescription: formData.routeDescription.trim() || undefined,
        gpxFilePath: gpxFilePath || undefined,
        gpxFileName: gpxFileName || undefined,
        gpxFileSize: gpxFileSize || undefined,
        isPublished: formData.isPublished,
        highlights: formData.highlights.filter(h => h.title.trim()).map(h => ({
          title: h.title.trim(),
          description: h.description.trim() || undefined,
          order: h.order
        }))
      };

      // Submit to backend
      console.log('Sending event data to API:', eventData);
      const result = await apiClient.createEvent(eventData);
      
      console.log('Event created successfully:', result);
      toast.success(`Route "${formData.name}" created successfully! You earned ${result.pointsAwarded} points.`);
      
      // Refresh events list to show the new event
      try {
        await refreshEvents();
      } catch (refreshError) {
        console.warn('Failed to refresh events after creation:', refreshError);
      }
      
      // Refresh user profile to update points display
      try {
        if (refreshProfile) {
          await refreshProfile();
          console.log('User profile refreshed after points awarded');
        }
      } catch (refreshError) {
        console.warn('Failed to refresh profile after points awarded:', refreshError);
      }
      
      // Navigate back to previous page
      onNavigateBack();
    } catch (error) {
      console.error('Error creating route:', error);
      
      let errorMessage = 'Failed to create route. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
        // If it's a detailed server error, show just the main message
        if (errorMessage.includes('Failed to create event:')) {
          errorMessage = error.message;
        }
      }
      
      toast.error(`Error creating route: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading if still checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render the form if user is not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={onNavigateBack}
            className="text-secondary hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-medium text-primary">Add New Route</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <FileText className="w-5 h-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Ride Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g., Utrecht 500"
                    className="bg-input-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL Slug</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="e.g., utrecht-500"
                    className="bg-input-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Location *</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g., Utrecht, Netherlands"
                    className="bg-input-background"
                  />
                </div>
                <TimezoneSelector
                  value={formData.timezone}
                  onChange={(timezone) => setFormData(prev => ({ ...prev, timezone }))}
                  eventDate={formData.eventDate}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Ride Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left bg-input-background border-border"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.eventDate ? formData.eventDate.toLocaleDateString() : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.eventDate}
                        onSelect={(date) => setFormData(prev => ({ ...prev, eventDate: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={formData.eventTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, eventTime: e.target.value }))}
                    className="bg-input-background"
                    placeholder="06:00"
                  />
                  <p className="text-xs text-muted-foreground">
                    24-hour format (e.g., 06:00 for 6 AM)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Event Details */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Route className="w-5 h-5" />
                Ride Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Distance (km)</Label>
                  <Input
                    type="number"
                    value={formData.distanceKm}
                    onChange={(e) => setFormData(prev => ({ ...prev, distanceKm: parseInt(e.target.value) || 0 }))}
                    className="bg-input-background"
                  />
                </div>

              </div>

              <div className="space-y-2">
                <Label>Ride Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your ride..."
                  className="bg-input-background min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Route Description</Label>
                <Textarea
                  value={formData.routeDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, routeDescription: e.target.value }))}
                  placeholder="Describe the route terrain, highlights, and challenges..."
                  className="bg-input-background min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Tag className="w-5 h-5" />
                Ride Tags
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {formData.eventTags.map(tag => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 w-4 h-4 hover:bg-transparent"
                      onClick={() => removeTag(tag)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add custom tag..."
                  className="bg-input-background"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" onClick={addTag} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label>Quick Add Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_TAGS.filter(tag => !formData.eventTags.includes(tag)).map(tag => (
                    <Button
                      key={tag}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, eventTags: [...prev.eventTags, tag] }))}
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>



          {/* Route File Upload */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Upload className="w-5 h-5" />
                Route File
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>GPX File</Label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept=".gpx,application/gpx+xml"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="gpx-upload"
                  />
                  <Label htmlFor="gpx-upload" className="cursor-pointer">
                    <Button type="button" variant="outline" asChild>
                      <span className="flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Choose GPX File
                      </span>
                    </Button>
                  </Label>
                  {formData.routeFileName && (
                    <span className="text-sm text-muted-foreground">
                      {formData.routeFileName}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>



          {/* Event Highlights */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Target className="w-5 h-5" />
                Route Highlights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.highlights.map((highlight, index) => (
                <div key={index} className="space-y-3 p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label>Highlight {index + 1}</Label>
                    {formData.highlights.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeHighlight(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <Input
                    value={highlight.title}
                    onChange={(e) => updateHighlight(index, 'title', e.target.value)}
                    placeholder="Highlight title..."
                    className="bg-input-background"
                  />
                  <Textarea
                    value={highlight.description}
                    onChange={(e) => updateHighlight(index, 'description', e.target.value)}
                    placeholder="Highlight description..."
                    className="bg-input-background"
                  />
                </div>
              ))}
              

            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onNavigateBack}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Creating Route...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Route
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}