import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export interface ConversionPixel {
  id: string;
  provider: string;
  name: string;
  pixelId?: string;
  eventName?: string;
  customCode?: string;
  parameters?: Record<string, string>;
  active: boolean;
}

interface ConversionPixelManagerProps {
  pixels: ConversionPixel[];
  onChange: (pixels: ConversionPixel[]) => void;
}

const PIXEL_PROVIDERS = [
  { value: "facebook", label: "Facebook Pixel", icon: "📘" },
  { value: "google_analytics", label: "Google Analytics 4", icon: "📊" },
  { value: "google_ads", label: "Google Ads", icon: "🎯" },
  { value: "tiktok", label: "TikTok Pixel", icon: "🎵" },
  { value: "twitter", label: "Twitter Pixel", icon: "🐦" },
  { value: "linkedin", label: "LinkedIn Insight", icon: "💼" },
  { value: "custom", label: "Custom Pixel", icon: "⚙️" }
];

const COMMON_EVENTS = {
  facebook: ["Purchase", "Lead", "CompleteRegistration", "AddToCart", "ViewContent"],
  google_analytics: ["purchase", "generate_lead", "sign_up", "add_to_cart", "page_view"],
  google_ads: ["conversion", "purchase", "signup", "download"],
  tiktok: ["Complete", "Contact", "SubmitForm", "Subscribe"],
  twitter: ["tw-conversion", "tw-signup", "tw-purchase"],
  linkedin: ["conversion", "lead", "signup"],
  custom: []
};

export default function ConversionPixelManager({ pixels, onChange }: ConversionPixelManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPixel, setEditingPixel] = useState<ConversionPixel | null>(null);

  const addPixel = (pixel: Omit<ConversionPixel, 'id'>) => {
    const newPixel: ConversionPixel = {
      ...pixel,
      id: Date.now().toString()
    };
    onChange([...pixels, newPixel]);
    setShowAddForm(false);
  };

  const updatePixel = (updatedPixel: ConversionPixel) => {
    onChange(pixels.map(p => p.id === updatedPixel.id ? updatedPixel : p));
    setEditingPixel(null);
  };

  const removePixel = (id: string) => {
    onChange(pixels.filter(p => p.id !== id));
  };

  const togglePixel = (id: string) => {
    onChange(pixels.map(p => p.id === id ? { ...p, active: !p.active } : p));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Configured Pixels ({pixels.length})</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Pixel
        </Button>
      </div>

      {pixels.length > 0 ? (
        <div className="space-y-3">
          {pixels.map((pixel) => {
            const provider = PIXEL_PROVIDERS.find(p => p.value === pixel.provider);
            return (
              <Card key={pixel.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{provider?.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{pixel.name}</span>
                        <Badge variant={pixel.active ? "default" : "secondary"}>
                          {pixel.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {provider?.label} {pixel.eventName ? `- ${pixel.eventName}` : ''}
                        {pixel.pixelId ? ` (${pixel.pixelId})` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePixel(pixel.id)}
                    >
                      {pixel.active ? "Disable" : "Enable"}
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button type="button" variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Pixel Details: {pixel.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium">Provider</Label>
                            <p className="text-sm">{provider?.label}</p>
                          </div>
                          {pixel.pixelId && (
                            <div>
                              <Label className="text-sm font-medium">Pixel ID</Label>
                              <p className="text-sm font-mono bg-muted p-2 rounded">{pixel.pixelId}</p>
                            </div>
                          )}
                          {pixel.eventName && (
                            <div>
                              <Label className="text-sm font-medium">Event Name</Label>
                              <p className="text-sm">{pixel.eventName}</p>
                            </div>
                          )}
                          {pixel.customCode && (
                            <div>
                              <Label className="text-sm font-medium">Custom Code</Label>
                              <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                                {pixel.customCode}
                              </pre>
                            </div>
                          )}
                          {pixel.parameters && Object.keys(pixel.parameters).length > 0 && (
                            <div>
                              <Label className="text-sm font-medium">Parameters</Label>
                              <div className="space-y-1">
                                {Object.entries(pixel.parameters).map(([key, value]) => (
                                  <div key={key} className="flex gap-2 text-sm">
                                    <span className="font-mono">{key}:</span>
                                    <span>{value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingPixel(pixel)}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePixel(pixel.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-6">
          <div className="text-center text-muted-foreground">
            <p>No conversion pixels configured</p>
            <p className="text-sm">Add pixels to track conversions across different platforms</p>
          </div>
        </Card>
      )}

      {(showAddForm || editingPixel) && (
        <PixelForm
          pixel={editingPixel}
          onSave={editingPixel ? updatePixel : addPixel}
          onCancel={() => {
            setShowAddForm(false);
            setEditingPixel(null);
          }}
        />
      )}
    </div>
  );
}

interface PixelFormProps {
  pixel?: ConversionPixel | null;
  onSave: (pixel: ConversionPixel | Omit<ConversionPixel, 'id'>) => void;
  onCancel: () => void;
}

function PixelForm({ pixel, onSave, onCancel }: PixelFormProps) {
  const [formData, setFormData] = useState<Partial<ConversionPixel>>({
    provider: pixel?.provider || "",
    name: pixel?.name || "",
    pixelId: pixel?.pixelId || "",
    eventName: pixel?.eventName || "",
    customCode: pixel?.customCode || "",
    parameters: pixel?.parameters || {},
    active: pixel?.active ?? true
  });

  const [paramKey, setParamKey] = useState("");
  const [paramValue, setParamValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.provider || !formData.name) return;

    if (pixel) {
      onSave({ ...pixel, ...formData } as ConversionPixel);
    } else {
      onSave(formData as Omit<ConversionPixel, 'id'>);
    }
  };

  const addParameter = () => {
    if (paramKey && paramValue) {
      setFormData(prev => ({
        ...prev,
        parameters: { ...prev.parameters, [paramKey]: paramValue }
      }));
      setParamKey("");
      setParamValue("");
    }
  };

  const removeParameter = (key: string) => {
    setFormData(prev => ({
      ...prev,
      parameters: Object.fromEntries(
        Object.entries(prev.parameters || {}).filter(([k]) => k !== key)
      )
    }));
  };

  const provider = PIXEL_PROVIDERS.find(p => p.value === formData.provider);
  const availableEvents = formData.provider ? COMMON_EVENTS[formData.provider as keyof typeof COMMON_EVENTS] || [] : [];

  return (
    <Card className="p-6">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-lg">
          {pixel ? "Edit Pixel" : "Add Conversion Pixel"}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="provider">Provider</Label>
              <Select
                value={formData.provider}
                onValueChange={(value) => setFormData(prev => ({ ...prev, provider: value, eventName: "" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {PIXEL_PROVIDERS.map(provider => (
                    <SelectItem key={provider.value} value={provider.value}>
                      <div className="flex items-center gap-2">
                        <span>{provider.icon}</span>
                        <span>{provider.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="name">Pixel Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Facebook Main Pixel"
                required
              />
            </div>
          </div>

          {formData.provider && formData.provider !== "custom" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pixelId">
                  {formData.provider === "facebook" ? "Pixel ID" : 
                   formData.provider === "google_analytics" ? "Measurement ID" :
                   formData.provider === "google_ads" ? "Conversion ID" : "Pixel ID"}
                </Label>
                <Input
                  id="pixelId"
                  value={formData.pixelId}
                  onChange={(e) => setFormData(prev => ({ ...prev, pixelId: e.target.value }))}
                  placeholder={
                    formData.provider === "facebook" ? "1234567890123456" :
                    formData.provider === "google_analytics" ? "G-XXXXXXXXXX" :
                    formData.provider === "google_ads" ? "AW-XXXXXXXXX" : "Enter ID"
                  }
                />
              </div>

              {availableEvents.length > 0 && (
                <div>
                  <Label htmlFor="eventName">Event Name</Label>
                  <Select
                    value={formData.eventName}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, eventName: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select event" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableEvents.map(event => (
                        <SelectItem key={event} value={event}>
                          {event}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {formData.provider === "custom" && (
            <div>
              <Label htmlFor="customCode">Custom Pixel Code</Label>
              <Textarea
                id="customCode"
                value={formData.customCode}
                onChange={(e) => setFormData(prev => ({ ...prev, customCode: e.target.value }))}
                placeholder="Enter your custom pixel code (JavaScript)"
                rows={6}
                className="font-mono text-sm"
              />
            </div>
          )}

          <div>
            <Label className="text-sm font-medium">Custom Parameters</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Parameter name"
                  value={paramKey}
                  onChange={(e) => setParamKey(e.target.value)}
                />
                <Input
                  placeholder="Parameter value"
                  value={paramValue}
                  onChange={(e) => setParamValue(e.target.value)}
                />
                <Button type="button" onClick={addParameter} disabled={!paramKey || !paramValue}>
                  Add
                </Button>
              </div>
              
              {formData.parameters && Object.keys(formData.parameters).length > 0 && (
                <div className="space-y-1">
                  {Object.entries(formData.parameters).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 p-2 bg-muted rounded">
                      <span className="flex-1 font-mono text-sm">{key}: {value}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeParameter(key)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.provider || !formData.name}>
              {pixel ? "Update Pixel" : "Add Pixel"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}