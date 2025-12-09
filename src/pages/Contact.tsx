import { useState } from "react";
import { Mail, Video } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const Contact = () => {
  const [showEmail, setShowEmail] = useState(false);
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="container mx-auto px-4 py-12 flex-1">
        <div className="mb-8 text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-semibold mb-4 text-foreground tracking-tight">
            Contact
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Get in touch with our team
          </p>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Contact Us</CardTitle>
            <CardDescription>
              Get in touch with our team for questions, collaborations, or feedback
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Send us an email</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Have a question or want to collaborate? Drop us a message.
                </p>
                <div className="flex items-center gap-3">
                  <Button asChild variant="outline">
                    <a 
                      href="mailto:alban@openchemfacts.com"
                      onClick={() => setShowEmail(true)}
                    >
                      Send Email
                    </a>
                  </Button>
                  {showEmail && (
                    <span className="text-sm text-muted-foreground">
                      alban@openchemfacts.com
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <Video className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Book a video call</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Schedule a 1-hour discussion to explore collaboration opportunities.
                </p>
                <Button asChild variant="outline">
                  <a 
                    href="https://calendly.com/alban-fournier/echange-1h-ecobalyse-alban?month=2025-11&date=2025-11-26"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Schedule Meeting
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
