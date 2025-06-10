import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertCampaignSchema, type Campaign, type Question } from "@shared/schema";
import { Globe, Target, X, Plus, Minus, ChevronLeft, ChevronRight, Upload, Image as ImageIcon } from "lucide-react";

const campaignFormSchema = insertCampaignSchema;

type CampaignFormData = z.infer<typeof campaignFormSchema>;

interface SelectedQuestion {
  questionId: number;
  answers: string[];
}

interface AddCampaignModalProps {
  open: boolean;
  onClose: () => void;
  editingCampaign?: Campaign | null;
}

export default function AddCampaignModal({ open, onClose, editingCampaign }: AddCampaignModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedQuestions, setSelectedQuestions] = useState<SelectedQuestion[]>([]);
  const [targetingLogic, setTargetingLogic] = useState<"AND" | "OR">("OR");
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Day parting state
  const [dayPartingGrid, setDayPartingGrid] = useState<{[key: string]: boolean[]}>({
    monday: new Array(24).fill(false),
    tuesday: new Array(24).fill(false),
    wednesday: new Array(24).fill(false),
    thursday: new Array(24).fill(false),
    friday: new Array(24).fill(false),
    saturday: new Array(24).fill(false),
    sunday: new Array(24).fill(false),
  });

  // Drag state for day-parting grid
  const [isDraggingGrid, setIsDraggingGrid] = useState(false);
  const [dragMode, setDragMode] = useState<'select' | 'deselect'>('select');

  // Global mouse event handlers for drag functionality
  useEffect(() => {
    const handleMouseUp = () => setIsDraggingGrid(false);
    
    if (isDraggingGrid) {
      document.addEventListener('mouseup', handleMouseUp);
      return () => document.removeEventListener('mouseup', handleMouseUp);
    }
  }, [isDraggingGrid]);

  // Convert grid to JSON format
  const gridToJson = (grid: {[key: string]: boolean[]}) => {
    const result: {[key: string]: number[]} = {};
    Object.entries(grid).forEach(([day, hours]) => {
      const activeHours: number[] = [];
      for (let i = 0; i < hours.length; i++) {
        if (hours[i]) activeHours.push(i);
      }
      if (activeHours.length > 0) {
        result[day] = activeHours;
      }
    });
    return Object.keys(result).length > 0 ? JSON.stringify(result) : "";
  };

  // Convert JSON to grid format
  const jsonToGrid = (jsonStr: string) => {
    try {
      if (!jsonStr) return dayPartingGrid;
      const parsed = JSON.parse(jsonStr);
      const newGrid = { ...dayPartingGrid };
      Object.entries(newGrid).forEach(([day, hours]) => {
        hours.fill(false);
        if (parsed[day] && Array.isArray(parsed[day])) {
          parsed[day].forEach((hour: number) => {
            if (hour >= 0 && hour < 24) {
              hours[hour] = true;
            }
          });
        }
      });
      return newGrid;
    } catch {
      return dayPartingGrid;
    }
  };
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      name: "",
      vertical: "",
      campaignType: "standard",
      url: "",
      cpcBid: "1.00",
      leadBid: null,
      companyName: "",
      webhookUrl: "",
      leadTerms: "",
      imageUrl: "",
      active: true,
      frequency: 1,
      convertOnce: false,
      ageMin: null,
      ageMax: null,
      gender: null,
      states: null,
      device: null,
      targeting: null,
      dayParting: null,
      dailyBudget: null,
      conversionPixels: null,
    },
  });

  const { data: questions } = useQuery({
    queryKey: ["/api/questions"],
  });

  useEffect(() => {
    if (editingCampaign) {
      const campaignData = {
        ...editingCampaign,
        startDate: editingCampaign.startDate ? new Date(editingCampaign.startDate).toISOString().split('T')[0] : "",
        endDate: editingCampaign.endDate ? new Date(editingCampaign.endDate).toISOString().split('T')[0] : "",
      };
      form.reset(campaignData);
      
      try {
        const targetQuestions = editingCampaign.targetQuestions ? JSON.parse(editingCampaign.targetQuestions as string) : [];
        if (Array.isArray(targetQuestions)) {
          setSelectedQuestions(targetQuestions);
        }
      } catch (error) {
        console.error("Error parsing target questions:", error);
      }

      // Load day-parting data into visual grid
      if (editingCampaign.dayParting) {
        const newGrid = jsonToGrid(editingCampaign.dayParting as string);
        setDayPartingGrid(newGrid);
      }
    } else {
      form.reset({
        name: "",
        description: "",
        url: "",
        imageUrl: "",
        status: "paused",
        bidPrice: "1.00",
        dailyBudget: "100.00",
        totalBudget: "1000.00",
        startDate: new Date().toISOString().split('T')[0],
        endDate: "",
        targetAudience: "all",

      });
      setSelectedQuestions([]);
      setCurrentStep(1);
    }
  }, [editingCampaign, form, open]);

  const createMutation = useMutation({
    mutationFn: (data: CampaignFormData) => apiRequest("/api/campaigns", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({
        title: "Success",
        description: "Campaign created successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create campaign",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CampaignFormData) => 
      apiRequest(`/api/campaigns/${editingCampaign?.id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({
        title: "Success",
        description: "Campaign updated successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update campaign",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CampaignFormData) => {
    console.log('🚀 FORM SUBMIT TRIGGERED - Current step:', currentStep);
    console.log('Form submission started with data:', data);
    console.log('Form errors:', form.formState.errors);
    
    // Only allow submission on step 2
    if (currentStep !== 2) {
      console.log('❌ Blocking submission - not on step 2');
      return;
    }
    
    // Check for form validation errors
    if (Object.keys(form.formState.errors).length > 0) {
      console.log('Form has validation errors, preventing submission');
      toast({
        title: "Validation Error",
        description: "Please check all required fields",
        variant: "destructive",
      });
      return;
    }

    // Prepare targeting data based on selected questions
    const targeting = selectedQuestions.length > 0 ? {
      questions: selectedQuestions.map(sq => ({
        questionId: sq.questionId,
        targetAnswers: sq.answers
      })),
      logic: targetingLogic
    } : null;

    // Only include fields that exist in the database schema
    const campaignData = {
      name: data.name,
      vertical: data.vertical,
      url: data.url,
      cpcBid: data.cpcBid,
      imageUrl: data.imageUrl || null,
      active: data.active,
      frequency: data.frequency,
      convertOnce: data.convertOnce,
      ageMin: data.ageMin || null,
      ageMax: data.ageMax || null,
      gender: data.gender || null,
      states: data.states || null,
      device: data.device || null,
      targeting: targeting,
      dayParting: data.dayParting || null,
      dailyBudget: data.dailyBudget || null,
      conversionPixels: data.conversionPixels || null,
    };

    console.log('✅ Proceeding with campaign submission:', campaignData);

    if (editingCampaign) {
      updateMutation.mutate(campaignData);
    } else {
      createMutation.mutate(campaignData);
    }
  };

  const nextStep = () => {
    console.log('🔄 NEXT STEP CLICKED - Current step:', currentStep);
    
    // Validate only required fields for step 1 before moving to step 2
    const requiredFields = ['name', 'url', 'vertical', 'cpcBid'];
    const isStep1Valid = requiredFields.every(field => {
      const value = form.getValues(field as any);
      return value && value.toString().trim() !== '';
    });

    if (!isStep1Valid) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields before proceeding",
        variant: "destructive",
      });
      return;
    }

    if (currentStep < 2) {
      console.log('✅ Moving to step 2');
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Campaign Details</h3>
        <p className="text-sm text-muted-foreground">
          Set up basic campaign information and settings
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Campaign Name *</FormLabel>
              <FormControl>
                <Input placeholder="Enter campaign name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="campaignType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Campaign Type</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex flex-row gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="standard" id="standard" />
                    <Label htmlFor="standard">Standard (Click-based)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="lead" id="lead" />
                    <Label htmlFor="lead">Lead Campaign</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormDescription>
                Standard campaigns pay per click. Lead campaigns pay per qualified lead with yes/no responses.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.watch("campaignType") === "standard" && (
          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Landing URL *</FormLabel>
                <FormControl>
                  <Input placeholder="https://example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {form.watch("campaignType") === "lead" && (
          <>
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Company Inc." {...field} />
                  </FormControl>
                  <FormDescription>
                    This company name will be shown to users when they agree to be contacted.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="webhookUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Webhook URL *</FormLabel>
                  <FormControl>
                    <Input placeholder="https://your-system.com/webhook/leads" {...field} />
                  </FormControl>
                  <FormDescription>
                    Leads will be sent to this endpoint via POST requests.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="leadTerms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lead Terms</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="By clicking Yes, you agree to be contacted by our company regarding our products and services."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional terms shown to users before they respond yes/no.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}



        <FormField
          control={form.control}
          name="vertical"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vertical *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vertical" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="automotive">Automotive</SelectItem>
                  <SelectItem value="travel">Travel</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
                  <SelectItem value="real_estate">Real Estate</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.watch("campaignType") === "standard" && (
          <FormField
            control={form.control}
            name="cpcBid"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CPC Bid ($) *</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="1.00" {...field} />
                </FormControl>
                <FormDescription>
                  Amount paid per click on your ad.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {form.watch("campaignType") === "lead" && (
          <FormField
            control={form.control}
            name="leadBid"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lead Bid ($) *</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="5.00" {...field} />
                </FormControl>
                <FormDescription>
                  Amount paid per qualified lead (users who click "Yes").
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}



        <FormField
          control={form.control}
          name="dailyBudget"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Daily Budget ($)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="100.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />



        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem className="col-span-2">
              <FormLabel>Ad Image</FormLabel>
              <FormControl>
                <Tabs defaultValue="upload" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload">Upload File</TabsTrigger>
                    <TabsTrigger value="url">Image URL</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="upload" className="mt-4">
                    <div
                      className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        isDraggingFile
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingFile(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setIsDraggingFile(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingFile(false);
                        const files = e.dataTransfer.files;
                        if (files[0]) {
                          const imageUrl = URL.createObjectURL(files[0]);
                          field.onChange(imageUrl);
                        }
                      }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const imageUrl = URL.createObjectURL(file);
                            field.onChange(imageUrl);
                          }
                        }}
                      />
                      
                      {field.value && field.value.startsWith('blob:') ? (
                        <div className="space-y-4">
                          <img 
                            src={field.value} 
                            alt="Ad preview" 
                            className="max-w-full max-h-48 mx-auto object-contain rounded"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <div className="text-sm text-gray-500">
                            Click to change image
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              field.onChange("");
                            }}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Remove Image
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex flex-col items-center space-y-2">
                            <Upload className="h-12 w-12 text-gray-400" />
                            <div className="text-lg font-medium text-gray-700">
                              Drop your image here
                            </div>
                            <div className="text-sm text-gray-500">
                              or click to browse files
                            </div>
                          </div>
                          <div className="text-xs text-gray-400">
                            Supports JPG, PNG, GIF up to 10MB
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="url" className="mt-4">
                    <div className="space-y-4">
                      <Input 
                        placeholder="https://example.com/image.jpg" 
                        value={field.value && !field.value.startsWith('blob:') ? field.value : ""}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                      {field.value && !field.value.startsWith('blob:') && (
                        <div className="space-y-2">
                          <img 
                            src={field.value} 
                            alt="Ad preview" 
                            className="max-w-full max-h-48 mx-auto object-contain border rounded"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => field.onChange("")}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Clear URL
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Campaign Description</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Internal description for campaign management and tracking purposes..." 
                className="min-h-[100px]"
                {...field} 
              />
            </FormControl>
            <FormDescription>
              This description is for internal use only - it helps identify and manage the campaign but is not shown to users.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Audience Targeting</h3>
        <p className="text-sm text-muted-foreground">
          Configure demographic, geographic, device, and behavioral targeting options
        </p>
      </div>

      {/* Demographics Targeting */}
      <div className="border rounded-lg p-4 bg-slate-50">
        <h4 className="font-medium mb-3">Demographics</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="ageMin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Min Age</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="18" 
                    value={field.value || ''} 
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="ageMax"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Age</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="65" 
                    value={field.value || ''} 
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="All genders" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="all">All Genders</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Geographic Targeting */}
      <div className="border rounded-lg p-4 bg-slate-50">
        <h4 className="font-medium mb-3">Geographic Targeting</h4>
        <FormField
          control={form.control}
          name="states"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target States (comma-separated)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="CA, NY, TX, FL" 
                  value={field.value || ''} 
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <FormDescription>
                Leave empty to target all states
              </FormDescription>
            </FormItem>
          )}
        />
      </div>

      {/* Device Targeting */}
      <div className="border rounded-lg p-4 bg-slate-50">
        <h4 className="font-medium mb-3">Device Targeting</h4>
        <FormField
          control={form.control}
          name="device"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Device Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="All devices" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="all">All Devices</SelectItem>
                  <SelectItem value="desktop">Desktop</SelectItem>
                  <SelectItem value="mobile">Mobile</SelectItem>
                  <SelectItem value="tablet">Tablet</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      </div>

      {/* Day Parting */}
      <div className="border rounded-lg p-4 bg-slate-50">
        <h4 className="font-medium mb-3">Day Parting</h4>
        <FormField
          control={form.control}
          name="dayParting"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Active Hours</FormLabel>
              <FormControl>
                <div className="space-y-4">
                  {/* Quick selection buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newGrid = { ...dayPartingGrid };
                        Object.keys(newGrid).forEach(day => {
                          if (['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(day)) {
                            for (let i = 9; i < 17; i++) {
                              newGrid[day][i] = true;
                            }
                          }
                        });
                        setDayPartingGrid(newGrid);
                        field.onChange(gridToJson(newGrid));
                      }}
                    >
                      Business Hours
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newGrid = { ...dayPartingGrid };
                        Object.keys(newGrid).forEach(day => {
                          for (let i = 0; i < 24; i++) {
                            newGrid[day][i] = true;
                          }
                        });
                        setDayPartingGrid(newGrid);
                        field.onChange(gridToJson(newGrid));
                      }}
                    >
                      24/7
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newGrid = { ...dayPartingGrid };
                        Object.keys(newGrid).forEach(day => {
                          newGrid[day].fill(false);
                        });
                        setDayPartingGrid(newGrid);
                        field.onChange("");
                      }}
                    >
                      Clear All
                    </Button>
                  </div>

                  {/* Time grid */}
                  <div className="border rounded-md bg-white">
                    {/* Hour header */}
                    <div className="grid grid-cols-25 gap-0 text-xs">
                      <div className="p-1 font-medium"></div>
                      {Array.from({ length: 24 }, (_, i) => (
                        <div key={i} className="p-1 text-center font-mono text-gray-500">
                          {i.toString().padStart(2, '0')}
                        </div>
                      ))}
                    </div>

                    {/* Day rows */}
                    {Object.entries(dayPartingGrid).map(([day, hours]) => (
                      <div key={day} className="grid grid-cols-25 gap-0 border-t">
                        <div className="p-2 text-sm font-medium capitalize bg-gray-50 flex items-center">
                          {day.slice(0, 3)}
                        </div>
                        {hours.map((isActive, hour) => (
                          <button
                            key={hour}
                            type="button"
                            className={`h-8 w-full border-l transition-colors ${
                              isActive 
                                ? 'bg-blue-500 hover:bg-blue-600' 
                                : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setIsDraggingGrid(true);
                              setDragMode(isActive ? 'deselect' : 'select');
                              const newGrid = { ...dayPartingGrid };
                              newGrid[day][hour] = !newGrid[day][hour];
                              setDayPartingGrid(newGrid);
                              field.onChange(gridToJson(newGrid));
                            }}
                            onMouseEnter={() => {
                              if (isDraggingGrid) {
                                const newGrid = { ...dayPartingGrid };
                                newGrid[day][hour] = dragMode === 'select';
                                setDayPartingGrid(newGrid);
                                field.onChange(gridToJson(newGrid));
                              }
                            }}
                            onMouseUp={() => {
                              setIsDraggingGrid(false);
                            }}
                            onClick={() => {
                              if (!isDraggingGrid) {
                                const newGrid = { ...dayPartingGrid };
                                newGrid[day][hour] = !newGrid[day][hour];
                                setDayPartingGrid(newGrid);
                                field.onChange(gridToJson(newGrid));
                              }
                            }}
                          />
                        ))}
                      </div>
                    ))}
                  </div>

                  <FormDescription>
                    Click on time slots to toggle active hours. Blue = active, gray = inactive.
                  </FormDescription>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Question-Based Targeting */}
      <div className="border rounded-lg p-4 bg-slate-50">
        <h4 className="font-medium mb-3">Question-Based Targeting</h4>
        <RadioGroup
          value={selectedQuestions.length > 0 ? 'specific' : 'broad'}
          onValueChange={(value) => {
            if (value === 'broad') {
              setSelectedQuestions([]);
            }
          }}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="broad" id="broad" />
            <Label htmlFor="broad" className="font-normal">
              Broad Targeting - Target all users regardless of their responses
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="specific" id="specific" />
            <Label htmlFor="specific" className="font-normal">
              Specific Targeting - Target users based on their responses to selected questions
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Question Selection for Specific Targeting */}
      {selectedQuestions.length > 0 ? (
        <div className="space-y-4">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Available Questions */}
            <div className="lg:col-span-2">
              <h4 className="font-medium mb-3">Available Attributes</h4>
              <div className="border rounded-lg">
                <div className="bg-gray-50 px-4 py-2 border-b">
                  <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-600">
                    <div className="col-span-4">Attribute Name</div>
                    <div className="col-span-2">Actions</div>
                    <div className="col-span-4">Definition</div>
                    <div className="col-span-2">ID</div>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {questions?.map((question: Question) => {
                    const isSelected = selectedQuestions.some(q => q.questionId === question.id);
                    
                    return (
                      <div key={question.id} className="px-4 py-3 border-b last:border-b-0 hover:bg-gray-50">
                        <div className="grid grid-cols-12 gap-2 items-start">
                          <div className="col-span-4">
                            <div className="font-medium text-sm">{question.text}</div>
                            <div className="text-xs text-gray-500">
                              {question.type} • Priority: {question.priority}
                            </div>
                          </div>
                          
                          <div className="col-span-2">
                            <Button
                              type="button"
                              variant={isSelected ? "destructive" : "outline"}
                              size="sm"
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedQuestions(prev => prev.filter(q => q.questionId !== question.id));
                                } else {
                                  setSelectedQuestions(prev => [
                                    ...prev,
                                    { questionId: question.id, answers: [] }
                                  ]);
                                }
                              }}
                            >
                              {isSelected ? "Remove" : "Add"}
                            </Button>
                          </div>
                          
                          <div className="col-span-4">
                            <div className="text-sm">{"No description available"}</div>
                          </div>
                          
                          <div className="col-span-2">
                            <div className="text-xs text-gray-500">#{question.id}</div>
                          </div>
                        </div>
                        
                        {isSelected && question.options && (
                          <div className="mt-3 pl-4 border-l-2 border-blue-200">
                            <div className="text-sm font-medium mb-2">Select target answers:</div>
                            <div className="flex flex-wrap gap-2">
                              {question.options.map((option: string, idx: number) => {
                                const selectedQuestion = selectedQuestions.find(q => q.questionId === question.id);
                                const isAnswerSelected = selectedQuestion?.answers.includes(option);
                                
                                return (
                                  <Button
                                    key={idx}
                                    type="button"
                                    variant={isAnswerSelected ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => {
                                      setSelectedQuestions(prev => prev.map(q => {
                                        if (q.questionId === question.id) {
                                          const newAnswers = isAnswerSelected
                                            ? q.answers.filter(a => a !== option)
                                            : [...q.answers, option];
                                          return { ...q, answers: newAnswers };
                                        }
                                        return q;
                                      }));
                                    }}
                                  >
                                    {option}
                                  </Button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Selected Questions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Selected Attributes ({selectedQuestions.length})</h4>
              <div className="flex items-center gap-2">
                <Label htmlFor="targetingLogic" className="text-sm">Logic:</Label>
                <Select value={targetingLogic} onValueChange={(value: "AND" | "OR") => setTargetingLogic(value)}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AND">AND</SelectItem>
                    <SelectItem value="OR">OR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="border rounded-lg p-4 bg-slate-50">
              {selectedQuestions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No attributes selected. Campaign will use broad targeting.
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedQuestions.map((selectedQ) => {
                    const question = questions?.find((q: Question) => q.id === selectedQ.questionId);
                    if (!question) return null;
                    
                    return (
                      <div key={selectedQ.questionId} className="flex items-center justify-between p-3 bg-white rounded border">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{question.text}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {selectedQ.answers.length > 0 
                              ? `Target answers: ${selectedQ.answers.join(', ')}`
                              : 'All answers accepted'
                            }
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedQuestions(prev => prev.filter(q => q.questionId !== selectedQ.questionId))}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                  
                  <div className="text-xs text-muted-foreground mt-3 p-2 bg-blue-50 rounded">
                    {targetingLogic === 'AND' 
                      ? 'Users must match ALL selected attributes' 
                      : 'Users must match ANY of the selected attributes'
                    }
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed">
          <Globe className="h-12 w-12 mx-auto text-blue-500 mb-3" />
          <h4 className="font-medium text-lg mb-2">Broad Targeting Enabled</h4>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            This campaign will target all users regardless of their questionnaire responses. 
            Great for general awareness campaigns or when you want maximum reach.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => {
              if (questions && questions.length > 0) {
                setSelectedQuestions([{ questionId: questions[0].id, answers: [] }]);
              }
            }}
          >
            <Target className="h-4 w-4 mr-2" />
            Switch to Specific Targeting
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingCampaign ? "Edit Campaign" : "Create New Campaign"} - Step {currentStep} of 2
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}

            <div className="flex justify-between pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <div className="flex gap-2">
                {currentStep < 2 ? (
                  <Button type="button" onClick={nextStep}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button 
                    type="button"
                    onClick={() => {
                      console.log('Create Campaign button clicked');
                      onSubmit(form.getValues());
                    }}
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingCampaign ? "Update Campaign" : "Create Campaign"}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}