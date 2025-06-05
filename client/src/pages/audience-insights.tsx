import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Target, TrendingUp, Eye, MousePointer, DollarSign } from "lucide-react";

export default function AudienceInsights() {
  const [timeframe, setTimeframe] = useState("7d");
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");

  const { data: audienceData } = useQuery({
    queryKey: ["/api/audience/insights", timeframe, selectedCampaign],
    queryFn: async () => {
      const params = new URLSearchParams({ timeframe });
      if (selectedCampaign !== "all") params.append("campaignId", selectedCampaign);
      
      const response = await fetch(`/api/audience/insights?${params}`);
      return response.json();
    },
  });

  const { data: campaigns } = useQuery({
    queryKey: ["/api/campaigns"],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Audience Insights</h1>
        <div className="flex items-center space-x-4">
          <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Campaign" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campaigns</SelectItem>
              {campaigns?.map((campaign: any) => (
                <SelectItem key={campaign.id} value={campaign.id.toString()}>
                  {campaign.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">1 Day</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Audience Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-slate-600">Total Users</p>
                <p className="text-2xl font-bold">{audienceData?.totalUsers?.toLocaleString() || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Target className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm font-medium text-slate-600">Segments</p>
                <p className="text-2xl font-bold">{audienceData?.activeSegments || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-slate-600">Engagement Rate</p>
                <p className="text-2xl font-bold">{audienceData?.engagementRate || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <DollarSign className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-slate-600">Avg. Revenue</p>
                <p className="text-2xl font-bold">${audienceData?.avgRevenue || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Demographics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audience Demographics</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Age Group</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Engagement</TableHead>
                <TableHead>Conversion Rate</TableHead>
                <TableHead>Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {audienceData?.demographics?.map((demo: any, index: number) => (
                <TableRow key={index}>
                  <TableCell>{demo.ageGroup}</TableCell>
                  <TableCell>
                    <Badge variant={demo.gender === 'Male' ? 'default' : 'secondary'}>
                      {demo.gender}
                    </Badge>
                  </TableCell>
                  <TableCell>{demo.users.toLocaleString()}</TableCell>
                  <TableCell>{demo.engagement}%</TableCell>
                  <TableCell>{demo.conversionRate}%</TableCell>
                  <TableCell>${demo.revenue.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Question Response Patterns */}
      <Card>
        <CardHeader>
          <CardTitle>Question Response Patterns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {audienceData?.questionPatterns?.map((pattern: any) => (
              <div key={pattern.questionId} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{pattern.questionText}</h4>
                  <Badge>{pattern.responseRate}% response rate</Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {pattern.answers.map((answer: any) => (
                    <div key={answer.value} className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{answer.count}</p>
                      <p className="text-sm text-slate-600">{answer.value}</p>
                      <p className="text-xs text-slate-500">{answer.percentage}%</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}