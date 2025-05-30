import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, TrendingUp, TrendingDown, DollarSign, Users, MousePointer, Target, Clock, BarChart3 } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell, ComposedChart, Area, AreaChart } from "recharts";

interface AdvancedStats {
  overview: {
    totalImpressions: number;
    totalClicks: number;
    totalConversions: number;
    totalRevenue: number;
    totalSpend: number;
    averageCTR: number;
    averageCVR: number;
    averageCPC: number;
    averageRevPerConversion: number;
    roi: number;
  };
  timeSeriesData: Array<{
    date: string;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
    spend: number;
    ctr: number;
    cvr: number;
    cpc: number;
  }>;
  campaignPerformance: Array<{
    campaignId: number;
    campaignName: string;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
    spend: number;
    ctr: number;
    cvr: number;
    cpc: number;
    roi: number;
    status: string;
  }>;
  questionPerformance: Array<{
    questionId: number;
    questionText: string;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
    ctr: number;
    cvr: number;
    averageRevenue: number;
  }>;
  deviceBreakdown: Array<{
    device: string;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
    ctr: number;
    cvr: number;
  }>;
  hourlyPerformance: Array<{
    hour: number;
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    cvr: number;
  }>;
  verticalPerformance: Array<{
    vertical: string;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
    ctr: number;
    cvr: number;
  }>;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];

export default function AdvancedAnalytics() {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [selectedMetric, setSelectedMetric] = useState<string>('revenue');

  const { data: statsData, isLoading } = useQuery({
    queryKey: ['/api/stats/advanced', dateRange, selectedCampaign],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange.start) params.append('startDate', dateRange.start);
      if (dateRange.end) params.append('endDate', dateRange.end);
      if (selectedCampaign !== 'all') params.append('campaignId', selectedCampaign);
      
      const response = await fetch(`/api/stats/advanced?${params}`);
      return response.json() as Promise<AdvancedStats>;
    },
  });

  const { data: campaigns } = useQuery({
    queryKey: ['/api/campaigns'],
    queryFn: async () => {
      const response = await fetch('/api/campaigns');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Advanced Analytics</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const stats = statsData?.overview;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Advanced Analytics</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="campaign">Campaign:</Label>
            <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
              <SelectTrigger className="w-48">
                <SelectValue />
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
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="start-date">From:</Label>
            <Input
              id="start-date"
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="end-date">To:</Label>
            <Input
              id="end-date"
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-40"
            />
          </div>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Total Impressions</p>
                <p className="text-2xl font-bold">{(stats?.totalImpressions || 0).toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Total Clicks</p>
                <p className="text-2xl font-bold">{(stats?.totalClicks || 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">CTR: {(stats?.averageCTR || 0).toFixed(2)}%</p>
              </div>
              <MousePointer className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Conversions</p>
                <p className="text-2xl font-bold">{(stats?.totalConversions || 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">CVR: {(stats?.averageCVR || 0).toFixed(2)}%</p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold">${(stats?.totalRevenue || 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Per Conv: ${(stats?.averageRevPerConversion || 0).toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">ROI</p>
                <p className="text-2xl font-bold">{(stats?.roi || 0).toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">CPC: ${(stats?.averageCPC || 0).toFixed(2)}</p>
              </div>
              {(stats?.roi || 0) > 0 ? (
                <TrendingUp className="h-8 w-8 text-green-600" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-600" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="performance">Performance Trends</TabsTrigger>
          <TabsTrigger value="campaigns">Campaign Analysis</TabsTrigger>
          <TabsTrigger value="questions">Question Performance</TabsTrigger>
          <TabsTrigger value="devices">Device Breakdown</TabsTrigger>
          <TabsTrigger value="timing">Time Analysis</TabsTrigger>
          <TabsTrigger value="verticals">Vertical Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Trends Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={statsData?.timeSeriesData || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Area yAxisId="left" type="monotone" dataKey="impressions" fill="#8884d8" stroke="#8884d8" fillOpacity={0.3} />
                    <Bar yAxisId="left" dataKey="clicks" fill="#82ca9d" />
                    <Line yAxisId="right" type="monotone" dataKey="ctr" stroke="#ff7300" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue vs Spend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={statsData?.timeSeriesData || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="revenue" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                      <Area type="monotone" dataKey="spend" stackId="2" stroke="#8884d8" fill="#8884d8" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conversion Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={statsData?.timeSeriesData || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="ctr" stroke="#8884d8" strokeWidth={2} />
                      <Line type="monotone" dataKey="cvr" stroke="#82ca9d" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Impressions</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>CTR</TableHead>
                    <TableHead>Conversions</TableHead>
                    <TableHead>CVR</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>CPC</TableHead>
                    <TableHead>ROI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statsData?.campaignPerformance?.map((campaign) => (
                    <TableRow key={campaign.campaignId}>
                      <TableCell className="font-medium">{campaign.campaignName}</TableCell>
                      <TableCell>
                        <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                          {campaign.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{campaign.impressions.toLocaleString()}</TableCell>
                      <TableCell>{campaign.clicks.toLocaleString()}</TableCell>
                      <TableCell>{campaign.ctr.toFixed(2)}%</TableCell>
                      <TableCell>{campaign.conversions.toLocaleString()}</TableCell>
                      <TableCell>{campaign.cvr.toFixed(2)}%</TableCell>
                      <TableCell>${campaign.revenue.toLocaleString()}</TableCell>
                      <TableCell>${campaign.cpc.toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={campaign.roi >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {campaign.roi.toFixed(1)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Question Performance Optimization</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question</TableHead>
                    <TableHead>Impressions</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>CTR</TableHead>
                    <TableHead>Conversions</TableHead>
                    <TableHead>CVR</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Avg Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statsData?.questionPerformance?.map((question) => (
                    <TableRow key={question.questionId}>
                      <TableCell className="font-medium max-w-xs truncate">
                        {question.questionText}
                      </TableCell>
                      <TableCell>{question.impressions.toLocaleString()}</TableCell>
                      <TableCell>{question.clicks.toLocaleString()}</TableCell>
                      <TableCell>{question.ctr.toFixed(2)}%</TableCell>
                      <TableCell>{question.conversions.toLocaleString()}</TableCell>
                      <TableCell>{question.cvr.toFixed(2)}%</TableCell>
                      <TableCell>${question.revenue.toLocaleString()}</TableCell>
                      <TableCell>${question.averageRevenue.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Device Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statsData?.deviceBreakdown || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ device, value }) => `${device}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="impressions"
                      >
                        {statsData?.deviceBreakdown?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Device Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Device</TableHead>
                      <TableHead>CTR</TableHead>
                      <TableHead>CVR</TableHead>
                      <TableHead>Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statsData?.deviceBreakdown?.map((device) => (
                      <TableRow key={device.device}>
                        <TableCell className="font-medium">{device.device}</TableCell>
                        <TableCell>{device.ctr.toFixed(2)}%</TableCell>
                        <TableCell>{device.cvr.toFixed(2)}%</TableCell>
                        <TableCell>${device.revenue.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Hourly Performance Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statsData?.hourlyPerformance || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="impressions" fill="#8884d8" />
                    <Bar dataKey="clicks" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verticals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vertical Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vertical</TableHead>
                    <TableHead>Impressions</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>CTR</TableHead>
                    <TableHead>Conversions</TableHead>
                    <TableHead>CVR</TableHead>
                    <TableHead>Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statsData?.verticalPerformance?.map((vertical) => (
                    <TableRow key={vertical.vertical}>
                      <TableCell className="font-medium">{vertical.vertical}</TableCell>
                      <TableCell>{vertical.impressions.toLocaleString()}</TableCell>
                      <TableCell>{vertical.clicks.toLocaleString()}</TableCell>
                      <TableCell>{vertical.ctr.toFixed(2)}%</TableCell>
                      <TableCell>{vertical.conversions.toLocaleString()}</TableCell>
                      <TableCell>{vertical.cvr.toFixed(2)}%</TableCell>
                      <TableCell>${vertical.revenue.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}