import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, TrendingUp, BarChart, DollarSign, MousePointer, Eye, Target } from "lucide-react";
import { format } from "date-fns";

export default function Stats() {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });

  const { data: campaignStats = [], isLoading: loadingCampaigns } = useQuery({
    queryKey: ["/api/stats/campaigns-enhanced", dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange.from) params.append("startDate", dateRange.from.toISOString());
      if (dateRange.to) params.append("endDate", dateRange.to.toISOString());
      
      const response = await fetch(`/api/stats/campaigns-enhanced?${params}`);
      return response.json();
    }
  });

  const { data: questionStats = [], isLoading: loadingQuestions } = useQuery({
    queryKey: ["/api/stats/questions-enhanced", dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange.from) params.append("startDate", dateRange.from.toISOString());
      if (dateRange.to) params.append("endDate", dateRange.to.toISOString());
      
      const response = await fetch(`/api/stats/questions-enhanced?${params}`);
      return response.json();
    }
  });

  if (loadingQuestions || loadingCampaigns) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-64 bg-slate-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Stats & Analytics</h1>
          <p className="text-muted-foreground">View detailed performance analytics and conversion metrics</p>
        </div>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Campaign Analytics
          </TabsTrigger>
          <TabsTrigger value="questions" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Question Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Vertical</TableHead>
                      <TableHead>Clicks</TableHead>
                      <TableHead>CTR</TableHead>
                      <TableHead>CVR</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>CPC Bid</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaignStats?.map((campaign: any) => (
                      <TableRow key={campaign.campaignId}>
                        <TableCell className="font-medium">{campaign.campaignName}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {campaign.vertical}
                          </span>
                        </TableCell>
                        <TableCell>{campaign.clicks.toLocaleString()}</TableCell>
                        <TableCell>
                          <span className="text-green-600 font-medium">{campaign.ctr}%</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-blue-600 font-medium">{campaign.cvr}%</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-emerald-600 font-bold">${campaign.revenue}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-purple-600">${campaign.cpcBid}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!campaignStats?.length && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                          No campaign data available yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaignStats?.slice(0, 5).map((campaign: any, index: number) => (
                    <div key={campaign.campaignId} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{campaign.campaignName}</p>
                          <p className="text-sm text-slate-500">
                            Clicks: {campaign.clicks} | CVR: {campaign.cvr}%
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">${campaign.revenue}</p>
                        <p className="text-sm text-slate-500">Revenue</p>
                      </div>
                    </div>
                  ))}
                  {!campaignStats?.length && (
                    <p className="text-center text-slate-500 py-8">No campaign data available yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Campaign Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600">Total Campaigns</p>
                        <p className="text-2xl font-bold text-blue-600">{campaignStats?.length || 0}</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600">Total Revenue</p>
                        <p className="text-2xl font-bold text-green-600">
                          ${campaignStats?.reduce((sum: number, c: any) => sum + parseFloat(c.revenue), 0).toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600">Total Clicks</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {campaignStats?.reduce((sum: number, c: any) => sum + c.clicks, 0).toLocaleString() || '0'}
                        </p>
                      </div>
                      <BarChart className="h-8 w-8 text-purple-600" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="questions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Question Performance Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Question</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Responses</TableHead>
                      <TableHead>Response Rate</TableHead>
                      <TableHead>CTR</TableHead>
                      <TableHead>CVR</TableHead>
                      <TableHead>EPC</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {questionStats?.map((stat: any) => (
                      <TableRow key={stat.questionId}>
                        <TableCell className="font-medium max-w-xs truncate">{stat.questionText}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {stat.questionType || 'multiple_choice'}
                          </span>
                        </TableCell>
                        <TableCell>{stat.views.toLocaleString()}</TableCell>
                        <TableCell>{stat.responses || 0}</TableCell>
                        <TableCell>
                          <span className="text-indigo-600 font-medium">
                            {stat.views > 0 ? ((stat.responses || 0) / stat.views * 100).toFixed(1) : '0.0'}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-green-600 font-medium">{stat.ctr}%</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-blue-600 font-medium">{stat.cvr}%</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-emerald-600 font-medium">${stat.epc}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!questionStats?.length && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-slate-500 py-8">
                          No question data available yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {questionStats?.slice(0, 5).map((question: any, index: number) => (
                    <div key={question.questionId} className="flex items-start justify-between p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-1">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-800 leading-tight">{question.questionText}</p>
                          <p className="text-sm text-slate-500 mt-1">
                            Views: {question.views} | CTR: {question.ctr}%
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-emerald-600">${question.epc}</p>
                        <p className="text-sm text-slate-500">EPC</p>
                      </div>
                    </div>
                  ))}
                  {!questionStats?.length && (
                    <p className="text-center text-slate-500 py-8">No question data available yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Question Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600">Total Questions</p>
                        <p className="text-2xl font-bold text-blue-600">{questionStats?.length || 0}</p>
                      </div>
                      <BarChart className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600">Total Views</p>
                        <p className="text-2xl font-bold text-green-600">
                          {questionStats?.reduce((sum: number, q: any) => sum + q.views, 0).toLocaleString() || '0'}
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600">Avg Response Rate</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {questionStats?.length > 0 
                            ? (questionStats.reduce((sum: number, q: any) => sum + (q.views > 0 ? ((q.responses || 0) / q.views * 100) : 0), 0) / questionStats.length).toFixed(1)
                            : '0.0'
                          }%
                        </p>
                      </div>
                      <BarChart className="h-8 w-8 text-purple-600" />
                    </div>
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
