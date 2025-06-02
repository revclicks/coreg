import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Brain, 
  Target, 
  TrendingUp, 
  Users, 
  Clock, 
  BarChart3, 
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  Zap,
  Eye
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface PersonalizationHint {
  id: number;
  hintType: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  confidence: string;
  dataPoints: number;
  impact: string;
  implemented: boolean;
  targetEntity?: string;
  targetEntityId?: number;
  createdAt: string;
}

interface SessionAnalysis {
  totalInteractions: number;
  questionViews: number;
  questionAnswers: number;
  skips: number;
  adClicks: number;
  completionRate: number;
  skipRate: number;
  avgResponseTime: number;
  engagement: number;
}

export default function PersonalizationHub() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const queryClient = useQueryClient();

  const { data: hints = [], isLoading: hintsLoading } = useQuery<PersonalizationHint[]>({
    queryKey: ["/api/personalization/hints"],
  });

  const implementHintMutation = useMutation({
    mutationFn: (hintId: number) => 
      apiRequest(`/api/personalization/hints/${hintId}/implement`, {
        method: "PATCH",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personalization/hints"] });
    },
  });

  const generateTargetingMutation = useMutation({
    mutationFn: () => 
      apiRequest("/api/personalization/generate-targeting", {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personalization/hints"] });
    },
  });

  const identifyPatternsMutation = useMutation({
    mutationFn: () => 
      apiRequest("/api/personalization/identify-patterns", {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personalization/hints"] });
    },
  });

  const filteredHints = selectedCategory === "all" 
    ? hints 
    : hints.filter(hint => hint.category === selectedCategory);

  const activehints = hints.filter(h => !h.implemented);
  const implementedHints = hints.filter(h => h.implemented);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance': return <TrendingUp className="h-4 w-4" />;
      case 'targeting': return <Target className="h-4 w-4" />;
      case 'engagement': return <Users className="h-4 w-4" />;
      case 'conversion': return <BarChart3 className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  if (hintsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="h-8 w-8 text-purple-600" />
            Personalization Hub
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            AI-powered insights and recommendations based on user behavior analysis
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => generateTargetingMutation.mutate()}
            disabled={generateTargetingMutation.isPending}
            variant="outline"
          >
            <Target className="h-4 w-4 mr-2" />
            Generate Targeting
          </Button>
          <Button 
            onClick={() => identifyPatternsMutation.mutate()}
            disabled={identifyPatternsMutation.isPending}
          >
            <Brain className="h-4 w-4 mr-2" />
            Analyze Patterns
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Hints</p>
                <p className="text-2xl font-bold">{activehints.length}</p>
              </div>
              <Lightbulb className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">High Priority</p>
                <p className="text-2xl font-bold text-red-600">
                  {activehints.filter(h => h.priority === 'high').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Implemented</p>
                <p className="text-2xl font-bold text-green-600">{implementedHints.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Confidence</p>
                <p className="text-2xl font-bold">
                  {activehints.length > 0 
                    ? Math.round(activehints.reduce((sum, h) => sum + parseFloat(h.confidence), 0) / activehints.length * 100)
                    : 0}%
                </p>
              </div>
              <Zap className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">Active Hints ({activehints.length})</TabsTrigger>
          <TabsTrigger value="implemented">Implemented ({implementedHints.length})</TabsTrigger>
          <TabsTrigger value="analytics">Behavior Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-6">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
            >
              All Categories
            </Button>
            {["performance", "targeting", "engagement", "conversion"].map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="capitalize"
              >
                {getCategoryIcon(category)}
                <span className="ml-2">{category}</span>
              </Button>
            ))}
          </div>

          {/* Active Hints */}
          <div className="space-y-4">
            {filteredHints.filter(h => !h.implemented).map((hint) => (
              <Card key={hint.id} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{hint.title}</CardTitle>
                        <Badge className={getPriorityColor(hint.priority)}>
                          {hint.priority}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {getCategoryIcon(hint.category)}
                          <span className="ml-1">{hint.category}</span>
                        </Badge>
                      </div>
                      <CardDescription>{hint.description}</CardDescription>
                    </div>
                    <Button
                      onClick={() => implementHintMutation.mutate(hint.id)}
                      disabled={implementHintMutation.isPending}
                      size="sm"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Implement
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Confidence</span>
                      <div className="flex items-center gap-2">
                        <Progress value={parseFloat(hint.confidence) * 100} className="w-20" />
                        <span className="font-medium">{Math.round(parseFloat(hint.confidence) * 100)}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Data Points</span>
                      <span className="font-medium">{hint.dataPoints.toLocaleString()}</span>
                    </div>
                    {hint.impact && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                        <div className="flex items-start gap-2">
                          <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                              Expected Impact
                            </p>
                            <p className="text-sm text-blue-700 dark:text-blue-300">{hint.impact}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredHints.filter(h => !h.implemented).length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No Active Hints
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Generate new insights by analyzing user behavior patterns and targeting data.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="implemented" className="space-y-6">
          <div className="space-y-4">
            {implementedHints.map((hint) => (
              <Card key={hint.id} className="border-l-4 border-l-green-500 opacity-75">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{hint.title}</CardTitle>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Implemented
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {getCategoryIcon(hint.category)}
                          <span className="ml-1">{hint.category}</span>
                        </Badge>
                      </div>
                      <CardDescription>{hint.description}</CardDescription>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Confidence: {Math.round(parseFloat(hint.confidence) * 100)}% • 
                    Data Points: {hint.dataPoints.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            ))}

            {implementedHints.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No Implemented Hints Yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Implemented personalization hints will appear here.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Behavior Patterns
                </CardTitle>
                <CardDescription>
                  Identified user behavior patterns and their characteristics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <div>
                      <p className="font-medium">Quick Responders</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Users who respond quickly</p>
                    </div>
                    <Badge>23% of users</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <div>
                      <p className="font-medium">Careful Readers</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Users who take time to read</p>
                    </div>
                    <Badge>45% of users</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <div>
                      <p className="font-medium">Engaged Users</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">High engagement with ads</p>
                    </div>
                    <Badge>32% of users</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Response Insights
                </CardTitle>
                <CardDescription>
                  Average response times and completion rates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Avg Response Time</span>
                    <span className="font-medium">8.5 seconds</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</span>
                    <span className="font-medium">78%</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Skip Rate</span>
                    <span className="font-medium">12%</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Ad Click Rate</span>
                    <span className="font-medium">24%</span>
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