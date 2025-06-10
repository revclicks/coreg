import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Play, Code, Info } from "lucide-react";

export default function LeadWidgetTest() {
  const [widgetLoaded, setWidgetLoaded] = useState(false);

  const loadLeadWidget = () => {
    // Remove any existing widget
    const existingWidget = document.getElementById('lead-coreg-widget');
    if (existingWidget) {
      existingWidget.remove();
    }

    // Remove existing overlay
    const existingOverlay = document.querySelector('[style*="position: fixed"][style*="background: rgba(0,0,0,0.5)"]');
    if (existingOverlay) {
      existingOverlay.remove();
    }

    // Load the lead widget script
    const script = document.createElement('script');
    script.src = '/lead-widget.js';
    script.onload = () => {
      setWidgetLoaded(true);
    };
    document.head.appendChild(script);
  };

  const widgetCode = `<!-- Lead Generation Widget -->
<script src="https://your-domain.com/lead-widget.js"></script>

<!-- Optional: Custom styling -->
<style>
#lead-coreg-widget {
  /* Custom widget styles */
}
</style>`;

  const implementationSteps = [
    {
      title: "1. Create Lead Campaign",
      description: "Set up a new campaign with type 'Lead' in the Campaign Manager",
      status: "required"
    },
    {
      title: "2. Configure Questions",
      description: "Target specific question answers that match your offer",
      status: "required"
    },
    {
      title: "3. Set Webhook URL",
      description: "Provide endpoint URL to receive lead data via HTTP POST",
      status: "required"
    },
    {
      title: "4. Embed Widget",
      description: "Add the widget script to your website",
      status: "optional"
    }
  ];

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Lead Widget Testing</h1>
          <p className="text-gray-600 mt-2">Test the lead generation widget functionality</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadLeadWidget} className="gap-2">
            <Play className="w-4 h-4" />
            Launch Lead Widget
          </Button>
        </div>
      </div>

      {/* Widget Demo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            Live Demo
          </CardTitle>
          <CardDescription>
            Click the button above to launch the lead generation widget
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-6 rounded-lg text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Interactive Lead Widget</h3>
              <p className="text-gray-600 mb-4">
                The widget will collect user information and present yes/no offers based on campaign targeting
              </p>
            </div>
            {widgetLoaded && (
              <Badge variant="default" className="bg-green-100 text-green-800">
                Widget Loaded Successfully
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Implementation Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Implementation Guide
          </CardTitle>
          <CardDescription>
            Steps to set up lead generation campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {implementationSteps.map((step, index) => (
              <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{step.title}</h4>
                  <p className="text-gray-600 text-sm mt-1">{step.description}</p>
                </div>
                <Badge variant={step.status === "required" ? "default" : "secondary"}>
                  {step.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Code Example */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            Integration Code
          </CardTitle>
          <CardDescription>
            HTML code to embed the lead widget on your website
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
            <pre>{widgetCode}</pre>
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(widgetCode)}>
              Copy Code
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/lead-widget.js" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-1" />
                View Widget Source
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle>Lead Widget Features</CardTitle>
          <CardDescription>
            Key capabilities of the lead generation widget
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold">Data Collection</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Email capture with validation</li>
                <li>• Personal information form</li>
                <li>• Phone number formatting</li>
                <li>• Date of birth validation</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold">Lead Generation</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Yes/No response collection</li>
                <li>• Campaign-specific targeting</li>
                <li>• Real-time webhook delivery</li>
                <li>• Lead response tracking</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold">User Experience</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Mobile-responsive design</li>
                <li>• Progress indicators</li>
                <li>• Smooth transitions</li>
                <li>• Privacy disclosures</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold">Analytics</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Conversion tracking</li>
                <li>• Delivery status monitoring</li>
                <li>• Campaign performance metrics</li>
                <li>• Lead quality scoring</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Webhook Format */}
      <Card>
        <CardHeader>
          <CardTitle>Webhook Payload Format</CardTitle>
          <CardDescription>
            JSON structure sent to campaign webhook URLs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
            <pre>{`{
  "leadId": 123,
  "campaignId": 456,
  "campaignName": "Insurance Leads",
  "companyName": "InsureCorp",
  "questionText": "Do you own a car?",
  "userAnswer": "Yes",
  "leadResponse": "yes",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "(555) 123-4567",
  "dateOfBirth": "01/15/1990",
  "gender": "male",
  "zipCode": "12345",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "leadPrice": "5.00",
  "timestamp": "2024-01-15T10:30:00Z"
}`}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}