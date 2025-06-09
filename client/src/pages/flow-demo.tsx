import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  Clock, 
  Target, 
  TrendingUp, 
  Users, 
  Eye,
  MousePointer,
  BarChart3
} from "lucide-react";

interface FlowStrategy {
  type: "progressive" | "front_loaded" | "minimal";
  name: string;
  description: string;
  questionsPerAd: number;
  maxQuestions: number;
  maxAds: number;
  pros: string[];
  cons: string[];
  bestFor: string[];
  metrics: {
    conversionRate: number;
    completionRate: number;
    userEngagement: number;
    revenuePerUser: number;
  };
}

const flowStrategies: FlowStrategy[] = [
  {
    type: "progressive",
    name: "Progressive Flow",
    description: "Balanced approach: 2-3 questions → ad → 2-3 questions → ad",
    questionsPerAd: 2,
    maxQuestions: 6,
    maxAds: 3,
    pros: [
      "Balanced user experience",
      "Good data collection",
      "Higher completion rates",
      "Multiple monetization points"
    ],
    cons: [
      "Moderate conversion rates",
      "Longer engagement time",
      "More complex flow management"
    ],
    bestFor: [
      "General audience websites",
      "Balanced revenue and data goals",
      "Brand-conscious publishers",
      "Long-term user relationships"
    ],
    metrics: {
      conversionRate: 8.5,
      completionRate: 72,
      userEngagement: 85,
      revenuePerUser: 2.40
    }
  },
  {
    type: "minimal",
    name: "Minimal Flow",
    description: "Quick conversion: 1 question → ad → 1 question → ad",
    questionsPerAd: 1,
    maxQuestions: 4,
    maxAds: 4,
    pros: [
      "Highest conversion rates",
      "Quick monetization",
      "Low user friction",
      "Mobile-optimized"
    ],
    cons: [
      "Limited data collection",
      "Shorter engagement",
      "May feel aggressive",
      "Lower completion rates"
    ],
    bestFor: [
      "High-traffic sites",
      "Mobile-first audiences",
      "Performance marketing",
      "Quick conversion goals"
    ],
    metrics: {
      conversionRate: 12.3,
      completionRate: 45,
      userEngagement: 60,
      revenuePerUser: 3.20
    }
  },
  {
    type: "front_loaded",
    name: "Front-Loaded Flow",
    description: "Data first: All questions → then show multiple ads",
    questionsPerAd: 0,
    maxQuestions: 10,
    maxAds: 2,
    pros: [
      "Maximum data collection",
      "Better targeting precision",
      "Higher user commitment",
      "Premium ad placements"
    ],
    cons: [
      "Lower initial conversion",
      "Higher abandonment risk",
      "Delayed monetization",
      "Requires engaging content"
    ],
    bestFor: [
      "Research platforms",
      "Lead generation",
      "High-value audiences",
      "Data-driven campaigns"
    ],
    metrics: {
      conversionRate: 6.8,
      completionRate: 85,
      userEngagement: 95,
      revenuePerUser: 1.90
    }
  }
];

export default function FlowDemo() {
  const [selectedStrategy, setSelectedStrategy] = useState<FlowStrategy>(flowStrategies[0]);
  const [demoStep, setDemoStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const simulateFlow = (strategy: FlowStrategy) => {
    setSelectedStrategy(strategy);
    setDemoStep(0);
    setIsRunning(true);
    
    let step = 0;
    const totalSteps = strategy.maxQuestions + strategy.maxAds;
    
    const interval = setInterval(() => {
      step++;
      setDemoStep(step);
      
      if (step >= totalSteps) {
        clearInterval(interval);
        setIsRunning(false);
      }
    }, 800);
  };

  const getFlowSequence = (strategy: FlowStrategy) => {
    const sequence: ("question" | "ad")[] = [];
    
    switch (strategy.type) {
      case "minimal":
        for (let i = 0; i < strategy.maxQuestions; i++) {
          sequence.push("question");
          if (i < strategy.maxAds) sequence.push("ad");
        }
        break;
      case "progressive":
        let questionsAdded = 0;
        let adsAdded = 0;
        while (questionsAdded < strategy.maxQuestions || adsAdded < strategy.maxAds) {
          // Add batch of questions
          for (let i = 0; i < strategy.questionsPerAd && questionsAdded < strategy.maxQuestions; i++) {
            sequence.push("question");
            questionsAdded++;
          }
          // Add ad after batch
          if (adsAdded < strategy.maxAds && questionsAdded > 0) {
            sequence.push("ad");
            adsAdded++;
          }
        }
        break;
      case "front_loaded":
        // All questions first
        for (let i = 0; i < strategy.maxQuestions; i++) {
          sequence.push("question");
        }
        // Then all ads
        for (let i = 0; i < strategy.maxAds; i++) {
          sequence.push("ad");
        }
        break;
    }
    
    return sequence;
  };

  const sequence = getFlowSequence(selectedStrategy);
  const progress = (demoStep / sequence.length) * 100;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Flow Strategy Demo</h1>
        <p className="text-gray-600 mt-2">
          Compare different question-to-ad flow strategies and their performance characteristics
        </p>
      </div>

      {/* Strategy Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {flowStrategies.map((strategy) => (
          <Card 
            key={strategy.type}
            className={`cursor-pointer transition-all ${
              selectedStrategy.type === strategy.type 
                ? 'ring-2 ring-blue-500 bg-blue-50' 
                : 'hover:shadow-lg'
            }`}
            onClick={() => setSelectedStrategy(strategy)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{strategy.name}</CardTitle>
                <Badge variant={selectedStrategy.type === strategy.type ? "default" : "secondary"}>
                  {strategy.type}
                </Badge>
              </div>
              <CardDescription>{strategy.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Questions:</span> {strategy.maxQuestions}
                  </div>
                  <div>
                    <span className="font-medium">Ads:</span> {strategy.maxAds}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <MousePointer className="h-3 w-3" />
                      Conversion
                    </span>
                    <span className="font-medium">{strategy.metrics.conversionRate}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Completion
                    </span>
                    <span className="font-medium">{strategy.metrics.completionRate}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Revenue/User
                    </span>
                    <span className="font-medium">${strategy.metrics.revenuePerUser}</span>
                  </div>
                </div>

                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    simulateFlow(strategy);
                  }}
                  disabled={isRunning}
                  className="w-full"
                  size="sm"
                >
                  {isRunning && selectedStrategy.type === strategy.type ? "Running..." : "Simulate Flow"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Flow Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Flow Visualization: {selectedStrategy.name}
          </CardTitle>
          <CardDescription>
            Watch how the {selectedStrategy.name.toLowerCase()} strategy unfolds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-gray-600">{demoStep} / {sequence.length} steps</span>
            </div>
            <Progress value={progress} className="h-2" />
            
            <div className="flex flex-wrap gap-2">
              {sequence.map((step, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-center w-12 h-12 rounded-lg border-2 transition-all ${
                    index < demoStep
                      ? step === "question"
                        ? "bg-blue-500 border-blue-500 text-white"
                        : "bg-green-500 border-green-500 text-white"
                      : index === demoStep
                      ? step === "question"
                        ? "bg-blue-100 border-blue-300 text-blue-600 ring-2 ring-blue-200"
                        : "bg-green-100 border-green-300 text-green-600 ring-2 ring-green-200"
                      : "bg-gray-100 border-gray-200 text-gray-400"
                  }`}
                >
                  {step === "question" ? "Q" : "A"}
                </div>
              ))}
            </div>
            
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span>Question</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span>Advertisement</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis */}
      <Tabs defaultValue="pros-cons" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pros-cons">Pros & Cons</TabsTrigger>
          <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
          <TabsTrigger value="use-cases">Best Use Cases</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pros-cons" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-700">Advantages</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {selectedStrategy.pros.map((pro, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{pro}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-red-700">Considerations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {selectedStrategy.cons.map((con, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{con}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <MousePointer className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Conversion Rate</span>
                </div>
                <div className="text-2xl font-bold mt-2">{selectedStrategy.metrics.conversionRate}%</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Completion Rate</span>
                </div>
                <div className="text-2xl font-bold mt-2">{selectedStrategy.metrics.completionRate}%</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Engagement</span>
                </div>
                <div className="text-2xl font-bold mt-2">{selectedStrategy.metrics.userEngagement}%</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Revenue/User</span>
                </div>
                <div className="text-2xl font-bold mt-2">${selectedStrategy.metrics.revenuePerUser}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="use-cases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Optimal Use Cases for {selectedStrategy.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedStrategy.bestFor.map((useCase, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{useCase}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Implementation Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Recommendations</CardTitle>
          <CardDescription>
            How to choose the right flow strategy for your specific needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">For High Traffic Sites</h4>
              <p className="text-blue-800 text-sm">
                Use <strong>Minimal Flow</strong> to maximize quick conversions and revenue per session. 
                The higher conversion rate compensates for lower completion rates.
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">For Data Collection</h4>
              <p className="text-green-800 text-sm">
                Choose <strong>Front-Loaded Flow</strong> when you need comprehensive user profiles 
                for better targeting and higher-value ad placements.
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-2">For Balanced Approach</h4>
              <p className="text-purple-800 text-sm">
                <strong>Progressive Flow</strong> offers the best balance between user experience, 
                data collection, and monetization - ideal for most scenarios.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}