import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, X } from "lucide-react";
import { type Question } from "@shared/schema";

interface TargetingGroup {
  id: string;
  name: string;
  questionIds: number[];
  color: string;
}

export default function Targeting() {
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(new Set());
  const [targetingGroups, setTargetingGroups] = useState<TargetingGroup[]>([
    {
      id: "1",
      name: "Group 1 (Max 20)",
      questionIds: [],
      color: "bg-blue-100 text-blue-800"
    }
  ]);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: questions = [] } = useQuery<Question[]>({
    queryKey: ["/api/questions"],
  });

  const filteredQuestions = questions.filter(question =>
    question.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleQuestionSelection = (questionId: number) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedQuestions(newSelected);
  };

  const addToGroup = (groupId: string) => {
    const group = targetingGroups.find(g => g.id === groupId);
    if (group && group.questionIds.length + selectedQuestions.size <= 20) {
      const updatedGroups = targetingGroups.map(g => 
        g.id === groupId 
          ? { ...g, questionIds: [...g.questionIds, ...Array.from(selectedQuestions)] }
          : g
      );
      setTargetingGroups(updatedGroups);
      setSelectedQuestions(new Set());
    }
  };

  const removeFromGroup = (groupId: string, questionId: number) => {
    const updatedGroups = targetingGroups.map(g => 
      g.id === groupId 
        ? { ...g, questionIds: g.questionIds.filter(id => id !== questionId) }
        : g
    );
    setTargetingGroups(updatedGroups);
  };

  const addNewGroup = () => {
    const newGroup: TargetingGroup = {
      id: (targetingGroups.length + 1).toString(),
      name: `Group ${targetingGroups.length + 1} (Max 20)`,
      questionIds: [],
      color: `bg-${['green', 'purple', 'orange', 'red'][targetingGroups.length % 4]}-100 text-${['green', 'purple', 'orange', 'red'][targetingGroups.length % 4]}-800`
    };
    setTargetingGroups([...targetingGroups, newGroup]);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Question Targeting</h1>
          <p className="text-muted-foreground">
            Select attributes and assign to groups for campaign targeting
          </p>
        </div>
        <Button onClick={addNewGroup} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Group
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Questions List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Available Questions</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Selected Attributes</span>
                  <Badge variant="secondary">{selectedQuestions.size}</Badge>
                </div>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
                  <span>Attribute Name</span>
                  <span>Activity</span>
                  <span>Definition</span>
                  <span>ID</span>
                </div>
                
                <div className="max-h-[600px] overflow-y-auto space-y-1">
                  {filteredQuestions.map((question) => (
                    <div
                      key={question.id}
                      className={`grid grid-cols-4 gap-4 items-center p-3 rounded-lg hover:bg-muted/50 transition-colors ${
                        selectedQuestions.has(question.id) ? 'bg-blue-50 border border-blue-200' : 'border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedQuestions.has(question.id)}
                          onCheckedChange={() => toggleQuestionSelection(question.id)}
                        />
                        <span className="font-medium truncate">{question.text}</span>
                      </div>
                      
                      <div>
                        <Badge variant="outline" className="text-xs">
                          {question.type}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground truncate">
                        {question.options && Array.isArray(question.options) ? `Options: ${question.options.join(', ')}` : 'Yes/No question'}
                      </div>
                      
                      <div className="text-sm font-mono text-muted-foreground">
                        {question.id}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Targeting Groups */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Targeting Groups</CardTitle>
              <p className="text-sm text-muted-foreground">
                Group questions together for campaign targeting
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {targetingGroups.map((group) => (
                <div key={group.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className={group.color}>
                      {group.name}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {group.questionIds.length}/20
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {group.questionIds.map((questionId) => {
                      const question = questions.find(q => q.id === questionId);
                      return question ? (
                        <div key={questionId} className="flex items-center justify-between text-sm bg-muted rounded p-2">
                          <span className="truncate flex-1">{question.text}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromGroup(group.id, questionId)}
                            className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : null;
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addToGroup(group.id)}
                    disabled={selectedQuestions.size === 0 || group.questionIds.length + selectedQuestions.size > 20}
                    className="w-full"
                  >
                    Add Selected ({selectedQuestions.size})
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Grouping Attributes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>How does it work?</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Select questions from the left panel</li>
                  <li>Group them together for targeting</li>
                  <li>Use groups in campaign targeting</li>
                  <li>Maximum 20 questions per group</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}