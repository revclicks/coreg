import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, ArrowUpDown, TrendingUp, Users, Target, DollarSign } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import AddQuestionModal from "@/components/modals/add-question-modal";
import type { Question } from "@shared/schema";

export default function Questions() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [optimizationMode, setOptimizationMode] = useState<'auto' | 'manual'>('auto');

  const { data: questions, isLoading } = useQuery<Question[]>({
    queryKey: ["/api/questions"],
  });

  const { data: optimizedQuestions } = useQuery({
    queryKey: ["/api/questions/optimized"],
    queryFn: async () => {
      const response = await fetch("/api/questions/optimized");
      return response.json();
    },
  });

  const { data: questionAnalytics } = useQuery({
    queryKey: ["/api/questions/analytics"],
    queryFn: async () => {
      const response = await fetch("/api/questions/analytics", {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      return response.json();
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/questions/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete question");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
    },
  });

  const updatePriorityMutation = useMutation({
    mutationFn: async ({ questionId, priority, manualPriority }: { questionId: number; priority: number; manualPriority?: number }) => {
      const response = await fetch(`/api/questions/${questionId}/priority`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority, manualPriority }),
      });
      if (!response.ok) throw new Error("Failed to update priority");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/questions/optimized"] });
    },
  });

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setShowAddModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this question?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingQuestion(null);
  };

  const getPriorityColor = (priority: number) => {
    if (priority === 1) return "bg-red-100 text-red-800";
    if (priority <= 3) return "bg-amber-100 text-amber-800";
    return "bg-green-100 text-green-800";
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Summary Cards */}
      {questionAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Questions</p>
                  <p className="text-2xl font-bold">{questionAnalytics.totalQuestions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-slate-600">Avg. Earnings/Impression</p>
                  <p className="text-2xl font-bold">${questionAnalytics.averageEarningsPerImpression}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm font-medium text-slate-600">Avg. Response Rate</p>
                  <p className="text-2xl font-bold">{(questionAnalytics.averageResponseRate * 100).toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm font-medium text-slate-600">Auto-Optimized</p>
                  <p className="text-2xl font-bold">{questionAnalytics.autoOptimizedQuestions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Question Performance Manager</CardTitle>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium">Optimization Mode:</label>
                <Select value={optimizationMode} onValueChange={(value: 'auto' | 'manual') => setOptimizationMode(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Question
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Current Priority</TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Performance Metrics</TableHead>
                  <TableHead>Optimization</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(optimizationMode === 'auto' ? optimizedQuestions : questions)?.map((question: any) => {
                  // Find analytics data for this question
                  const analyticsData = questionAnalytics?.questions?.find((q: any) => q.questionId === question.id);
                  
                  return (
                    <TableRow key={question.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Badge className={getPriorityColor(question.manualPriority || question.priority)}>
                            {question.manualPriority || question.priority}
                          </Badge>
                          {question.manualPriority && (
                            <Badge variant="outline" className="text-xs">
                              Manual
                            </Badge>
                          )}
                          {question.autoOptimize && !question.manualPriority && (
                            <Badge variant="outline" className="text-xs text-blue-600">
                              Auto
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">
                          {question.manualPriority ? `Override: ${question.manualPriority}` : `Base: ${question.priority}`}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium max-w-xs truncate">{question.text}</TableCell>
                    <TableCell className="capitalize">{question.type?.replace('_', ' ')}</TableCell>
                    <TableCell>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">EPI:</span>
                          <span className="font-medium text-green-600">
                            ${(Number(analyticsData?.earningsPerImpression || question.earningsPerImpression) || 0).toFixed(3)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Response Rate:</span>
                          <span className="font-medium text-blue-600">
                            {((Number(analyticsData?.responseRate || question.responseRate) || 0) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Impressions:</span>
                          <span className="font-medium text-slate-700">
                            {Number(analyticsData?.impressions || question.impressions) || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Data Age:</span>
                          <span className="font-medium text-slate-500">
                            {question.createdAt ? 
                              Math.floor((new Date().getTime() - new Date(question.createdAt).getTime()) / (1000 * 60 * 60 * 24)) + 'd' 
                              : 'New'}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        {(() => {
                          const daysSinceCreation = question.createdAt ? 
                            Math.floor((new Date().getTime() - new Date(question.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
                          const hasWeekOfData = daysSinceCreation >= 7;
                          
                          return (
                            <>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={question.autoOptimize && hasWeekOfData}
                                  disabled={!hasWeekOfData}
                                  onCheckedChange={(checked) => {
                                    updatePriorityMutation.mutate({
                                      questionId: question.id,
                                      priority: question.priority,
                                      manualPriority: checked ? null : question.priority
                                    });
                                  }}
                                />
                                <span className="text-xs text-slate-600">Auto-optimize</span>
                              </div>
                              {!hasWeekOfData && (
                                <div className="text-xs text-amber-600">
                                  Need 7+ days of data ({7 - daysSinceCreation} days remaining)
                                </div>
                              )}
                              {(!question.autoOptimize || !hasWeekOfData) && (
                                <Input
                                  type="number"
                                  placeholder="Manual priority"
                                  className="w-20 h-8 text-xs"
                                  defaultValue={question.manualPriority || ''}
                                  onBlur={(e) => {
                                    const value = parseInt(e.target.value);
                                    if (value && value !== question.manualPriority) {
                                      updatePriorityMutation.mutate({
                                        questionId: question.id,
                                        priority: question.priority,
                                        manualPriority: value
                                      });
                                    }
                                  }}
                                />
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={question.active ? "default" : "secondary"}>
                        {question.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(question)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(question.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AddQuestionModal
        open={showAddModal}
        onClose={handleCloseModal}
        editingQuestion={editingQuestion}
      />
    </div>
  );
}
