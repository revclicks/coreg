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

export default function EnhancedStats() {
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

  if (loadingCampaigns || loadingQuestions) {
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

  // Calculate totals
  const totals = campaignStats.reduce((acc: any, campaign: any) => ({
    impressions: acc.impressions + Number(campaign.impressions),
    clicks: acc.clicks + Number(campaign.clicks),
    conversions: acc.conversions + Number(campaign.conversions),
    spend: acc.spend + Number(campaign.spend),
    revenue: acc.revenue + Number(campaign.revenue),
  }), { impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0 });

  const overallCTR = totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(2) : '0.00';
  const overallCVR = totals.clicks > 0 ? ((totals.conversions / totals.clicks) * 100).toFixed(2) : '0.00';
  const overallROI = totals.spend > 0 ? (((totals.revenue - totals.spend) / totals.spend) * 100).toFixed(2) : '0.00';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Enhanced Analytics</h1>
          <p className="text-muted-foreground">Comprehensive campaign performance with impressions, clicks, CTR, CVR, spend, revenue, and conversions</p>
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              {dateRange.from ? (
                dateRange.to ? (
                  `${format(dateRange.from, "LLL dd")} - ${format(dateRange.to, "LLL dd")}`
                ) : (
                  format(dateRange.from, "LLL dd, y")
                )
              ) : (
                "Select date range"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange.from}
              selected={{
                from: dateRange.from,
                to: dateRange.to,
              }}
              onSelect={setDateRange as any}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.impressions.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.clicks.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CTR</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallCTR}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CVR</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallCVR}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totals.spend.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totals.revenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">ROI: {overallROI}%</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Campaign Performance
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
              <p className="text-sm text-muted-foreground">
                Complete performance metrics including impressions, clicks, CTR, CVR, spend, revenue, conversions, CPC bid, and daily budget
              </p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Vertical</TableHead>
                    <TableHead>Impressions</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>CTR</TableHead>
                    <TableHead>CVR</TableHead>
                    <TableHead>Conversions</TableHead>
                    <TableHead>Spend</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>CPC Bid</TableHead>
                    <TableHead>Daily Budget</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaignStats.map((campaign: any) => (
                    <TableRow key={campaign.campaignId}>
                      <TableCell className="font-medium">{campaign.campaignName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{campaign.vertical}</Badge>
                      </TableCell>
                      <TableCell>{Number(campaign.impressions).toLocaleString()}</TableCell>
                      <TableCell>{Number(campaign.clicks).toLocaleString()}</TableCell>
                      <TableCell>{campaign.ctr}%</TableCell>
                      <TableCell>{campaign.cvr}%</TableCell>
                      <TableCell>{Number(campaign.conversions).toLocaleString()}</TableCell>
                      <TableCell>${Number(campaign.spend).toFixed(2)}</TableCell>
                      <TableCell className="text-green-600 font-medium">
                        ${Number(campaign.revenue).toFixed(2)}
                      </TableCell>
                      <TableCell>${Number(campaign.cpcBid).toFixed(2)}</TableCell>
                      <TableCell>
                        {campaign.dailyBudget ? `$${Number(campaign.dailyBudget).toFixed(2)}` : 'Unlimited'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {campaignStats.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center text-muted-foreground">
                        No campaign data available for the selected period
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Question Performance Analytics</CardTitle>
              <p className="text-sm text-muted-foreground">
                Analysis of question performance and user engagement
              </p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Responses</TableHead>
                    <TableHead>Response Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questionStats.map((question: any) => (
                    <TableRow key={question.questionId}>
                      <TableCell className="font-medium">{question.questionText}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{question.questionType}</Badge>
                      </TableCell>
                      <TableCell>{Number(question.responses).toLocaleString()}</TableCell>
                      <TableCell>{Number(question.responseRate || 0).toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                  {questionStats.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No question data available for the selected period
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}