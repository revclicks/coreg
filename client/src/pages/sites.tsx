import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Copy, RefreshCw, Code, Settings, Download, Globe, Palette, External } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import AddSiteModal from "@/components/modals/add-site-modal";
import type { Site } from "@shared/schema";

export default function Sites() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [selectedSite, setSelectedSite] = useState<number | null>(null);
  const [widgetConfig, setWidgetConfig] = useState({
    fields: ['email', 'firstName', 'lastName'],
    styling: {
      theme: 'default',
      primaryColor: '#3b82f6',
      borderRadius: '8',
      fontSize: '14'
    },
    behavior: {
      showProgressBar: true,
      enableValidation: true,
      submitButtonText: 'Submit',
      thankYouMessage: 'Thank you for your submission!'
    },
    integration: {
      webhookUrl: '',
      redirectUrl: '',
      trackingCode: ''
    }
  });
  const [generatedCode, setGeneratedCode] = useState('');
  const { toast } = useToast();

  // Widget generation mutation
  const generateWidgetMutation = useMutation({
    mutationFn: async (config: any) => {
      return await apiRequest('/api/widget/generate-code', {
        method: 'POST',
        body: JSON.stringify({
          siteId: selectedSite,
          ...config
        })
      });
    },
    onSuccess: (data) => {
      setGeneratedCode(data.code);
      toast({
        title: "Widget code generated!",
        description: "Your embed code is ready to use.",
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

  const handleGenerateWidget = () => {
    if (!selectedSite) {
      toast({
        title: "Error",
        description: "Please select a site first.",
        variant: "destructive",
      });
      return;
    }
    generateWidgetMutation.mutate(widgetConfig);
  };

  const handleCopyWidget = () => {
    navigator.clipboard.writeText(generatedCode);
    toast({
      title: "Code copied!",
      description: "Widget embed code has been copied to clipboard.",
    });
  };

  const { data: sites, isLoading, refetch: refetchSites } = useQuery<Site[]>({
    queryKey: ["/api/sites"],
    staleTime: 0,
    gcTime: 0,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/sites/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete site");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sites"] });
    },
  });

  const handleEdit = (site: Site) => {
    setEditingSite(site);
    setShowAddModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this site?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCopyCode = (siteCode: string) => {
    const code = `<script src="https://cdn.coreg.com/sites/${siteCode}.js"></script>`;
    navigator.clipboard.writeText(code);
    toast({
      title: "Code copied!",
      description: "Site embed code has been copied to clipboard.",
    });
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingSite(null);
  };

  const getVerticalColor = (vertical: string) => {
    const colors: Record<string, string> = {
      health: "bg-blue-100 text-blue-800",
      finance: "bg-green-100 text-green-800",
      technology: "bg-purple-100 text-purple-800",
      energy: "bg-amber-100 text-amber-800",
      travel: "bg-pink-100 text-pink-800",
    };
    return colors[vertical.toLowerCase()] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-32 bg-slate-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Site Manager & Widget Configuration</span>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchSites()}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Site
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sites" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sites" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Site Management
              </TabsTrigger>
              <TabsTrigger value="widgets" className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                Widget Configuration
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="sites" className="space-y-6 mt-6">
          {/* External Demo Links */}
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="text-lg font-semibold text-green-800 mb-2">Live Demo Pages</h4>
            <p className="text-green-700 text-sm mb-3">External standalone pages for testing and demonstration</p>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('/senior-benefits.html', '_blank')}
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                Senior Benefits Demo (Site ID: 3)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('/widget-test', '_blank')}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                Widget Test Page
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sites?.map((site) => (
              <Card key={site.id} className="border border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-slate-800">{site.name}</h4>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(site)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(site.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Domain:</span>
                      <span className="text-slate-800">{site.domain}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Vertical:</span>
                      <Badge className={getVerticalColor(site.vertical)}>
                        {site.vertical}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Excluded Verticals:</span>
                      <div className="flex space-x-1">
                        {(site.excludedVerticals as string[] || []).map((vertical, index) => (
                          <Badge key={index} variant="destructive" className="text-xs">
                            {vertical}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Site Code:
                      </label>
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                        <code className="text-xs text-slate-800 font-mono break-all">
                          {`<script src="https://cdn.coreg.com/sites/${site.siteCode}.js"></script>`}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-2"
                          onClick={() => handleCopyCode(site.siteCode)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
            </TabsContent>
            
            <TabsContent value="widgets" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Site Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Site Selection
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Label htmlFor="site-select">Select Site</Label>
                    <Select value={selectedSite?.toString() || ""} onValueChange={(value) => setSelectedSite(Number(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a site for widget configuration" />
                      </SelectTrigger>
                      <SelectContent>
                        {sites?.map((site) => (
                          <SelectItem key={site.id} value={site.id.toString()}>
                            {site.name} ({site.domain})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                {/* Widget Configuration */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="w-5 h-5" />
                      Widget Styling
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="theme">Theme</Label>
                      <Select value={widgetConfig.styling.theme} onValueChange={(value) => 
                        setWidgetConfig(prev => ({ ...prev, styling: { ...prev.styling, theme: value } }))
                      }>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default</SelectItem>
                          <SelectItem value="minimal">Minimal</SelectItem>
                          <SelectItem value="modern">Modern</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="primary-color">Primary Color</Label>
                      <Input 
                        type="color" 
                        value={widgetConfig.styling.primaryColor}
                        onChange={(e) => setWidgetConfig(prev => ({ 
                          ...prev, 
                          styling: { ...prev.styling, primaryColor: e.target.value } 
                        }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="border-radius">Border Radius (px)</Label>
                      <Input 
                        type="number" 
                        value={widgetConfig.styling.borderRadius}
                        onChange={(e) => setWidgetConfig(prev => ({ 
                          ...prev, 
                          styling: { ...prev.styling, borderRadius: e.target.value } 
                        }))}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Widget Generation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="w-5 h-5" />
                    Generate Widget Code
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <Button 
                      onClick={handleGenerateWidget}
                      disabled={!selectedSite || generateWidgetMutation.isPending}
                      className="gap-2"
                    >
                      <Code className="w-4 h-4" />
                      {generateWidgetMutation.isPending ? 'Generating...' : 'Generate Widget'}
                    </Button>
                    
                    {generatedCode && (
                      <Button variant="outline" onClick={handleCopyWidget} className="gap-2">
                        <Copy className="w-4 h-4" />
                        Copy Code
                      </Button>
                    )}
                  </div>
                  
                  {generatedCode && (
                    <div className="mt-4">
                      <Label>Generated Embed Code</Label>
                      <Textarea 
                        value={generatedCode}
                        readOnly
                        className="font-mono text-sm"
                        rows={8}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <AddSiteModal
        open={showAddModal}
        onClose={handleCloseModal}
        editingSite={editingSite}
      />
    </div>
  );
}
