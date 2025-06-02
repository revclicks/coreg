import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Play, Pause, Trophy, TrendingUp, Users, Target, BarChart3 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ABTestingEngine } from "@/lib/ab-testing";

const experimentFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  testType: z.enum(["campaign", "question"]),
  trafficSplit: z.number().min(0).max(100),
  targetItemId: z.number().min(1, "Select an item to test"),
  variantAName: z.string().min(1, "Variant A name is required"),
  variantBName: z.string().min(1, "Variant B name is required"),
  variantBModifications: z.string().min(1, "Variant B modifications are required")
});

type ExperimentFormData = z.infer<typeof experimentFormSchema>;

export default function ABTesting() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const queryClient = useQueryClient();

  const { data: experiments, isLoading } = useQuery({
    queryKey: ["/api/ab-tests"],
    queryFn: async () => {
      const response = await fetch("/api/ab-tests");
      return response.json();
    },
  });

  const { data: analytics } = useQuery({
    queryKey: ["/api/ab-tests/analytics"],
    queryFn: async () => {
      const response = await fetch("/api/ab-tests/analytics");
      return response.json();
    },
  });

  const { data: campaigns } = useQuery({
    queryKey: ["/api/campaigns"],
    queryFn: async () => {
      const response = await fetch("/api/campaigns");
      return response.json();
    },
  });

  const { data: questions } = useQuery({
    queryKey: ["/api/questions"],
    queryFn: async () => {
      const response = await fetch("/api/questions");
      return response.json();
    },
  });

  const createExperimentMutation = useMutation({
    mutationFn: async (data: ExperimentFormData) => {
      const response = await fetch("/api/ab-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          testType: data.testType,
          trafficSplit: data.trafficSplit,
          status: "draft",
          variants: [
            {
              variant: "A",
              name: data.variantAName,
              campaignId: data.testType === "campaign" ? data.targetItemId : undefined,
              questionId: data.testType === "question" ? data.targetItemId : undefined,
              content: {},
              isControl: true
            },
            {
              variant: "B",
              name: data.variantBName,
              campaignId: data.testType === "campaign" ? data.targetItemId : undefined,
              questionId: data.testType === "question" ? data.targetItemId : undefined,
              content: JSON.parse(data.variantBModifications),
              isControl: false
            }
          ]
        }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ab-tests"] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
  });

  const updateExperimentStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await fetch(`/api/ab-tests/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ab-tests"] });
    },
  });

  const form = useForm<ExperimentFormData>({
    resolver: zodResolver(experimentFormSchema),
    defaultValues: {
      name: "",
      description: "",
      testType: "campaign",
      trafficSplit: 50,
      variantAName: "Control",
      variantBName: "Variant B",
      variantBModifications: "{}"
    },
  });

  const templates = ABTestingEngine.getTestTemplates();

  const handleTemplateSelect = (templateName: string) => {
    const template = templates.find(t => t.name === templateName);
    if (template) {
      form.setValue("name", template.name);
      form.setValue("description", template.description);
      form.setValue("testType", template.type);
      form.setValue("variantAName", template.variants[0].name);
      form.setValue("variantBName", template.variants[1].name);
      setSelectedTemplate(templateName);
    }
  };

  const onSubmit = (data: ExperimentFormData) => {
    createExperimentMutation.mutate(data);
  };

  const handleStatusChange = (experimentId: number, newStatus: string) => {
    updateExperimentStatusMutation.mutate({ id: experimentId, status: newStatus });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'default';
      case 'completed': return 'secondary';
      case 'paused': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Tests</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.activeTests}</div>
              <p className="text-xs text-muted-foreground">
                Currently running
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalTests}</div>
              <p className="text-xs text-muted-foreground">
                All time experiments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.winRate}%</div>
              <p className="text-xs text-muted-foreground">
                Tests with significant results
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Improvement</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.avgImprovement}%</div>
              <p className="text-xs text-muted-foreground">
                Average lift from winners
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Experiments Management */}
      <Card>
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">A/B Test Experiments</h3>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Test
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create A/B Test Experiment</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {/* Template Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Choose Template (Optional)</label>
                    <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template or create custom" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.name} value={template.name}>
                            {template.name} - {template.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Test Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter test name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="testType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Test Type</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="campaign">Campaign Test</SelectItem>
                                <SelectItem value="question">Question Test</SelectItem>
                              </SelectContent>
                            </Select>
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
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe the test hypothesis" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="targetItemId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {form.watch("testType") === "campaign" ? "Campaign" : "Question"} to Test
                          </FormLabel>
                          <FormControl>
                            <Select value={field.value?.toString()} onValueChange={(value) => field.onChange(parseInt(value))}>
                              <SelectTrigger>
                                <SelectValue placeholder={`Select ${form.watch("testType")}`} />
                              </SelectTrigger>
                              <SelectContent>
                                {form.watch("testType") === "campaign" 
                                  ? campaigns?.map((campaign: any) => (
                                      <SelectItem key={campaign.id} value={campaign.id.toString()}>
                                        {campaign.name}
                                      </SelectItem>
                                    ))
                                  : questions?.map((question: any) => (
                                      <SelectItem key={question.id} value={question.id.toString()}>
                                        {question.text}
                                      </SelectItem>
                                    ))
                                }
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="trafficSplit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Traffic Split (% for Variant A)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              max="100" 
                              placeholder="50" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="variantAName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Variant A Name (Control)</FormLabel>
                          <FormControl>
                            <Input placeholder="Control" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="variantBName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Variant B Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Variant B" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="variantBModifications"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Variant B Modifications (JSON)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder='{"cpc": "1.25", "text": "New question text"}'
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createExperimentMutation.isPending}>
                      {createExperimentMutation.isPending ? "Creating..." : "Create Test"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-slate-200 rounded"></div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Traffic Split</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Winner</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {experiments?.length > 0 ? (
                  experiments.map((experiment: any) => (
                    <TableRow key={experiment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{experiment.name}</div>
                          <div className="text-sm text-muted-foreground">{experiment.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {experiment.testType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(experiment.status)}>
                          {experiment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{experiment.trafficSplit}% / {100 - experiment.trafficSplit}%</TableCell>
                      <TableCell>
                        <div className="w-16">
                          <Progress value={experiment.progress || 0} className="h-2" />
                        </div>
                      </TableCell>
                      <TableCell>
                        {experiment.winnerVariant ? (
                          <Badge variant="default">
                            Variant {experiment.winnerVariant}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">TBD</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {experiment.status === 'draft' && (
                            <Button 
                              size="sm" 
                              onClick={() => handleStatusChange(experiment.id, 'running')}
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Start
                            </Button>
                          )}
                          {experiment.status === 'running' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleStatusChange(experiment.id, 'paused')}
                            >
                              <Pause className="h-3 w-3 mr-1" />
                              Pause
                            </Button>
                          )}
                          <Button size="sm" variant="outline">
                            View Results
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-slate-500 py-12">
                      <div className="space-y-2">
                        <p>No A/B tests created yet.</p>
                        <p className="text-sm">Create your first test to start optimizing performance.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}