import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ArrowLeft, Shield } from 'lucide-react';

interface PrivacyPolicyPageProps {
  onNavigateBack: () => void;
}

export function PrivacyPolicyPage({ onNavigateBack }: PrivacyPolicyPageProps) {
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
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Privacy Policy</CardTitle>
            <p className="text-muted-foreground">
              Last updated: January 2025
            </p>
          </CardHeader>

          <CardContent className="space-y-8 text-sm leading-relaxed">
            <section>
              <h2 className="text-lg font-medium mb-4 text-primary">1. Introduction</h2>
              <p>
                The Gravalist Company Pty Ltd ("we," "our," or "us"), a company registered in South Africa, respects your privacy 
                and is committed to protecting your personal data in accordance with the Protection of Personal Information Act (POPIA). 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use 
                our platform at gravalist.com for ultra-endurance sports events, routes, and community engagement.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium mb-4 text-primary">2. Information We Collect</h2>
              
              <h3 className="font-medium mb-2 text-secondary">2.1 Personal Information</h3>
              <p>When you register and use our platform, we collect:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Email address (primary identifier for privacy reasons)</li>
                <li>First and last name</li>
                <li>City/location information</li>
                <li>Profile information you choose to provide</li>
                <li>Communication preferences</li>
              </ul>

              <h3 className="font-medium mb-2 mt-4 text-secondary">2.2 Activity and Usage Data</h3>
              <p>
                <strong>Important:</strong> We comprehensively track and store all your platform activity, including:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Every action you take on the platform (clicks, navigation, form submissions)</li>
                <li>Onboarding progress and step completion times</li>
                <li>Event registrations and participation data</li>
                <li>Ride start times, finish times, and completion status</li>
                <li>Points earned and leaderboard interactions</li>
                <li>Community interactions and contributions</li>
                <li>Technical data (device type, browser, IP address, session duration)</li>
                <li>Feature usage patterns and engagement metrics</li>
              </ul>

              <h3 className="font-medium mb-2 mt-4 text-secondary">2.3 Ride and Performance Data</h3>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>GPS tracking data and route progress (if you choose to share)</li>
                <li>Start and finish confirmations</li>
                <li>Photo uploads and ride documentation</li>
                <li>Post-ride reflections and ratings</li>
                <li>Equipment and preparation information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-medium mb-4 text-primary">3. How We Use Your Information (Purpose of Processing)</h2>
              <p>Under POPIA, we process your information for the following specific purposes:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li><strong>Event Participation:</strong> Registration, logistics, results tracking, and verification of fair play</li>
                <li><strong>Community Engagement:</strong> Routes, leaderboards, user stories, shared content, and community interactions</li>
                <li><strong>Platform Services:</strong> Account management, progress tracking, and points calculation</li>
                <li><strong>Communication:</strong> Important updates about events and platform changes</li>
                <li><strong>Improvement:</strong> Platform functionality enhancement and user experience optimization</li>
                <li><strong>Security:</strong> Detecting and preventing platform abuse or security issues</li>
                <li><strong>Legal Compliance:</strong> Meeting legal obligations and regulatory requirements</li>
                <li><strong>Partner Sharing:</strong> Sharing with event organizers, sponsors, and partners for event management and community value</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-medium mb-4 text-primary">4. Data Ownership and Storage</h2>
              <p className="font-medium text-warning">
                By using Gravalist, you acknowledge that all activity data generated through your use of the platform 
                becomes part of our database and belongs to Gravalist.
              </p>
              <p className="mt-3">This includes:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Your progression through onboarding steps and events</li>
                <li>Timing data, completion rates, and engagement patterns</li>
                <li>Community contributions and interactions</li>
                <li>Points, achievements, and leaderboard positions</li>
                <li>Platform usage analytics and behavioral data</li>
              </ul>
              <p className="mt-3">
                This data is essential for maintaining community features, calculating fair leaderboard rankings, 
                and continuously improving the platform experience for all members.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium mb-4 text-primary">5. Information Sharing and Disclosure</h2>
              
              <h3 className="font-medium mb-2 text-secondary">5.1 Community Features</h3>
              <p>Some information is shared within the Gravalist community:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Your chosen display name on leaderboards</li>
                <li>Points earned and community ranking</li>
                <li>Event participation and completion status</li>
                <li>Public profile information you choose to share</li>
              </ul>

              <h3 className="font-medium mb-2 mt-4 text-secondary">5.2 Authorized Sharing with Partners</h3>
              <p>We share data with authorized parties under contracts for legitimate purposes:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Event organizers for event management and logistics</li>
                <li>Sponsors for recognition and community value initiatives</li>
                <li>Partners for enhanced event experiences and services</li>
                <li>International sharing only where comparable protection standards exist</li>
              </ul>

              <h3 className="font-medium mb-2 mt-4 text-secondary">5.3 We Do NOT Share</h3>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Your email address with other members</li>
                <li>Personal data with third parties for marketing purposes without consent</li>
                <li>Detailed activity data outside of legitimate business purposes</li>
              </ul>

              <h3 className="font-medium mb-2 mt-4 text-secondary">5.4 Legal Requirements</h3>
              <p>
                We may disclose your information if required by law, regulation, legal process, or governmental request 
                in accordance with POPIA and South African law.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium mb-4 text-primary">6. Proprietary Route Data Protection</h2>
              <p>
                Our route files, GPX data, and course information are proprietary. We use your activity data to:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Ensure route data is only accessed by authorized members</li>
                <li>Monitor for unauthorized sharing or distribution</li>
                <li>Detect attempts to bypass platform controls</li>
                <li>Protect our intellectual property rights</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-medium mb-4 text-primary">7. Data Security and Breach Handling</h2>
              <p>
                We implement appropriate technical and organizational security measures to protect your personal information, including:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Encryption for payment processing and sensitive data</li>
                <li>Controlled access for user accounts and data</li>
                <li>Regular security updates and monitoring</li>
                <li>Industry-standard safeguards and protection measures</li>
              </ul>
              <p className="mt-3">
                <strong>Breach Response:</strong> In the event of a data breach, we will notify the South African Information Regulator 
                and affected users as required by POPIA, providing details of the breach and steps taken to address it.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium mb-4 text-primary">8. Data Retention and Monitoring</h2>
              <p>
                We retain your personal information for as long as necessary to:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Provide our services and maintain your account</li>
                <li>Comply with legal obligations and POPIA requirements</li>
                <li>Resolve disputes and enforce our agreements</li>
                <li>Maintain platform history and community archives (leaderboards, routes completed)</li>
                <li>Support ongoing community engagement and fair play verification</li>
              </ul>
              <p className="mt-3">
                <strong>Community Archives:</strong> Please note that participation records like leaderboards and completed routes 
                may remain visible as part of community archives and platform history, even after account deletion.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium mb-4 text-primary">9. Your POPIA Rights</h2>
              <p>Under the Protection of Personal Information Act (POPIA), you have the following rights:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li><strong>Access:</strong> Request access to your personal data we hold (e.g., event history, community profile)</li>
                <li><strong>Correction:</strong> Request correction or updating of inaccurate personal data</li>
                <li><strong>Deletion:</strong> Request deletion of your data (except where records must be kept for legal or historical purposes)</li>
                <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing (may limit event or community participation)</li>
                <li><strong>Object to Processing:</strong> Object to processing of your data for specific purposes</li>
                <li><strong>Data Portability:</strong> Request your data in a portable format where technically feasible</li>
              </ul>
              <p className="mt-3">
                <strong>Important:</strong> Some data may be retained to maintain community features, prevent abuse, and comply with legal requirements. 
                Withdrawing consent may limit your ability to participate in events and community features.
              </p>
              <p className="mt-3">
                To exercise these rights, contact us through the platform or our Information Officer.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium mb-4 text-primary">10. Cookies and Tracking</h2>
              <p>
                We use essential cookies and similar technologies to maintain your session, remember your preferences, 
                and ensure platform functionality. We do not use tracking cookies for advertising purposes.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium mb-4 text-primary">11. Children's Privacy</h2>
              <p>
                Our platform is not intended for individuals under 18 years of age. We do not knowingly collect 
                personal information from children under 18.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium mb-4 text-primary">12. International Data Transfers</h2>
              <p>
                Your information may be transferred to and processed in countries other than your own. We ensure 
                appropriate safeguards are in place for such transfers.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium mb-4 text-primary">13. Changes to This Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any material changes by 
                posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium mb-4 text-primary">14. Contact Us and Information Officer</h2>
              <p>
                If you have any questions about this Privacy Policy or wish to exercise your POPIA rights, please contact us 
                through the platform or at the contact information provided on gravalist.com.
              </p>
              <p className="mt-3">
                <strong>Information Officer:</strong> The Gravalist Company Pty Ltd has appointed and registered an Information Officer 
                with the South African Information Regulator for POPIA compliance matters. Contact details for our Information Officer 
                are available upon request for privacy-related inquiries and rights requests.
              </p>
            </section>

            <div className="border-t border-border/30 pt-6 text-center text-muted-foreground text-xs">
              <p>© 2025 The Gravalist Company Pty Ltd - Self Sufficiency | Responsibility | Honour</p>
              <p className="mt-1">Registered in South Africa | POPIA Compliant | Information Officer Registered</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}