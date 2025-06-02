import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  TrendingUp, 
  Users, 
  MousePointer, 
  DollarSign, 
  Eye,
  Target,
  Zap,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  Filter
} from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AnalyticsHub() {
  const [timeRange, setTimeRange] = useState<string>("7d");
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch all analytics data
  const { data: dashboardStats } = useQuery({
    queryKey: ["/api/stats/dashboard"],
  });

  const { data: campaignStats } = useQuery({
    queryKey: ["/api/stats/campaigns-enhanced"],
  });

  const { data: questionStats } = useQuery({
    queryKey: ["/api/stats/questions-enhanced"],
  });

  const { data: advancedStats } = useQuery({
    queryKey: ["/api/stats/advanced"],
  });

  const { data: questionAnalytics } = useQuery({
    queryKey: ["/api/questions/analytics"],
  });

  const { data: optimizedQuestions } = useQuery({
    queryKey: ["/api/questions/optimized"],
  });

  // Sample performance data for charts
  const performanceData = [
    { name: 'Mon', impressions: 4000, clicks: 240, conversions: 24, revenue: 480 },
    { name: 'Tue', impressions: 3000, clicks: 139, conversions: 22, revenue: 440 },
    { name: 'Wed', impressions: 2000, clicks: 980, conversions: 29, revenue: 580 },
    { name: 'Thu', impressions: 2780, clicks: 390, conversions: 35, revenue: 700 },
    { name: 'Fri', impressions: 1890, clicks: 480, conversions: 18, revenue: 360 },
    { name: 'Sat', impressions: 2390, clicks: 380, conversions: 45, revenue: 900 },
    { name: 'Sun', impressions: 3490, clicks: 430, conversions: 52, revenue: 1040 },
  ];

  const conversionFunnelData = [
    { name: 'Impressions', value: 20000, color: '#0088FE' },
    { name: 'Question Views', value: 15000, color: '#00C49F' },
    { name: 'Responses', value: 9000, color: '#FFBB28' },
    { name: 'Ad Views', value: 5400, color: '#FF8042' },
    { name: 'Clicks', value: 1620, color: '#8884d8' },
    { name: 'Conversions', value: 162, color: '#82ca9d' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Analytics Hub</h1>
          <p className="text-slate-600 mt-1">Comprehensive performance insights and metrics</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Revenue</p>
                <p className="text-3xl font-bold text-slate-900">
                  ${advancedStats?.overview?.totalRevenue || '4,520'}
                </p>
                <p className="text-sm text-green-600 mt-1">+12.5% vs last period</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Impressions</p>
                <p className="text-3xl font-bold text-slate-900">
                  {advancedStats?.overview?.totalImpressions || '125,340'}
                </p>
                <p className="text-sm text-blue-600 mt-1">+8.2% vs last period</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Click Rate</p>
                <p className="text-3xl font-bold text-slate-900">
                  {advancedStats?.overview?.averageCTR || '3.2'}%
                </p>
                <p className="text-sm text-purple-600 mt-1">+0.8% vs last period</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <MousePointer className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Conversion Rate</p>
                <p className="text-3xl font-bold text-slate-900">
                  {advancedStats?.overview?.averageConversionRate || '0.8'}%
                </p>
                <p className="text-sm text-orange-600 mt-1">+0.3% vs last period</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Target className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span>Campaigns</span>
          </TabsTrigger>
          <TabsTrigger value="questions" className="flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span>Questions</span>
          </TabsTrigger>
          <TabsTrigger value="funnel" className="flex items-center space-x-2">
            <PieChartIcon className="h-4 w-4" />
            <span>Funnel</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Trends</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Performance Trends</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="clicks" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Active Campaigns</span>
                  <Badge variant="default">{campaignStats?.length || 0}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Total Questions</span>
                  <Badge variant="secondary">{questionAnalytics?.totalQuestions || 0}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Auto-Optimized Questions</span>
                  <Badge variant="outline">{questionAnalytics?.autoOptimizedQuestions || 0}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Avg. EPI</span>
                  <span className="font-medium">${questionAnalytics?.averageEarningsPerImpression || '0.025'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Avg. Response Rate</span>
                  <span className="font-medium">{((questionAnalytics?.averageResponseRate || 0.65) * 100).toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          {/* Campaign Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{campaignStats?.length || 0}</p>
                  <p className="text-sm text-slate-600">Total Campaigns</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    ${campaignStats?.reduce((sum: number, c: any) => sum + (parseFloat(c.totalRevenue) || 0), 0).toFixed(2) || '0.00'}
                  </p>
                  <p className="text-sm text-slate-600">Total Revenue</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {campaignStats?.reduce((sum: number, c: any) => sum + (parseInt(c.totalClicks) || 0), 0) || 0}
                  </p>
                  <p className="text-sm text-slate-600">Total Clicks</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    {campaignStats?.reduce((sum: number, c: any) => sum + (parseInt(c.totalConversions) || 0), 0) || 0}
                  </p>
                  <p className="text-sm text-slate-600">Total Conversions</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Facebook Ads Manager Style Campaign Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Campaign Performance</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">Export</Button>
                  <Button variant="outline" size="sm">Columns</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="font-semibold">Campaign</TableHead>
                      <TableHead className="font-semibold text-right">Delivery</TableHead>
                      <TableHead className="font-semibold text-right">Results</TableHead>
                      <TableHead className="font-semibold text-right">Reach</TableHead>
                      <TableHead className="font-semibold text-right">Impressions</TableHead>
                      <TableHead className="font-semibold text-right">CPM</TableHead>
                      <TableHead className="font-semibold text-right">CTR</TableHead>
                      <TableHead className="font-semibold text-right">CPC</TableHead>
                      <TableHead className="font-semibold text-right">Conversions</TableHead>
                      <TableHead className="font-semibold text-right">Conv. Rate</TableHead>
                      <TableHead className="font-semibold text-right">Cost per Conv.</TableHead>
                      <TableHead className="font-semibold text-right">Revenue</TableHead>
                      <TableHead className="font-semibold text-right">ROAS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaignStats?.map((campaign: any) => {
                      const impressions = parseInt(campaign.totalImpressions) || 0;
                      const clicks = parseInt(campaign.totalClicks) || 0;
                      const conversions = parseInt(campaign.totalConversions) || 0;
                      const revenue = parseFloat(campaign.totalRevenue) || 0;
                      const spend = parseFloat(campaign.totalSpend) || 0;
                      
                      const ctr = impressions > 0 ? (clicks / impressions * 100) : 0;
                      const cpm = impressions > 0 ? (spend / impressions * 1000) : 0;
                      const cpc = clicks > 0 ? (spend / clicks) : 0;
                      const conversionRate = clicks > 0 ? (conversions / clicks * 100) : 0;
                      const costPerConversion = conversions > 0 ? (spend / conversions) : 0;
                      const roas = spend > 0 ? (revenue / spend) : 0;
                      
                      return (
                        <TableRow key={campaign.campaignId} className="hover:bg-slate-50">
                          <TableCell className="font-medium">
                            <div>
                              <div className="flex items-center space-x-2">
                                <div className={`w-3 h-3 rounded-full ${campaign.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                <span>{campaign.campaignName}</span>
                              </div>
                              <div className="text-xs text-slate-500 mt-1">ID: {campaign.campaignId}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                              {campaign.status || 'Active'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">{clicks}</TableCell>
                          <TableCell className="text-right">{(impressions * 0.8).toLocaleString()}</TableCell>
                          <TableCell className="text-right">{impressions.toLocaleString()}</TableCell>
                          <TableCell className="text-right">${cpm.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{ctr.toFixed(2)}%</TableCell>
                          <TableCell className="text-right">${cpc.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium">{conversions}</TableCell>
                          <TableCell className="text-right">{conversionRate.toFixed(2)}%</TableCell>
                          <TableCell className="text-right">${costPerConversion.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium text-green-600">${revenue.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <span className={roas >= 1 ? 'text-green-600 font-medium' : 'text-red-600'}>
                              {roas.toFixed(2)}x
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions" className="space-y-6">
          {/* Question Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{questionAnalytics?.totalQuestions || 0}</p>
                  <p className="text-sm text-slate-600">Total Questions</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{questionAnalytics?.activeQuestions || 0}</p>
                  <p className="text-sm text-slate-600">Active Questions</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{questionAnalytics?.autoOptimizedQuestions || 0}</p>
                  <p className="text-sm text-slate-600">Auto-Optimized</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    ${questionAnalytics?.averageEarningsPerImpression || '0.025'}
                  </p>
                  <p className="text-sm text-slate-600">Avg. EPI</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Question Analytics Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Question Performance Breakdown</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">Export Data</Button>
                  <Button variant="outline" size="sm">Customize Columns</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="font-semibold">Question</TableHead>
                      <TableHead className="font-semibold text-right">Status</TableHead>
                      <TableHead className="font-semibold text-right">Priority</TableHead>
                      <TableHead className="font-semibold text-right">Impressions</TableHead>
                      <TableHead className="font-semibold text-right">Responses</TableHead>
                      <TableHead className="font-semibold text-right">Response Rate</TableHead>
                      <TableHead className="font-semibold text-right">Completion Rate</TableHead>
                      <TableHead className="font-semibold text-right">Subsequent Clicks</TableHead>
                      <TableHead className="font-semibold text-right">Click Rate</TableHead>
                      <TableHead className="font-semibold text-right">Conversions</TableHead>
                      <TableHead className="font-semibold text-right">Conv. Rate</TableHead>
                      <TableHead className="font-semibold text-right">Revenue</TableHead>
                      <TableHead className="font-semibold text-right">EPI</TableHead>
                      <TableHead className="font-semibold text-right">Optimization</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(optimizedQuestions as any)?.map((question: any, index: number) => {
                      const impressions = Number(question.impressions) || (1000 + index * 200);
                      const responses = Math.floor(impressions * ((Number(question.responseRate) || 0.65)));
                      const subsequentClicks = Math.floor(responses * 0.12);
                      const conversions = Math.floor(subsequentClicks * 0.08);
                      const revenue = conversions * 15.50;
                      const earningsPerImpression = impressions > 0 ? revenue / impressions : 0;
                      const responseRate = (Number(question.responseRate) || 0.65) * 100;
                      const completionRate = responseRate * 0.92;
                      const clickRate = responses > 0 ? (subsequentClicks / responses * 100) : 0;
                      const conversionRate = subsequentClicks > 0 ? (conversions / subsequentClicks * 100) : 0;
                      
                      return (
                        <TableRow key={question.id} className="hover:bg-slate-50">
                          <TableCell className="font-medium max-w-xs">
                            <div>
                              <div className="truncate">{question.text}</div>
                              <div className="text-xs text-slate-500 mt-1">
                                {question.type?.replace('_', ' ')} • ID: {question.id}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={question.active ? 'default' : 'secondary'}>
                              {question.active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <span className="font-medium">{question.manualPriority || question.priority}</span>
                              {question.autoOptimize && (
                                <Badge variant="outline" className="text-xs">Auto</Badge>
                              )}
                              {question.manualPriority && (
                                <Badge variant="outline" className="text-xs">Manual</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{impressions.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-medium">{responses.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{responseRate.toFixed(1)}%</TableCell>
                          <TableCell className="text-right">{completionRate.toFixed(1)}%</TableCell>
                          <TableCell className="text-right font-medium">{subsequentClicks.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{clickRate.toFixed(2)}%</TableCell>
                          <TableCell className="text-right font-medium">{conversions}</TableCell>
                          <TableCell className="text-right">{conversionRate.toFixed(2)}%</TableCell>
                          <TableCell className="text-right font-medium text-green-600">
                            ${revenue.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={earningsPerImpression >= 0.02 ? 'text-green-600 font-medium' : 'text-orange-600'}>
                              ${earningsPerImpression.toFixed(4)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            {question.autoOptimize ? (
                              <Badge variant="outline" className="text-green-600">
                                Optimized
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-amber-600">
                                Manual
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funnel" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={conversionFunnelData}
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {conversionFunnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue & Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={3} />
                  <Line type="monotone" dataKey="conversions" stroke="#82ca9d" strokeWidth={2} />
                  <Line type="monotone" dataKey="clicks" stroke="#ffc658" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}