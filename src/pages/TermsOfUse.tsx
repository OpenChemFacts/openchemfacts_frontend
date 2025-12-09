import { FileText, Mail, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const TermsOfUse = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="container mx-auto px-4 py-12 flex-1">
        <div className="mb-8 text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-semibold mb-4 text-foreground tracking-tight">
            Terms of Use
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Conditions for using the OpenChemFacts platform
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Terms of Use
              </CardTitle>
              <CardDescription>
                Please read these terms carefully before using the OpenChemFacts platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold mb-2">1. Purpose of the Platform</h3>
                <p className="text-sm text-muted-foreground">
                  OpenChemFacts is a collaborative platform dedicated to collecting and sharing information about chemical substances, with a focus on ecotoxicity data and models. Our goal is to provide an open and accessible database to promote transparency and knowledge in chemical hazard and risk assessment.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">2. Acceptance of Terms</h3>
                <p className="text-sm text-muted-foreground">
                  By using this platform, you accept these terms of use in full. If you do not agree with these terms, please do not use the platform.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">3. User Contributions</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Users are encouraged to contribute to OpenChemFacts. Contributions can take different forms depending on what seems most effective for contributors (e.g., by email, through GitHub tickets, etc.).
                </p>
                <p className="text-sm text-muted-foreground mb-3">
                  Contributions may concern:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-2 ml-2 mb-3">
                  <li>
                    The OpenChemFacts platform itself: for example, requests for adding graphs to the website, bug corrections, feature suggestions, improvements to the user interface, etc.
                  </li>
                  <li>
                    Models and data used: for example, sharing in-vivo test results, sharing a QSAR model, contributing ecotoxicity data (e.g., EC10, LC50 values), species sensitivity distributions (SSD), and related models.
                  </li>
                </ul>
                <p className="text-sm text-muted-foreground mb-2">
                  When submitting information, you guarantee that:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-2 mb-3">
                  <li>The information is accurate to the best of your knowledge</li>
                  <li>The information does not violate any third-party rights</li>
                  <li>You have the right to share the information under the Open Database Licence (ODbL)</li>
                </ul>
                <p className="text-sm text-muted-foreground">
                  Contributors should provide appropriate citations and references for scientific data and models. All contributions are published under the{" "}
                  <a
                    href="https://app.gitbook.com/o/dQydSEllS3T0vyzF2UXh/s/D6f6Q6HL3iGcpTTQVqlL/licence"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors underline inline-flex items-center gap-1"
                  >
                    Open Database Licence (ODbL)
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  , allowing free use and redistribution, provided that the source is mentioned and any modifications are shared under the same licence.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">4. Limitation of Liability</h3>
                <p className="text-sm text-muted-foreground">
                  While we strive to provide accurate and up-to-date information, OpenChemFacts cannot guarantee the accuracy, completeness, or timeliness of the data presented. The information is provided for informational purposes only. Users are encouraged to verify information with official sources before making any decisions based on the data. OpenChemFacts disclaims all liability for errors or omissions in the provided data and models.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">5. Intellectual Property</h3>
                <p className="text-sm text-muted-foreground">
                  The content of the platform is protected by intellectual property laws. However, under the Open Database Licence (ODbL), users are free to use, modify, and distribute the data, provided they attribute the source and share any modifications under the same licence. Any reproduction, distribution, or modification of content outside the terms of the ODbL licence requires prior authorization.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">6. Modification of Terms</h3>
                <p className="text-sm text-muted-foreground">
                  OpenChemFacts reserves the right to modify these terms of use at any time. Users will be informed of significant changes through an update on the platform. Continued use of the platform after such modifications constitutes acceptance of the updated terms.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">7. Contact</h3>
                <p className="text-sm text-muted-foreground">
                  For questions regarding these terms of use, please contact us at{" "}
                  <a
                    href="mailto:alban@openchemfacts.com"
                    className="hover:text-foreground transition-colors inline-flex items-center gap-1"
                  >
                    <Mail className="h-3 w-3" />
                    alban@openchemfacts.com
                  </a>
                  {" "}or visit our{" "}
                  <Link
                    to="/contact"
                    className="hover:text-foreground transition-colors underline"
                  >
                    contact page
                  </Link>
                  .
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

export default TermsOfUse;

