import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useState, useEffect } from "react";
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Upload, X, ArrowRight, ArrowLeft } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertCampaignSchema, type Campaign, type Question } from "@shared/schema";

// Simplified form schema
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  vertical: z.string().min(1, "Vertical is required"),
  ageMin: z.number().optional(),
  ageMax: z.number().optional(),
  gender: z.string().optional(),
  device: z.string().optional(),
  states: z.string().optional(),
  cpcBid: z.string().min(1, "CPC bid is required"),
  imageUrl: z.string().optional(),
  url: z.string().min(1, "URL is required"),
  active: z.boolean(),
  frequency: z.number().default(1),
});

interface AddCampaignModalProps {
  open: boolean;
  onClose: () => void;
  editingCampaign?: Campaign | null;
}

export default function AddCampaignModal({ open, onClose, editingCampaign }: AddCampaignModalProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedImage, setUploadedImage] = useState<string | null>(editingCampaign?.imageUrl || null);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [selectedOS, setSelectedOS] = useState<string[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
  
  // Day parting state
  const [dayPartingMode, setDayPartingMode] = useState<'all-day' | 'custom'>('all-day');
  const [dayPartingGrid, setDayPartingGrid] = useState<Record<string, boolean[]>>({
    monday: new Array(24).fill(false),
    tuesday: new Array(24).fill(false),
    wednesday: new Array(24).fill(false),
    thursday: new Array(24).fill(false),
    friday: new Array(24).fill(false),
    saturday: new Array(24).fill(false),
    sunday: new Array(24).fill(false),
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(false);

  const { data: questions } = useQuery<Question[]>({
    queryKey: ["/api/questions"],
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: editingCampaign?.name || "",
      vertical: editingCampaign?.vertical || "",
      ageMin: editingCampaign?.ageMin || undefined,
      ageMax: editingCampaign?.ageMax || undefined,
      gender: editingCampaign?.gender || "all",
      device: editingCampaign?.device || "all",
      states: editingCampaign?.states || "",
      cpcBid: editingCampaign?.cpcBid?.toString() || "0.00",
      imageUrl: editingCampaign?.imageUrl || "",
      url: editingCampaign?.url || "",
      active: editingCampaign?.active ?? true,
      frequency: editingCampaign?.frequency || 1,
    },
  });

  // EST time labels (UTC-5)
  const estHours = Array.from({ length: 24 }, (_, i) => {
    const estHour = (i - 5 + 24) % 24;
    return `${estHour.toString().padStart(2, '0')}:00`;
  });

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const deviceOptions = [
    { id: 'mobile', label: 'Mobile' },
    { id: 'tablet', label: 'Tablet' },
    { id: 'desktop', label: 'Desktop' },
    { id: 'tv', label: 'Smart TV' },
  ];

  const osOptions = [
    { id: 'ios', label: 'iOS' },
    { id: 'android', label: 'Android' },
    { id: 'windows', label: 'Windows' },
    { id: 'macos', label: 'macOS' },
    { id: 'linux', label: 'Linux' },
  ];

  const createMutation = useMutation({
    mutationFn: (data: any) => {
      const formData = {
        ...data,
        cpcBid: parseFloat(data.cpcBid),
        targeting: selectedQuestions.length > 0 ? 
          selectedQuestions.reduce((acc, qId) => ({ ...acc, [`question_${qId}`]: true }), {}) : 
          undefined,
        dayParting: dayPartingMode === 'all-day' ? undefined : dayPartingGrid,
        device: selectedDevices.length > 0 ? selectedDevices.join(',') : 'all',
        operatingSystem: selectedOS.length > 0 ? selectedOS.join(',') : 'all',
      };
      return apiRequest("/api/campaigns", "POST", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({ title: "Campaign created successfully" });
      onClose();
      form.reset();
      setCurrentStep(1);
    },
    onError: (error: any) => {
      toast({
        title: "Error creating campaign",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => {
      const formData = {
        ...data,
        cpcBid: parseFloat(data.cpcBid),
        targeting: selectedQuestions.length > 0 ? 
          selectedQuestions.reduce((acc, qId) => ({ ...acc, [`question_${qId}`]: true }), {}) : 
          undefined,
        dayParting: dayPartingMode === 'all-day' ? undefined : dayPartingGrid,
        device: selectedDevices.length > 0 ? selectedDevices.join(',') : 'all',
        operatingSystem: selectedOS.length > 0 ? selectedOS.join(',') : 'all',
      };
      return apiRequest(`/api/campaigns/${editingCampaign!.id}`, "PATCH", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({ title: "Campaign updated successfully" });
      onClose();
      setCurrentStep(1);
    },
    onError: (error: any) => {
      toast({
        title: "Error updating campaign",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Day parting functions
  const handleSlotMouseDown = (day: string, hour: number) => {
    const newValue = !dayPartingGrid[day][hour];
    setIsDragging(true);
    setDragValue(newValue);
    setDayPartingGrid(prev => ({
      ...prev,
      [day]: prev[day].map((selected, index) => 
        index === hour ? newValue : selected
      )
    }));
  };

  const handleSlotMouseEnter = (day: string, hour: number) => {
    if (isDragging) {
      setDayPartingGrid(prev => ({
        ...prev,
        [day]: prev[day].map((selected, index) => 
          index === hour ? dragValue : selected
        )
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const toggleEntireDay = (day: string) => {
    const allSelected = dayPartingGrid[day].every(slot => slot);
    setDayPartingGrid(prev => ({
      ...prev,
      [day]: new Array(24).fill(!allSelected)
    }));
  };

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (currentStep === 1) {
      setCurrentStep(2);
      return;
    }
    
    if (editingCampaign) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Campaign Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter campaign name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="vertical"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vertical</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vertical" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="energy">Energy</SelectItem>
                  <SelectItem value="travel">Travel</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  value={field.value || ""}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                />
              </FormControl>
              <FormMessage />
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
                  value={field.value || ""}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gender</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Device Targeting */}
      <div>
        <FormLabel className="text-base">Device Targeting</FormLabel>
        <p className="text-sm text-muted-foreground mb-3">Select device types to target</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {deviceOptions.map((device) => (
            <div key={device.id} className="flex items-center space-x-2">
              <Checkbox
                id={`device-${device.id}`}
                checked={selectedDevices.includes(device.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedDevices([...selectedDevices, device.id]);
                  } else {
                    setSelectedDevices(selectedDevices.filter(d => d !== device.id));
                  }
                }}
              />
              <label htmlFor={`device-${device.id}`} className="text-sm cursor-pointer">
                {device.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Operating System Targeting */}
      <div>
        <FormLabel className="text-base">Operating System Targeting</FormLabel>
        <p className="text-sm text-muted-foreground mb-3">Select operating systems to target</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {osOptions.map((os) => (
            <div key={os.id} className="flex items-center space-x-2">
              <Checkbox
                id={`os-${os.id}`}
                checked={selectedOS.includes(os.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedOS([...selectedOS, os.id]);
                  } else {
                    setSelectedOS(selectedOS.filter(o => o !== os.id));
                  }
                }}
              />
              <label htmlFor={`os-${os.id}`} className="text-sm cursor-pointer">
                {os.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      <FormField
        control={form.control}
        name="states"
        render={({ field }) => (
          <FormItem>
            <FormLabel>State Targeting</FormLabel>
            <FormControl>
              <Input
                placeholder="Enter states (e.g., CA, NY, TX) or leave blank for all states"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="cpcBid"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CPC Bid ($)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="frequency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Frequency Cap</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="1"
                  value={field.value || ""}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 1)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="imageUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Campaign Image</FormLabel>
            <FormControl>
              <div className="space-y-4">
                {uploadedImage ? (
                  <div className="relative">
                    <img 
                      src={uploadedImage} 
                      alt="Campaign preview" 
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setUploadedImage(null);
                        field.onChange("");
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-gray-900">
                          Upload campaign image
                        </span>
                        <span className="mt-1 block text-sm text-gray-500">
                          PNG, JPG, GIF up to 10MB
                        </span>
                      </label>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              const result = e.target?.result as string;
                              setUploadedImage(result);
                              field.onChange(result);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Destination URL</FormLabel>
            <FormControl>
              <Input
                placeholder="https://example.com?utm_source=coreg&age={age}&firstname={firstname}"
                {...field}
              />
            </FormControl>
            <p className="text-sm text-slate-500">
              Available variables: {"{age}"}, {"{firstname}"}, {"{lastname}"}, {"{gender}"}, {"{state}"}. ckid= will be auto-appended.
            </p>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Day Parting Section */}
      <div>
        <FormLabel className="text-base">Day Parting (EST)</FormLabel>
        <p className="text-sm text-muted-foreground mb-4">
          Configure when this campaign should run during the week.
        </p>
        
        <RadioGroup
          value={dayPartingMode}
          onValueChange={(value: 'all-day' | 'custom') => setDayPartingMode(value)}
          className="mb-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="all-day" id="all-day" />
            <Label htmlFor="all-day">Run 24/7</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="custom" id="custom" />
            <Label htmlFor="custom">Custom schedule</Label>
          </div>
        </RadioGroup>

        {dayPartingMode === 'custom' && (
          <div className="border rounded-lg p-4" onMouseUp={handleMouseUp}>
            <div className="grid gap-1 text-xs" style={{gridTemplateColumns: 'auto repeat(24, 1fr)'}}>
              {/* Header row with EST hours */}
              <div></div>
              {estHours.map((hour, index) => (
                <div key={hour} className="text-center font-mono text-gray-500 text-[10px] leading-3">
                  {hour.slice(0, 2)}
                </div>
              ))}
              
              {/* Day rows */}
              {days.map((day, dayIndex) => (
                <div key={day} className="contents">
                  <div className="flex items-center justify-between pr-2 py-1">
                    <span className="font-medium text-sm">{dayLabels[dayIndex]}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleEntireDay(day)}
                      className="h-6 px-2 text-xs"
                    >
                      All
                    </Button>
                  </div>
                  {dayPartingGrid[day].map((isSelected, hour) => (
                    <button
                      key={`${day}-${hour}`}
                      type="button"
                      className={`aspect-square w-full rounded-sm border transition-colors cursor-pointer ${
                        isSelected 
                          ? 'bg-blue-500 border-blue-600' 
                          : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
                      }`}
                      onMouseDown={() => handleSlotMouseDown(day, hour)}
                      onMouseEnter={() => handleSlotMouseEnter(day, hour)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <FormField
        control={form.control}
        name="active"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Active Campaign</FormLabel>
              <p className="text-sm text-muted-foreground">
                Campaign will serve ads when enabled
              </p>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Question Targeting</h3>
        <p className="text-sm text-muted-foreground">
          Select attributes and assign to groups
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
              {questions?.map((question) => (
                <div key={question.id} className="px-4 py-3 border-b last:border-b-0 hover:bg-gray-50">
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-4">
                      <div className="font-medium text-sm">{question.text}</div>
                      <div className="text-xs text-gray-500">
                        {question.type} • Priority: {question.priority}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={selectedQuestions.includes(question.id) ? "secondary" : "outline"}
                        onClick={() => {
                          if (selectedQuestions.includes(question.id)) {
                            setSelectedQuestions(selectedQuestions.filter(q => q !== question.id));
                          } else {
                            setSelectedQuestions([...selectedQuestions, question.id]);
                          }
                        }}
                        className="h-8 px-3 text-xs"
                      >
                        {selectedQuestions.includes(question.id) ? "Used" : "Use"}
                      </Button>
                    </div>
                    <div className="col-span-4 text-sm text-gray-600">
                      {question.options && Array.isArray(question.options) 
                        ? `Options: ${question.options.join(', ')}` 
                        : 'Yes/No question'
                      }
                    </div>
                    <div className="col-span-2 text-xs font-mono text-gray-500">
                      {question.id}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Questions */}
        <div>
          <h4 className="font-medium mb-3">Selected Attributes ({selectedQuestions.length})</h4>
          <div className="border rounded-lg p-4 min-h-[200px]">
            {selectedQuestions.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                No attributes selected. Campaign will target all users.
              </p>
            ) : (
              <div className="space-y-2">
                {selectedQuestions.map((questionId) => {
                  const question = questions?.find(q => q.id === questionId);
                  return question ? (
                    <div key={questionId} className="flex items-center justify-between p-2 bg-blue-50 rounded border">
                      <div className="text-sm font-medium truncate flex-1 mr-2">
                        {question.text}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedQuestions(selectedQuestions.filter(q => q !== questionId))}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : null;
                })}
              </div>
            )}
          </div>
        </div>
      </div>
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {currentStep === 1 ? renderStep1() : renderStep2()}

            <div className="flex justify-between pt-6">
              {currentStep === 2 && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCurrentStep(1)}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}
              
              <div className="flex space-x-4 ml-auto">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {currentStep === 1 ? (
                    <>
                      Next: Question Targeting
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  ) : (
                    createMutation.isPending || updateMutation.isPending 
                      ? "Saving..." 
                      : editingCampaign ? "Update Campaign" : "Create Campaign"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}