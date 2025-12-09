import { Shield, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="container mx-auto px-4 py-12 flex-1">
        <div className="mb-8 text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-semibold mb-4 text-foreground tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            How we handle your data and privacy
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy Policy
              </CardTitle>
              <CardDescription>
                Our commitment to protecting your privacy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold mb-2">1. Web Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  We use web analytics (Plausible tool) to understand how our website is used and to improve its performance.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">2. No Personal Data Collection</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Plausible does not collect any personal data.
                </p>
                <p className="text-sm text-muted-foreground">
                  No cookies, no IP addresses, no user identifiers, and no cross-site tracking are used.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">3. GDPR Compliance</h3>
                <p className="text-sm text-muted-foreground">
                  Our analytics setup is compliant with GDPR, ePrivacy, and PECR regulations.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  No consent banner is required as no personal data is processed.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">4. Secure Data Hosting in France</h3>
                <p className="text-sm text-muted-foreground">
                  All analytics data is processed and stored securely on servers located in the European Union.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">5. Anonymization of Third-Party Contributions</h3>
                <p className="text-sm text-muted-foreground">
                  All contributions from third-parties on sensitive data (e.g., ecotoxicity test results) are anonymised to protect privacy and confidentiality.
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

export default Privacy;

