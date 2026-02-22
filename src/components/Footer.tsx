import React from 'react';

interface FooterProps {
  onNavigateToLeaderboard?: () => void;
  onNavigateToAddRoute: () => void;
  onNavigateToTerms?: () => void;
  onNavigateToPrivacy?: () => void;
}

export function Footer({ onNavigateToLeaderboard, onNavigateToAddRoute, onNavigateToTerms, onNavigateToPrivacy }: FooterProps) {
  return (
    <footer className="border-t border-border/30 bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-6">
          {/* Copyright */}
          <div className="text-sm text-muted-foreground order-2 md:order-1 text-center md:text-left">
            © 2025 gravalist.com
          </div>
          
          {/* Legal Links */}
          <div className="flex items-center justify-center gap-4 order-1 md:order-2">
            <button 
              onClick={onNavigateToTerms}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms of Service
            </button>
            <span className="text-muted-foreground">·</span>
            <button 
              onClick={onNavigateToPrivacy}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy Policy
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-4 order-3">
            <button 
              onClick={onNavigateToAddRoute}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              + Route
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}