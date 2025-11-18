import { BookOpen, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

export const Header = () => {
  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-5">
        <div className="flex items-center justify-between">
          <Logo />
          
          <div className="flex items-center gap-3">
            <Link to="/contact">
              <Button variant="outline" className="gap-2 font-medium">
                <Mail className="h-4 w-4" />
                Contact
              </Button>
            </Link>
            
            <a 
              href="https://app.gitbook.com/invite/dQydSEllS3T0vyzF2UXh/DBlIC7FjfdDHgkLJZTTh"
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
