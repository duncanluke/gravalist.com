import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ArrowLeft, FileText } from 'lucide-react';

interface TermsPageProps {
  onNavigateBack: () => void;
}

export function TermsPage({ onNavigateBack }: TermsPageProps) {
  return (
    <div className="min-h-screen bg-black text-foreground">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button 
          onClick={onNavigateBack}
          variant="ghost" 
          className="mb-6 hover:bg-card"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="bg-card/50 border-border/30">
          <CardHeader className="text-center pb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Terms of Service</CardTitle>
            <p className="text-muted-foreground">
              Last updated: January 2025
            </p>
          </CardHeader>

          <CardContent className="space-y-8 text-sm leading-relaxed">
            <section>
              <h2 className="text-lg font-medium mb-4 text-primary">1. Acceptance of Terms</h2>
              <p>
                By accessing and using gravalist.com ("Platform"), creating an account, or participating in any community rides, 
                you agree to be bound by these Terms of Service and our Privacy Policy. If you disagree with any part of these terms, 
                you may not access the Platform.
              </p>
              <p className="mt-3">
                These Terms are governed by The Gravalist Company Pty Ltd, a company registered in South Africa, and are subject to 
                South African law including the Protection of Personal Information Act (POPIA).
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium mb-4 text-primary">2. Platform Description</h2>
              <p>
                Gravalist is a self-managed ultra endurance cycling community platform where riders organize everything themselves 
                with no official support. We provide route files, community features, and tracking tools for unsupported 
                ultra-cycling gravel bikepacking events.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium mb-4 text-primary">3. User Accounts and Community</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account and for all activities that occur under 
                your account. You agree to provide accurate, current, and complete information during registration and to update 
                such information to keep it accurate, current, and complete.
              </p>
              <p className="mt-3">
                As a member of the Gravalist community, you agree to:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Treat all community members with respect and courtesy</li>
                <li>Share experiences and support fellow riders within the community</li>
                <li>Follow community guidelines and maintain the spirit of ultra-endurance cycling</li>
                <li>Take full responsibility for your own safety and riding decisions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-medium mb-4 text-primary">4. Proprietary Content and Intellectual Property</h2>
              <p className="font-medium text-warning">
                IMPORTANT: All route files, GPX data, course information, maps, and related content provided through the Platform 
                are proprietary to Gravalist and are licensed exclusively for use by registered members.
              </p>
              <p className="mt-3">
                You agree that:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Route data and GPX files are for personal use only by registered Gravalist members</li>
                <li>You will NOT share, distribute, or make available our route content to non-members</li>
                <li>You will NOT publish, sell, or commercialize our proprietary route information</li>
                <li>You will NOT reverse engineer or attempt to extract our route data for external use</li>
                <li>Violation of these terms may result in immediate account termination and legal action</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-medium mb-4 text-primary">5. Platform Protection and Prohibited Activities</h2>
              <p>
                To protect our community and proprietary content, you agree NOT to:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Attempt to bypass, disable, or circumvent any security measures or access controls</li>
                <li>Use automated tools, bots, or scrapers to extract data from the Platform</li>
                <li>Attempt to gain unauthorized access to restricted areas of the Platform</li>
                <li>Share login credentials or allow others to access your account</li>
                <li>Reverse engineer or attempt to discover the source code of the Platform</li>
                <li>Use the Platform in any way that could damage, disable, or impair its functionality</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-medium mb-4 text-primary">6. Data Collection and Consent</h2>
              <p>
                By using the Platform, you acknowledge and agree that:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>All your actions, interactions, and activity on the Platform are recorded in our database</li>
                <li>Your ride data, progress, achievements, and community interactions belong to our database</li>
                <li>We collect and store information about your use of features, timing, and engagement patterns</li>
                <li>This data is used to improve the Platform, provide personalized experiences, and maintain community features</li>
                <li>Your data may be shared with event organizers, sponsors, and partners where relevant to event management and community value</li>
                <li>Your data is handled according to our Privacy Policy and POPIA requirements</li>
              </ul>
              <p className="mt-3">
                <strong>POPIA Rights:</strong> You have the right to access, correct, delete, or withdraw consent for your personal data. 
                Note that withdrawing consent may limit your ability to participate in events or community features.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium mb-4 text-primary">7. Self-Responsibility and Liability</h2>
              <p className="font-medium text-warning">
                CRITICAL: Ultra-endurance cycling is inherently dangerous. You participate entirely at your own risk.
              </p>
              <p className="mt-3">
                You acknowledge that:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Gravalist provides NO official support, aid stations, or safety measures</li>
                <li>You are solely responsible for your safety, equipment, and riding decisions</li>
                <li>You must have appropriate skills, fitness, and equipment for ultra-endurance riding</li>
                <li>Gravalist is not liable for any injury, damage, or loss during your participation</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-medium mb-4 text-primary">8. Points System and Community Features</h2>
              <p>
                Our points system and leaderboard are community features designed to encourage participation. Points have no 
                monetary value and may be adjusted or reset at our discretion. Community prizes, if any, are at our sole discretion.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium mb-4 text-primary">9. Termination</h2>
              <p>
                We reserve the right to terminate or suspend your account immediately, without prior notice, for conduct that 
                we believe violates these Terms or is harmful to other users, us, or third parties, or for any other reason.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium mb-4 text-primary">10. Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. We will notify users of any material changes. 
                Your continued use of the Platform after such modifications constitutes acceptance of the updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium mb-4 text-primary">11. Contact and Information Officer</h2>
              <p>
                For questions about these Terms of Service, please contact us through the Platform or at the contact 
                information provided on gravalist.com.
              </p>
              <p className="mt-3">
                <strong>Information Officer:</strong> The Gravalist Company Pty Ltd has appointed an Information Officer 
                registered with the South African Information Regulator for POPIA compliance matters. Contact details 
                are available upon request.
              </p>
            </section>

            <div className="border-t border-border/30 pt-6 text-center text-muted-foreground text-xs">
              <p>© 2025 The Gravalist Company Pty Ltd - Self Sufficiency | Responsibility | Honour</p>
              <p className="mt-1">Registered in South Africa | POPIA Compliant</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}