import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { FileText, Upload, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { useAuth } from '../../hooks/useAuth';

interface OnboardingFormStepProps {
  step: 'emergency' | 'medical' | 'experience' | 'equipment';
  onContinue: () => void;
}

export function OnboardingFormStep({ step, onContinue }: OnboardingFormStepProps) {
  const { session } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    experienceLevel: '',
    estimatedFinishTime: '',
    hasGPS: false,
    hasFirstAid: false,
    hasInsurance: false
  });

  const [documentUpload, setDocumentUpload] = useState({
    file: null as File | null,
    uploading: false,
    uploaded: false,
    error: '',
    fileName: '',
    fileSize: 0
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing documents when component mounts
  useEffect(() => {
    const loadExistingDocuments = async () => {
      if (step !== 'medical' || !session?.access_token) return;

      try {
        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-91bdaa9f/documents/list`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          const result = await response.json();
          const insuranceDoc = result.documents?.find((doc: any) => doc.type === 'insurance');
          
          if (insuranceDoc) {
            setDocumentUpload(prev => ({
              ...prev,
              uploaded: true,
              fileName: insuranceDoc.fileName,
              fileSize: insuranceDoc.fileSize,
              error: ''
            }));
            setFormData(prev => ({ ...prev, hasInsurance: true }));
          }
        }
      } catch (error) {
        console.log('Error loading existing documents:', error);
        // Silently fail - not critical for the flow
      }
    };

    loadExistingDocuments();
  }, [step, session?.access_token]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onContinue();
  };

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 10MB' };
    }
    
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'File must be PDF, JPEG, PNG, or WebP format' };
    }
    
    return { valid: true };
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      setDocumentUpload(prev => ({
        ...prev,
        error: validation.error || 'Invalid file',
        file: null
      }));
      toast.error(validation.error);
      return;
    }

    setDocumentUpload(prev => ({
      ...prev,
      file,
      fileName: file.name,
      fileSize: file.size,
      error: '',
      uploaded: false
    }));
  };

  const uploadDocument = async () => {
    if (!documentUpload.file) return;

    setDocumentUpload(prev => ({ ...prev, uploading: true, error: '' }));

    try {
      // Get auth token from session
      const token = session?.access_token;
      
      if (!token) {
        throw new Error('Authentication required. Please sign in to upload documents.');
      }

      const formData = new FormData();
      formData.append('file', documentUpload.file);
      formData.append('documentType', 'insurance'); // For now, treating as insurance document
      formData.append('metadata', JSON.stringify({
        originalName: documentUpload.file.name,
        uploadContext: 'onboarding'
      }));

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-91bdaa9f/documents/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Upload failed: ${response.status}`);
      }

      const result = await response.json();
      
      setDocumentUpload(prev => ({
        ...prev,
        uploading: false,
        uploaded: true,
        error: ''
      }));

      setFormData(prev => ({ ...prev, hasInsurance: true }));
      toast.success('Document uploaded successfully');

    } catch (error) {
      console.error('Document upload error:', error);
      setDocumentUpload(prev => ({
        ...prev,
        uploading: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }));
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    }
  };

  const removeFile = () => {
    setDocumentUpload({
      file: null,
      uploading: false,
      uploaded: false,
      error: '',
      fileName: '',
      fileSize: 0
    });
    
    setFormData(prev => ({ ...prev, hasInsurance: false }));
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragEnter = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      
      const validation = validateFile(file);
      if (!validation.valid) {
        setDocumentUpload(prev => ({
          ...prev,
          error: validation.error || 'Invalid file',
          file: null
        }));
        toast.error(validation.error);
        return;
      }

      setDocumentUpload(prev => ({
        ...prev,
        file,
        fileName: file.name,
        fileSize: file.size,
        error: '',
        uploaded: false
      }));
    }
  };

  const getStepConfig = () => {
    switch (step) {
      case 'emergency':
        return {
          title: 'Your Details',
          description: 'Enter your name and email address',
          isValid: formData.name && formData.email
        };
      case 'medical':
        return {
          title: 'Medical Insurance',
          description: 'Upload proof of medical insurance coverage',
          isValid: documentUpload.uploaded && formData.hasInsurance // Document uploaded and insurance confirmed
        };
      case 'experience':
        return {
          title: 'Experience Level',
          description: 'Tell us about your ultra cycling background',
          isValid: formData.experienceLevel
        };
      case 'equipment':
        return {
          title: 'Equipment Confirmation',
          description: 'Confirm you have essential safety equipment',
          isValid: formData.hasGPS // At minimum GPS is required
        };
    }
  };

  const stepConfig = getStepConfig();

  const renderStepContent = () => {
    switch (step) {
      case 'emergency':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Enter your basic details to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Your full name"
                  className="bg-input-background"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your@email.com"
                  className="bg-input-background"
                />
              </div>
            </CardContent>
          </Card>
        );

      case 'medical':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Medical Insurance</CardTitle>
              <CardDescription>
                Upload proof of medical insurance coverage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {/* File Upload Area */}
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 text-center space-y-3 transition-colors ${
                    documentUpload.uploaded 
                      ? 'border-primary bg-primary/5' 
                      : documentUpload.error 
                      ? 'border-destructive bg-destructive/5'
                      : 'border-muted bg-muted/10 hover:border-primary/50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    className="hidden"
                  />
                  
                  {documentUpload.uploaded ? (
                    // File uploaded successfully
                    <div className="space-y-3">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto">
                        <CheckCircle className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-primary">Document Uploaded Successfully</p>
                        <p className="text-xs text-muted-foreground">
                          {documentUpload.fileName} ({formatFileSize(documentUpload.fileSize)})
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs"
                        onClick={removeFile}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Remove File
                      </Button>
                    </div>
                  ) : documentUpload.file ? (
                    // File selected, ready to upload
                    <div className="space-y-3">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Ready to Upload</p>
                        <p className="text-xs text-muted-foreground">
                          {documentUpload.fileName} ({formatFileSize(documentUpload.fileSize)})
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="text-xs bg-primary hover:bg-primary/90"
                          onClick={uploadDocument}
                          disabled={documentUpload.uploading}
                        >
                          {documentUpload.uploading ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-3 w-3 mr-1" />
                              Upload Document
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs"
                          onClick={removeFile}
                          disabled={documentUpload.uploading}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // No file selected
                    <div className="space-y-3">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Upload Insurance Document</p>
                        <p className="text-xs text-muted-foreground">
                          Drag and drop or click to select file
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Choose File
                      </Button>
                    </div>
                  )}
                  
                  {documentUpload.error && (
                    <div className="flex items-center justify-center gap-2 text-destructive text-xs">
                      <AlertCircle className="h-3 w-3" />
                      {documentUpload.error}
                    </div>
                  )}
                </div>
                
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Accepted formats: PDF, JPG, PNG (max 10MB)</p>
                  <p>Document should clearly show your name and coverage details</p>
                </div>

                <div className="flex items-start space-x-3 p-3 border border-border rounded-lg bg-muted/30">
                  <Checkbox
                    id="insuranceConfirm"
                    checked={formData.hasInsurance}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasInsurance: !!checked }))}
                    className="mt-0.5 h-5 w-5"
                  />
                  <Label htmlFor="insuranceConfirm" className="text-sm leading-relaxed cursor-pointer">
                    I confirm my medical insurance covers international travel and sporting activities
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'experience':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Cycling Experience</CardTitle>
              <CardDescription>
                Help us understand your background for safety planning
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="experienceLevel">Experience Level *</Label>
                <Select 
                  value={formData.experienceLevel} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, experienceLevel: value }))}
                >
                  <SelectTrigger className="bg-input-background">
                    <SelectValue placeholder="Select your experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner - First ultra event</SelectItem>
                    <SelectItem value="intermediate">Intermediate - 2-5 ultra events</SelectItem>
                    <SelectItem value="experienced">Experienced - 6+ ultra events</SelectItem>
                    <SelectItem value="elite">Elite - 20+ ultra events</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedFinishTime">Estimated Finish Time</Label>
                <Input
                  id="estimatedFinishTime"
                  value={formData.estimatedFinishTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimatedFinishTime: e.target.value }))}
                  placeholder="e.g., 8 hours, 12 hours, 20 hours"
                  className="bg-input-background"
                />
              </div>
            </CardContent>
          </Card>
        );

      case 'equipment':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Equipment Confirmation</CardTitle>
              <CardDescription>
                Confirm you have essential safety equipment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasGPS"
                  checked={formData.hasGPS}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasGPS: !!checked }))}
                />
                <Label htmlFor="hasGPS">I have a GPS device or smartphone with GPS *</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasFirstAid"
                  checked={formData.hasFirstAid}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasFirstAid: !!checked }))}
                />
                <Label htmlFor="hasFirstAid">I carry basic first aid supplies</Label>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center space-y-2">

      </div>

      {renderStepContent()}


    </div>
  );
}