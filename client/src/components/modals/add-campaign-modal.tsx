import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useState } from "react";
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
import { Upload, X } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertCampaignSchema, type Campaign, type Question } from "@shared/schema";

// Form schema based on the actual database schema
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
  targeting: z.record(z.boolean()).optional(),
  dayParting: z.record(z.array(z.boolean())).optional(),
});

interface AddCampaignModalProps {
  open: boolean;
  onClose: () => void;
  editingCampaign?: Campaign | null;
}

export default function AddCampaignModal({ open, onClose, editingCampaign }: AddCampaignModalProps) {
  const { toast } = useToast();
  const [uploadedImage, setUploadedImage] = useState<string | null>(editingCampaign?.imageUrl || null);
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
      targeting: {},
      dayParting: dayPartingGrid,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: z.infer<typeof formSchema>) => {
      const formData = {
        ...data,
        cpcBid: parseFloat(data.cpcBid),
        dayParting: dayPartingMode === 'all-day' ? undefined : dayPartingGrid,
      };
      return apiRequest("/api/campaigns", "POST", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({ title: "Campaign created successfully" });
      onClose();
      form.reset();
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
    mutationFn: (data: z.infer<typeof formSchema>) => {
      const formData = {
        ...data,
        cpcBid: parseFloat(data.cpcBid),
        dayParting: dayPartingMode === 'all-day' ? undefined : dayPartingGrid,
      };
      return apiRequest(`/api/campaigns/${editingCampaign!.id}`, "PATCH", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({ title: "Campaign updated successfully" });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error updating campaign",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (editingCampaign) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const toggleDayPartingSlot = (day: string, hour: number) => {
    setDayPartingGrid(prev => ({
      ...prev,
      [day]: prev[day].map((selected, index) => 
        index === hour ? !selected : selected
      )
    }));
  };

  const toggleEntireDay = (day: string) => {
    const allSelected = dayPartingGrid[day].every(slot => slot);
    setDayPartingGrid(prev => ({
      ...prev,
      [day]: new Array(24).fill(!allSelected)
    }));
  };

  const hours = Array.from({ length: 24 }, (_, i) => 
    i.toString().padStart(2, '0') + ':00'
  );

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingCampaign ? "Edit Campaign" : "Add New Campaign"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

              <FormField
                control={form.control}
                name="device"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operating System</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select OS" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">All Operating Systems</SelectItem>
                        <SelectItem value="ios">iOS</SelectItem>
                        <SelectItem value="android">Android</SelectItem>
                        <SelectItem value="windows">Windows</SelectItem>
                        <SelectItem value="macos">macOS</SelectItem>
                        <SelectItem value="linux">Linux</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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

            {/* Question Targeting Section */}
            <div>
              <FormLabel className="text-base">Question Targeting</FormLabel>
              <p className="text-sm text-muted-foreground mb-4">
                Select which questions this campaign should target. Leave empty to target all users.
              </p>
              <div className="max-h-64 overflow-y-auto border rounded-lg p-4 space-y-3">
                {questions?.map((question) => (
                  <div key={question.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={`question-${question.id}`}
                      checked={form.watch("targeting")?.[`question_${question.id}`] || false}
                      onCheckedChange={(checked) => {
                        const targeting = form.getValues("targeting") || {};
                        form.setValue("targeting", {
                          ...targeting,
                          [`question_${question.id}`]: !!checked,
                        });
                      }}
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={`question-${question.id}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {question.text}
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Type: {question.type} • Priority: {question.priority}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Day Parting Section */}
            <div>
              <FormLabel className="text-base">Day Parting</FormLabel>
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
                <div className="border rounded-lg p-4">
                  <div className="grid gap-1 text-xs" style={{gridTemplateColumns: 'auto repeat(24, 1fr)'}}>
                    {/* Header row with hours */}
                    <div></div>
                    {hours.map(hour => (
                      <div key={hour} className="text-center font-mono text-gray-500 rotate-45 origin-center">
                        {hour.slice(0, 2)}
                      </div>
                    ))}
                    
                    {/* Day rows */}
                    {days.map((day, dayIndex) => (
                      <div key={day} className="contents">
                        <div className="flex items-center justify-between pr-2">
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
                            className={`aspect-square w-full rounded-sm border transition-colors ${
                              isSelected 
                                ? 'bg-blue-500 border-blue-600' 
                                : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
                            }`}
                            onClick={() => toggleDayPartingSlot(day, hour)}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4">
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

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending 
                  ? "Saving..." 
                  : editingCampaign ? "Update Campaign" : "Create Campaign"
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}