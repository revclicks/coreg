import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export interface ConversionPixel {
  id: string;
  provider: string;
  name: string;
  url?: string; // For postback URLs
  jsCode?: string; // For JavaScript pixels
  parameters?: Record<string, string>;
  active: boolean;
}

interface ConversionPixelManagerProps {
  pixels: ConversionPixel[];
  onChange: (pixels: ConversionPixel[]) => void;
}

const PIXEL_PROVIDERS = [
  { value: "postback", label: "Postback URL", icon: "🔗" },
  { value: "javascript", label: "JavaScript Pixel", icon: "💻" }
];

export default function ConversionPixelManager({ pixels, onChange }: ConversionPixelManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPixel, setEditingPixel] = useState<ConversionPixel | null>(null);

  const addPixel = (pixel: Omit<ConversionPixel, 'id'>) => {
    const newPixel: ConversionPixel = {
      ...pixel,
      id: `pixel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    onChange([...pixels, newPixel]);
    setShowAddForm(false);
  };

  const updatePixel = (updatedPixel: ConversionPixel) => {
    onChange(pixels.map(p => p.id === updatedPixel.id ? updatedPixel : p));
    setEditingPixel(null);
  };

  const deletePixel = (id: string) => {
    onChange(pixels.filter(p => p.id !== id));
  };

  const togglePixelActive = (id: string) => {
    onChange(pixels.map(p => 
      p.id === id ? { ...p, active: !p.active } : p
    ));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Conversion Pixels ({pixels.length})</h4>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Pixel
        </Button>
      </div>

      {pixels.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              No conversion pixels configured. Add a postback URL or JavaScript pixel to track conversions.
            </p>
          </CardContent>
        </Card>
      )}

      {pixels.map((pixel) => {
        const provider = PIXEL_PROVIDERS.find(p => p.value === pixel.provider);
        return (
          <Card key={pixel.id}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{provider?.icon}</span>
                    <h5 className="font-medium">{pixel.name}</h5>
                    <Badge variant={pixel.active ? "default" : "secondary"}>
                      {pixel.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {provider?.label}
                    {pixel.url && ` - ${pixel.url.substring(0, 50)}${pixel.url.length > 50 ? '...' : ''}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={pixel.active}
                    onCheckedChange={() => togglePixelActive(pixel.id)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingPixel(pixel)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deletePixel(pixel.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

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
  const [formData, setFormData] = useState<Partial<ConversionPixel>>(
    pixel || {
      provider: 'postback',
      name: '',
      url: '',
      jsCode: '',
      parameters: {},
      active: true
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.provider) return;
    
    if (formData.provider === 'postback' && !formData.url) return;
    if (formData.provider === 'javascript' && !formData.jsCode) return;

    if (pixel) {
      onSave({ ...pixel, ...formData } as ConversionPixel);
    } else {
      onSave(formData as Omit<ConversionPixel, 'id'>);
    }
  };

  const updateFormData = (field: keyof ConversionPixel, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {pixel ? "Edit Pixel" : "Add Conversion Pixel"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Pixel Name</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => updateFormData('name', e.target.value)}
                placeholder="e.g., Affiliate Network Pixel"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider">Pixel Type</Label>
              <Select
                value={formData.provider}
                onValueChange={(value) => updateFormData('provider', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PIXEL_PROVIDERS.map((provider) => (
                    <SelectItem key={provider.value} value={provider.value}>
                      {provider.icon} {provider.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.provider === 'postback' && (
            <div className="space-y-2">
              <Label htmlFor="url">Postback URL</Label>
              <Input
                id="url"
                type="url"
                value={formData.url || ''}
                onChange={(e) => updateFormData('url', e.target.value)}
                placeholder="https://tracking.example.com/conversion?clickid={CLICKID}&revenue={REVENUE}"
                required
              />
              <p className="text-xs text-muted-foreground">
                Use variables: {'{CLICKID}'}, {'{REVENUE}'}, {'{SESSION_ID}'}, {'{CAMPAIGN_ID}'}
              </p>
            </div>
          )}

          {formData.provider === 'javascript' && (
            <div className="space-y-2">
              <Label htmlFor="jsCode">JavaScript Code</Label>
              <Textarea
                id="jsCode"
                value={formData.jsCode || ''}
                onChange={(e) => updateFormData('jsCode', e.target.value)}
                placeholder="// Your tracking pixel JavaScript code here
// Available variables: clickId, revenue, sessionId, campaignId
console.log('Conversion tracked:', { clickId, revenue });"
                rows={6}
                required
              />
              <p className="text-xs text-muted-foreground">
                Available variables: clickId, revenue, sessionId, campaignId
              </p>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formData.active || false}
              onCheckedChange={(checked) => updateFormData('active', checked)}
            />
            <Label htmlFor="active">Active</Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {pixel ? "Update Pixel" : "Add Pixel"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}