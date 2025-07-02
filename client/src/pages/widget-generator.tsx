import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Copy, Code, Globe, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Site {
  id: number;
  name: string;
  url: string;
  domain: string;
  status: string;
  category: string;
  widget_config: any;
}

export default function WidgetGenerator() {
  const { toast } = useToast();
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [widgetConfig, setWidgetConfig] = useState({
    theme: "light",
    position: "bottom-right",
    trigger: "button",
    questions_per_flow: 3,
    max_ads: 2,
    flow_type: "progressive"
  });

  const { data: sites, isLoading } = useQuery<Site[]>({
    queryKey: ["/api/sites"],
  });

  const generateCodeMutation = useMutation({
    mutationFn: async (config: any) => {
      return await apiRequest("/api/widget/generate-code", { 
        method: "POST", 
        body: JSON.stringify(config) 
      });
    },
    onSuccess: () => {
      toast({
        title: "Widget Code Generated",
        description: "The widget code has been generated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate widget code.",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Code copied to clipboard.",
    });
  };

  const generateEmbedCode = () => {
    if (!selectedSite) return "";
    
    return `<!-- CoReg Marketing Widget -->
<script type="text/javascript">
  (function() {
    var coregWidget = document.createElement('script');
    coregWidget.type = 'text/javascript';
    coregWidget.async = true;
    coregWidget.src = '${window.location.origin}/widget.js';
    coregWidget.onload = function() {
      new CoRegWidget({
        siteCode: '${selectedSite.id}',
        theme: '${widgetConfig.theme}',
        position: '${widgetConfig.position}',
        trigger: '${widgetConfig.trigger}',
        questionsPerFlow: ${widgetConfig.questions_per_flow},
        maxAds: ${widgetConfig.max_ads},
        flowType: '${widgetConfig.flow_type}',
        apiUrl: '${window.location.origin}/api'
      }).init();
    };
    var firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode.insertBefore(coregWidget, firstScript);
  })();
</script>
<!-- End CoReg Marketing Widget -->`;
  };

  const generateBackendIntegration = () => {
    if (!selectedSite) return "";
    
    return `// Backend Form Integration Example
// Add this to your form submission handler

const coregData = {
  email: formData.email,
  firstName: formData.firstName,
  lastName: formData.lastName,
  phone: formData.phone,
  dateOfBirth: formData.dateOfBirth,
  zipCode: formData.zipCode,
  // Add other form fields as needed
};

// Send data to CoReg platform
fetch('${window.location.origin}/api/form-data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    siteCode: '${selectedSite.id}',
    userData: coregData,
    timestamp: new Date().toISOString()
  })
})
.then(response => response.json())
.then(data => {
  console.log('CoReg data submitted:', data);
})
.catch(error => {
  console.error('CoReg submission error:', error);
});`;
  };

  if (isLoading) {
    return <div>Loading sites...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Widget Code Generator</h1>
        <p className="text-muted-foreground">
          Generate embed codes and backend integration for your sites
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Configuration Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Widget Configuration
            </CardTitle>
            <CardDescription>
              Configure your widget settings and select a site
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="site">Select Site</Label>
              <Select
                value={selectedSite?.id?.toString() || ""}
                onValueChange={(value) => {
                  const site = (sites || []).find((s: Site) => s.id.toString() === value);
                  setSelectedSite(site || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a site" />
                </SelectTrigger>
                <SelectContent>
                  {(sites || []).map((site: Site) => (
                    <SelectItem key={site.id} value={site.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        {site.name}
                        <Badge variant="secondary">{site.status}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select
                  value={widgetConfig.theme}
                  onValueChange={(value) => setWidgetConfig({ ...widgetConfig, theme: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Select
                  value={widgetConfig.position}
                  onValueChange={(value) => setWidgetConfig({ ...widgetConfig, position: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bottom-right">Bottom Right</SelectItem>
                    <SelectItem value="bottom-left">Bottom Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="trigger">Trigger</Label>
                <Select
                  value={widgetConfig.trigger}
                  onValueChange={(value) => setWidgetConfig({ ...widgetConfig, trigger: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="button">Button Click</SelectItem>
                    <SelectItem value="auto">Auto Load</SelectItem>
                    <SelectItem value="scroll">On Scroll</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="flow_type">Flow Type</Label>
                <Select
                  value={widgetConfig.flow_type}
                  onValueChange={(value) => setWidgetConfig({ ...widgetConfig, flow_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="progressive">Progressive</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="front_loaded">Front Loaded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="questions">Questions per Flow</Label>
                <Input
                  type="number"
                  value={widgetConfig.questions_per_flow}
                  onChange={(e) => setWidgetConfig({ 
                    ...widgetConfig, 
                    questions_per_flow: parseInt(e.target.value) || 3 
                  })}
                  min="1"
                  max="10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ads">Max Ads</Label>
                <Input
                  type="number"
                  value={widgetConfig.max_ads}
                  onChange={(e) => setWidgetConfig({ 
                    ...widgetConfig, 
                    max_ads: parseInt(e.target.value) || 2 
                  })}
                  min="1"
                  max="5"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Site Details */}
        {selectedSite && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Site Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Site Name</Label>
                <p className="text-sm text-muted-foreground">{selectedSite.name}</p>
              </div>
              <div>
                <Label>Domain</Label>
                <p className="text-sm text-muted-foreground">{selectedSite.domain}</p>
              </div>
              <div>
                <Label>Category</Label>
                <p className="text-sm text-muted-foreground">{selectedSite.category}</p>
              </div>
              <div>
                <Label>Status</Label>
                <Badge variant={selectedSite.status === 'active' ? 'default' : 'secondary'}>
                  {selectedSite.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Generated Code */}
      {selectedSite && (
        <div className="space-y-6">
          {/* Frontend Embed Code */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Frontend Embed Code
              </CardTitle>
              <CardDescription>
                Add this code to your website's HTML where you want the widget to appear
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Textarea
                  value={generateEmbedCode()}
                  readOnly
                  className="min-h-[200px] font-mono text-sm"
                />
                <Button
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(generateEmbedCode())}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Backend Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Backend Form Integration
              </CardTitle>
              <CardDescription>
                Add this code to your form submission handler to send data to the CoReg platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Textarea
                  value={generateBackendIntegration()}
                  readOnly
                  className="min-h-[300px] font-mono text-sm"
                />
                <Button
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(generateBackendIntegration())}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}