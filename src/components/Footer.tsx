import { FileText, GitBranch, Mail, Scale, ScrollText, Shield, ExternalLink, Github, Code } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="border-t bg-card/50 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-center gap-6 mb-6">
          {/* Legal Documents */}
          <Link
            to="/legal"
            className="font-semibold text-sm text-foreground hover:text-primary transition-colors flex items-center gap-2"
          >
            <Scale className="h-4 w-4" />
            Legal
          </Link>
          <Link
            to="/terms-of-use"
            className="font-semibold text-sm text-foreground hover:text-primary transition-colors flex items-center gap-2"
          >
            <ScrollText className="h-4 w-4" />
            Terms of Use
          </Link>
          <Link
            to="/privacy"
            className="font-semibold text-sm text-foreground hover:text-primary transition-colors flex items-center gap-2"
          >
            <Shield className="h-4 w-4" />
            Privacy
          </Link>
          
          {/* Resources */}
          <a
            href="https://app.gitbook.com/o/dQydSEllS3T0vyzF2UXh/s/D6f6Q6HL3iGcpTTQVqlL/licence"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-sm text-foreground hover:text-primary transition-colors flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            License
            <ExternalLink className="h-3 w-3" />
          </a>
          <a
            href="https://openchemfacts.gitbook.io/openchemfacts-docs/versioning"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-sm text-foreground hover:text-primary transition-colors flex items-center gap-2"
          >
            <GitBranch className="h-4 w-4" />
            Versioning
            <ExternalLink className="h-3 w-3" />
          </a>
          
          {/* Contact & Transparency */}
          <Link
            to="/contact"
            className="font-semibold text-sm text-foreground hover:text-primary transition-colors flex items-center gap-2"
          >
            <Mail className="h-4 w-4" />
            Contact
          </Link>
          <a
            href="https://github.com/orgs/OpenChemFacts/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-sm text-foreground hover:text-primary transition-colors flex items-center gap-2"
          >
            <Github className="h-4 w-4" />
            GitHub
            <ExternalLink className="h-3 w-3" />
          </a>
          <a
            href="https://api.openchemfacts.com/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-sm text-foreground hover:text-primary transition-colors flex items-center gap-2"
          >
            <Code className="h-4 w-4" />
            API
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {/* Bottom Bar */}
        <div className="border-t pt-4 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} OpenChemFacts. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

