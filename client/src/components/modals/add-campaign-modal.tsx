import { useState, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertCampaignSchema, type Campaign, type Question } from "@shared/schema";
import { Globe, Target, X, Plus, Minus, ChevronLeft, ChevronRight } from "lucide-react";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      name: "",
      vertical: "",
      url: "",
      cpcBid: "1.00",
      imageUrl: "",
      active: true,
      frequency: 1,
      convertOnce: false,
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
        priority: 5,
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
    // Prepare targeting data based on selected questions
    const targeting = selectedQuestions.length > 0 ? {
      questions: selectedQuestions.map(sq => ({
        questionId: sq.questionId,
        targetAnswers: sq.answers
      })),
      logic: targetingLogic
    } : null;

    const campaignData = {
      ...data,
      targeting: targeting,
    };

    if (editingCampaign) {
      updateMutation.mutate(campaignData);
    } else {
      createMutation.mutate(campaignData);
    }
  };

  const nextStep = () => {
    if (currentStep < 2) {
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

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/image.jpg" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bidPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bid Price ($)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="1.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Priority (1-10)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="1" 
                  max="10" 
                  placeholder="5"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 5)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
            <FormItem>
              <FormLabel>Ad Image</FormLabel>
              <FormControl>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // For demo purposes, create a local URL
                          const imageUrl = URL.createObjectURL(file);
                          field.onChange(imageUrl);
                        }
                      }}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                  <div className="text-sm text-gray-500">
                    Or enter image URL directly:
                  </div>
                  <Input 
                    placeholder="https://example.com/ad-image.jpg" 
                    value={field.value || ""}
                    onChange={field.onChange}
                  />
                  {field.value && (
                    <div className="mt-2">
                      <img 
                        src={field.value} 
                        alt="Ad preview" 
                        className="max-w-xs max-h-32 object-contain border rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
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
                  <Input type="number" placeholder="18" {...field} />
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
                  <Input type="number" placeholder="65" {...field} />
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
                  {...field} 
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
              <FormLabel>Active Hours (JSON format)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder='{"monday": [9, 17], "tuesday": [9, 17], "wednesday": [9, 17], "thursday": [9, 17], "friday": [9, 17]}' 
                  className="min-h-[80px]"
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Specify hours in 24-hour format. Leave empty for all-day targeting.
              </FormDescription>
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                    type="submit" 
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