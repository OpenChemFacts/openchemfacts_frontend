import { Building2, Server, Mail, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const Legal = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="container mx-auto px-4 py-12 flex-1">
        <div className="mb-8 text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-semibold mb-4 text-foreground tracking-tight">
            Legal Information
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Legal notices and hosting information
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Editor Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Editor
              </CardTitle>
              <CardDescription>
                Information about the website publisher
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Company</p>
                <p className="text-sm text-muted-foreground">
                  <a
                    href="https://www.pappers.fr/entreprise/lumens-990906950"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors underline inline-flex items-center gap-1"
                  >
                    Lumens EURL
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Note</p>
                <p className="text-sm text-muted-foreground">
                  The platform currently relies on Alban Fournier company (EURL Lumens) as the project is new. A dedicated legal entity will have to be created for OpenChemFacts once project is mature and discussions have been set with key contributors (e.g. scientific + industry + public profiles).
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Contact</p>
                <p className="text-sm text-muted-foreground">
                  <a
                    href="mailto:alban@openchemfacts.com"
                    className="hover:text-foreground transition-colors inline-flex items-center gap-1"
                  >
                    <Mail className="h-3 w-3" />
                    alban@openchemfacts.com
                  </a>
                </p>
              </div>
              {/* TODO: Add SIREN/SIRET, TVA number, and full address when available */}
            </CardContent>
          </Card>

          {/* Hosting Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Hosting
              </CardTitle>
              <CardDescription>
                Information about website and data hosting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Website Hosting</p>
                <p className="text-sm text-muted-foreground">
                  The website is hosted on Lovable platform
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">API and Results Hosting</p>
                <p className="text-sm text-muted-foreground mb-2">
                  The API and results files are hosted on{" "}
                  <a
                    href="https://scalingo.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors underline inline-flex items-center gap-1"
                  >
                    Scalingo SAS
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
                <p className="text-sm text-muted-foreground">
                  15 avenue du Rhin, 67100 Strasbourg, France
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Data Location</p>
                <p className="text-sm text-muted-foreground">
                  France (datacenters certifiés HDS / ISO 27001 selon région)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Legal;

