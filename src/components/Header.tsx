import { BookOpen, Mail, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

interface HeaderProps {
  onLogoClick?: () => void;
}

export const Header = ({ onLogoClick }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container mx-auto px-4 py-5">
        <div className="flex items-center justify-between">
          <Logo onClick={onLogoClick} />
          
          <div className="flex items-center gap-3">
            <Link to="/contact">
              <Button variant="outline" className="gap-2 font-medium">
                <Mail className="h-4 w-4" />
                Contact
              </Button>
            </Link>
            
            <a 
              href="https://api.openchemfacts.com/docs"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="gap-2 font-medium">
                <Code className="h-4 w-4" />
                API
              </Button>
            </a>
            
            <a 
              href="https://openchemfacts.gitbook.io/openchemfacts-docs/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="gap-2 font-medium">
                <BookOpen className="h-4 w-4" />
                Documentation
              </Button>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};
