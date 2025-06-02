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
import { Plus, Users, Target, TrendingUp, Settings } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { AudienceSegmentationEngine } from "@/lib/audience-segmentation";

const segmentFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  segmentType: z.enum(["behavioral", "demographic", "custom"]),
  conditions: z.object({
    logic: z.enum(["AND", "OR"]),
    conditions: z.array(z.object({
      type: z.enum(["question", "demographic", "behavioral", "custom"]),
      field: z.string(),
      operator: z.enum(["equals", "contains", "in", "not_in", "greater_than", "less_than", "between"]),
      value: z.any(),
      weight: z.number().optional()
    }))
  })
});

type SegmentFormData = z.infer<typeof segmentFormSchema>;

export default function AudienceSegments() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const queryClient = useQueryClient();

  const { data: segments, isLoading } = useQuery({
    queryKey: ["/api/audience-segments"],
    queryFn: async () => {
      const response = await fetch("/api/audience-segments");
      return response.json();
    },
  });

  const { data: analytics } = useQuery({
    queryKey: ["/api/audience-segments/analytics"],
    queryFn: async () => {
      const response = await fetch("/api/audience-segments/analytics");
      return response.json();
    },
  });

  const createSegmentMutation = useMutation({
    mutationFn: async (data: SegmentFormData) => {
      const response = await fetch("/api/audience-segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/audience-segments"] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
  });

  const form = useForm<SegmentFormData>({
    resolver: zodResolver(segmentFormSchema),
    defaultValues: {
      name: "",
      description: "",
      segmentType: "behavioral",
      conditions: {
        logic: "AND",
        conditions: []
      }
    },
  });

  const templates = AudienceSegmentationEngine.getSegmentTemplates();

  const handleTemplateSelect = (templateName: string) => {
    const template = templates.find(t => t.name === templateName);
    if (template) {
      form.setValue("name", template.name);
      form.setValue("description", template.description);
      form.setValue("segmentType", template.segmentType as "behavioral" | "demographic" | "custom");
      form.setValue("conditions", template.conditions);
      setSelectedTemplate(templateName);
    }
  };

  const onSubmit = (data: SegmentFormData) => {
    createSegmentMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Segments</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalSegments}</div>
              <p className="text-xs text-muted-foreground">
                Active audience segments
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Across all segments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Segment Size</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.averageSegmentSize}</div>
              <p className="text-xs text-muted-foreground">
                Users per segment
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Performing</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.topPerformingSegment?.name || "N/A"}</div>
              <p className="text-xs text-muted-foreground">
                Best conversion rate
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Segments Table */}
      <Card>
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">Audience Segments</h3>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Segment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Audience Segment</DialogTitle>
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

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Segment Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter segment name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe this segment" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="segmentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Segment Type</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="behavioral">Behavioral</SelectItem>
                              <SelectItem value="demographic">Demographic</SelectItem>
                              <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createSegmentMutation.isPending}>
                      {createSegmentMutation.isPending ? "Creating..." : "Create Segment"}
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
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {segments?.length > 0 ? (
                  segments.map((segment: any) => (
                    <TableRow key={segment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{segment.name}</div>
                          <div className="text-sm text-muted-foreground">{segment.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {segment.segmentType}
                        </Badge>
                      </TableCell>
                      <TableCell>{segment.estimatedSize || 0} users</TableCell>
                      <TableCell>
                        <Badge variant={segment.active ? "default" : "secondary"}>
                          {segment.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(segment.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                          <Button size="sm" variant="outline">
                            Edit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-500 py-12">
                      <div className="space-y-2">
                        <p>No audience segments created yet.</p>
                        <p className="text-sm">Create your first segment to start targeting specific user groups.</p>
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