import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle, 
  Clock, 
  Target, 
  TrendingUp, 
  Users, 
  Eye,
  MousePointer,
  BarChart3,
  Play,
  Pause,
  Plus,
  Trophy,
  AlertTriangle,
  Activity
} from "lucide-react";

interface FlowExperiment {
  id: number;
  name: string;
  description: string;
  siteId: number;
  status: string;
  trafficSplit: {
    progressive: number;
    minimal: number;
    front_loaded: number;
  };
  startDate: string;
  endDate: string;
  minSampleSize: number;
  confidenceLevel: string;
  createdAt: string;
}

interface FlowTestResult {
  flowType: string;
  sessions: number;
  completions: number;
  completionRate: number;
  questionsAnswered: number;
  avgQuestionsPerSession: number;
  adsShown: number;
  adsClicked: number;
  clickThroughRate: number;
  conversionValue: number;
  revenuePerSession: number;
  avgTimeSpent: number;
  abandonmentRate: number;
  statisticalSignificance: number;
  confidenceInterval: { lower: number; upper: number };
}

interface ExperimentResults {
  experimentId: number;
  status: string;
  totalSessions: number;
  results: FlowTestResult[];
  winningFlow?: string;
  recommendation: string;
  confidence: number;
}

export default function FlowTesting() {
  const [selectedExperiment, setSelectedExperiment] = useState<FlowExperiment | null>(null);
  const [newExperimentForm, setNewExperimentForm] = useState({
    name: "",
    description: "",
    siteId: "",
    trafficSplit: { progressive: 33, minimal: 33, front_loaded: 34 },
    minSampleSize: 1000,
    confidenceLevel: "0.95"
  });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();

  // Fetch experiments
  const { data: experiments = [], isLoading: experimentsLoading, refetch: refetchExperiments } = useQuery({
    queryKey: ["/api/flow-experiments"],
  });

  // Fetch sites for experiment creation
  const { data: sites = [] } = useQuery({
    queryKey: ["/api/sites"],
  });

  // Fetch experiment results
  const { data: experimentResults, isLoading: resultsLoading } = useQuery({
    queryKey: ["/api/flow-experiments", selectedExperiment?.id, "results"],
    enabled: !!selectedExperiment?.id,
  });

  // Create experiment mutation
  const createExperimentMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/flow-experiments", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      toast({ title: "Experiment created successfully" });
      setShowCreateDialog(false);
      setNewExperimentForm({
        name: "",
        description: "",
        siteId: "",
        trafficSplit: { progressive: 33, minimal: 33, front_loaded: 34 },
        minSampleSize: 1000,
        confidenceLevel: "0.95"
      });
      refetchExperiments();
    },
    onError: () => {
      toast({ title: "Failed to create experiment", variant: "destructive" });
    },
  });

  // Start experiment mutation
  const startExperimentMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/flow-experiments/${id}/start`, {
      method: "POST",
    }),
    onSuccess: () => {
      toast({ title: "Experiment started successfully" });
      refetchExperiments();
    },
    onError: () => {
      toast({ title: "Failed to start experiment", variant: "destructive" });
    },
  });

  // Stop experiment mutation
  const stopExperimentMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/flow-experiments/${id}/stop`, {
      method: "POST",
    }),
    onSuccess: () => {
      toast({ title: "Experiment stopped successfully" });
      refetchExperiments();
    },
    onError: () => {
      toast({ title: "Failed to stop experiment", variant: "destructive" });
    },
  });

  const handleCreateExperiment = () => {
    if (!newExperimentForm.name || !newExperimentForm.siteId) {
      toast({ title: "Please fill in required fields", variant: "destructive" });
      return;
    }

    createExperimentMutation.mutate({
      ...newExperimentForm,
      siteId: parseInt(newExperimentForm.siteId),
      trafficSplit: newExperimentForm.trafficSplit,
    });
  };

  const getFlowTypeColor = (flowType: string) => {
    switch (flowType) {
      case "progressive": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "minimal": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "front_loaded": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "draft": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "completed": return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      case "paused": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const formatFlowName = (flowType: string) => {
    switch (flowType) {
      case "progressive": return "Progressive Flow";
      case "minimal": return "Minimal Flow";
      case "front_loaded": return "Front-loaded Flow";
      default: return flowType;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Flow A/B Testing</h1>
          <p className="text-muted-foreground">
            Test different question-to-ad flow strategies to optimize conversion rates
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Experiment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Flow A/B Test</DialogTitle>
              <DialogDescription>
                Create a new experiment to test different flow strategies
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Experiment Name</Label>
                <Input
                  id="name"
                  value={newExperimentForm.name}
                  onChange={(e) => setNewExperimentForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Mobile Flow Optimization Q4"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newExperimentForm.description}
                  onChange={(e) => setNewExperimentForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the experiment"
                />
              </div>
              
              <div>
                <Label htmlFor="siteId">Site</Label>
                <Select value={newExperimentForm.siteId} onValueChange={(value) => 
                  setNewExperimentForm(prev => ({ ...prev, siteId: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a site" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites.map((site: any) => (
                      <SelectItem key={site.id} value={site.id.toString()}>
                        {site.name} ({site.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Traffic Split (%)</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div>
                    <Label className="text-xs">Progressive</Label>
                    <Input
                      type="number"
                      value={newExperimentForm.trafficSplit.progressive}
                      onChange={(e) => setNewExperimentForm(prev => ({
                        ...prev,
                        trafficSplit: { ...prev.trafficSplit, progressive: parseInt(e.target.value) || 0 }
                      }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Minimal</Label>
                    <Input
                      type="number"
                      value={newExperimentForm.trafficSplit.minimal}
                      onChange={(e) => setNewExperimentForm(prev => ({
                        ...prev,
                        trafficSplit: { ...prev.trafficSplit, minimal: parseInt(e.target.value) || 0 }
                      }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Front-loaded</Label>
                    <Input
                      type="number"
                      value={newExperimentForm.trafficSplit.front_loaded}
                      onChange={(e) => setNewExperimentForm(prev => ({
                        ...prev,
                        trafficSplit: { ...prev.trafficSplit, front_loaded: parseInt(e.target.value) || 0 }
                      }))}
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minSampleSize">Min Sample Size</Label>
                  <Input
                    id="minSampleSize"
                    type="number"
                    value={newExperimentForm.minSampleSize}
                    onChange={(e) => setNewExperimentForm(prev => ({ 
                      ...prev, 
                      minSampleSize: parseInt(e.target.value) || 1000 
                    }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="confidenceLevel">Confidence Level</Label>
                  <Select 
                    value={newExperimentForm.confidenceLevel} 
                    onValueChange={(value) => setNewExperimentForm(prev => ({ ...prev, confidenceLevel: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.90">90%</SelectItem>
                      <SelectItem value="0.95">95%</SelectItem>
                      <SelectItem value="0.99">99%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateExperiment}
                disabled={createExperimentMutation.isPending}
              >
                {createExperimentMutation.isPending ? "Creating..." : "Create Experiment"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="experiments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="experiments">Active Experiments</TabsTrigger>
          <TabsTrigger value="results">Results Analysis</TabsTrigger>
          <TabsTrigger value="strategy">Flow Strategies</TabsTrigger>
        </TabsList>

        <TabsContent value="experiments" className="space-y-4">
          {experimentsLoading ? (
            <div className="text-center py-8">
              <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading experiments...</p>
            </div>
          ) : experiments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Experiments Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first flow A/B test to start optimizing conversion rates
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Experiment
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {experiments.map((experiment: FlowExperiment) => (
                <Card key={experiment.id} className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedExperiment(experiment)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{experiment.name}</CardTitle>
                        <CardDescription>{experiment.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(experiment.status)}>
                          {experiment.status}
                        </Badge>
                        {experiment.status === "draft" && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              startExperimentMutation.mutate(experiment.id);
                            }}
                            disabled={startExperimentMutation.isPending}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Start
                          </Button>
                        )}
                        {experiment.status === "running" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              stopExperimentMutation.mutate(experiment.id);
                            }}
                            disabled={stopExperimentMutation.isPending}
                          >
                            <Pause className="h-3 w-3 mr-1" />
                            Stop
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Site ID: {experiment.siteId}</span>
                      <span>Min Sample: {experiment.minSampleSize.toLocaleString()}</span>
                      <span>Confidence: {(parseFloat(experiment.confidenceLevel) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      {Object.entries(experiment.trafficSplit).map(([flow, percentage]) => (
                        <Badge key={flow} variant="outline" className={getFlowTypeColor(flow)}>
                          {formatFlowName(flow)}: {percentage}%
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {!selectedExperiment ? (
            <Card>
              <CardContent className="text-center py-8">
                <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Select an Experiment</h3>
                <p className="text-muted-foreground">
                  Choose an experiment from the list to view detailed results
                </p>
              </CardContent>
            </Card>
          ) : resultsLoading ? (
            <div className="text-center py-8">
              <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading experiment results...</p>
            </div>
          ) : experimentResults ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedExperiment.name}</CardTitle>
                      <CardDescription>
                        Total Sessions: {(experimentResults as ExperimentResults)?.totalSessions?.toLocaleString() || '0'}
                      </CardDescription>
                    </div>
                    {(experimentResults as ExperimentResults)?.winningFlow && (
                      <div className="text-right">
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          <Trophy className="h-3 w-3 mr-1" />
                          Winner: {formatFlowName((experimentResults as ExperimentResults).winningFlow!)}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          {((experimentResults as ExperimentResults).confidence || 0).toFixed(1)}% confidence
                        </p>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-900 dark:text-blue-100">Recommendation</p>
                        <p className="text-blue-800 dark:text-blue-200 text-sm mt-1">
                          {(experimentResults as ExperimentResults)?.recommendation || 'No recommendation available yet.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4">
                {((experimentResults as ExperimentResults)?.results || []).map((result: FlowTestResult) => (
                  <Card key={result.flowType}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Badge className={getFlowTypeColor(result.flowType)}>
                            {formatFlowName(result.flowType)}
                          </Badge>
                        </CardTitle>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            {result.sessions.toLocaleString()} sessions
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium">Completion Rate</span>
                          </div>
                          <p className="text-2xl font-bold">{result.completionRate.toFixed(1)}%</p>
                          <Progress value={result.completionRate} className="mt-2" />
                        </div>
                        
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <MousePointer className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium">Click Rate</span>
                          </div>
                          <p className="text-2xl font-bold">{result.clickThroughRate.toFixed(1)}%</p>
                          <Progress value={result.clickThroughRate} className="mt-2" />
                        </div>
                        
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium">Revenue/Session</span>
                          </div>
                          <p className="text-2xl font-bold">${result.revenuePerSession.toFixed(2)}</p>
                        </div>
                        
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Clock className="h-4 w-4 text-purple-600" />
                            <span className="text-sm font-medium">Avg Time</span>
                          </div>
                          <p className="text-2xl font-bold">{Math.round(result.avgTimeSpent / 60)}m</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Questions Answered:</span>
                            <span className="ml-2 font-medium">{result.avgQuestionsPerSession.toFixed(1)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Ads Clicked:</span>
                            <span className="ml-2 font-medium">{result.adsClicked.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Abandonment:</span>
                            <span className="ml-2 font-medium">{result.abandonmentRate.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="strategy" className="space-y-4">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Progressive Flow
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Balanced approach: 2-3 questions → ad → repeat
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2 text-green-700 dark:text-green-300">Advantages</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Balanced user experience</li>
                      <li>• Good data collection</li>
                      <li>• Higher completion rates</li>
                      <li>• Multiple monetization points</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 text-orange-700 dark:text-orange-300">Considerations</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Moderate conversion rates</li>
                      <li>• Longer engagement time</li>
                      <li>• More complex flow management</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Minimal Flow
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Quick conversion: 1 question → ad → repeat
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2 text-green-700 dark:text-green-300">Advantages</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Highest conversion rates</li>
                      <li>• Quick monetization</li>
                      <li>• Low user friction</li>
                      <li>• Mobile-optimized</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 text-orange-700 dark:text-orange-300">Considerations</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Limited data collection</li>
                      <li>• Shorter engagement</li>
                      <li>• May feel aggressive</li>
                      <li>• Lower completion rates</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    Front-loaded Flow
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Data first: All questions → then show ads
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2 text-green-700 dark:text-green-300">Advantages</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Maximum data collection</li>
                      <li>• Better targeting precision</li>
                      <li>• Higher user commitment</li>
                      <li>• Quality responses</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 text-orange-700 dark:text-orange-300">Considerations</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Lower completion rates</li>
                      <li>• Risk of abandonment</li>
                      <li>• Delayed monetization</li>
                      <li>• Requires patient users</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}