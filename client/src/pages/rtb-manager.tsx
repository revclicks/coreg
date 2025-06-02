import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Activity, TrendingUp, Target, Clock, DollarSign, MousePointer, Eye, Zap } from "lucide-react";

export default function RTBManager() {
  const [selectedTimeRange, setSelectedTimeRange] = useState("24h");

  const { data: rtbAnalytics } = useQuery({
    queryKey: ["/api/rtb/analytics"],
  });

  const { data: campaigns } = useQuery({
    queryKey: ["/api/campaigns"],
  });

  // Sample RTB performance data
  const rtbPerformanceData = [
    { time: '00:00', bidRequests: 1200, bids: 980, wins: 120, winRate: 12.2, avgPrice: 0.45 },
    { time: '04:00', bidRequests: 800, bids: 650, wins: 85, winRate: 13.1, avgPrice: 0.48 },
    { time: '08:00', bidRequests: 2100, bids: 1800, wins: 280, winRate: 15.6, avgPrice: 0.52 },
    { time: '12:00', bidRequests: 2800, bids: 2400, wins: 420, winRate: 17.5, avgPrice: 0.58 },
    { time: '16:00', bidRequests: 3200, bids: 2900, wins: 520, winRate: 17.9, avgPrice: 0.61 },
    { time: '20:00', bidRequests: 2600, bids: 2200, wins: 380, winRate: 17.3, avgPrice: 0.55 },
  ];

  const deviceBreakdown = [
    { name: 'Mobile', value: 65, color: '#8884d8' },
    { name: 'Desktop', value: 30, color: '#82ca9d' },
    { name: 'Tablet', value: 5, color: '#ffc658' },
  ];

  const topCampaigns = [
    { id: 1, name: 'Premium Insurance Leads', bidRequests: 1250, wins: 180, winRate: 14.4, avgCpc: 0.65, revenue: 117.0 },
    { id: 2, name: 'Health & Wellness', bidRequests: 980, wins: 120, winRate: 12.2, avgCpc: 0.42, revenue: 50.4 },
    { id: 3, name: 'Financial Services', bidRequests: 750, wins: 95, winRate: 12.7, avgCpc: 0.58, revenue: 55.1 },
    { id: 4, name: 'Education Programs', bidRequests: 650, wins: 70, winRate: 10.8, avgCpc: 0.35, revenue: 24.5 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Real-Time Bidding Manager</h1>
          <p className="text-muted-foreground">
            Monitor and optimize your RTB auction performance in real-time
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Activity className="w-4 h-4 mr-2" />
            Live View
          </Button>
        </div>
      </div>

      {/* RTB Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Bid Requests</p>
                <div className="flex items-center">
                  <p className="text-2xl font-bold">{rtbAnalytics?.totalBidRequests || 12400}</p>
                  <Badge variant="secondary" className="ml-2">+15%</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Bids</p>
                <div className="flex items-center">
                  <p className="text-2xl font-bold">{rtbAnalytics?.totalBids || 10250}</p>
                  <Badge variant="secondary" className="ml-2">+12%</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Win Rate</p>
                <div className="flex items-center">
                  <p className="text-2xl font-bold">{((rtbAnalytics?.averageWinRate || 0.15) * 100).toFixed(1)}%</p>
                  <Badge variant="secondary" className="ml-2">+3%</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                <div className="flex items-center">
                  <p className="text-2xl font-bold">${rtbAnalytics?.totalRevenue || 2450}</p>
                  <Badge variant="secondary" className="ml-2">+8%</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="auctions">Live Auctions</TabsTrigger>
          <TabsTrigger value="campaigns">Campaign Performance</TabsTrigger>
          <TabsTrigger value="optimization">Bid Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>RTB Performance Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={rtbPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="bidRequests" stroke="#8884d8" name="Bid Requests" />
                    <Line type="monotone" dataKey="wins" stroke="#82ca9d" name="Wins" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Device Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={deviceBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {deviceBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Win Rate by Hour</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={rtbPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="winRate" fill="#8884d8" name="Win Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auctions" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Live Auction Monitor</CardTitle>
                <Badge variant="outline" className="text-green-600">
                  <Zap className="w-3 h-3 mr-1" />
                  Live
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">125ms</p>
                    <p className="text-sm text-muted-foreground">Avg. Auction Time</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">3.2</p>
                    <p className="text-sm text-muted-foreground">Avg. Bids per Auction</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">$0.52</p>
                    <p className="text-sm text-muted-foreground">Avg. Winning Price</p>
                  </div>
                </div>
                
                <div className="text-center text-sm text-muted-foreground">
                  Real-time auction monitoring requires active traffic.
                  <br />
                  Live auctions will appear here when bid requests are received.
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign RTB Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead className="text-right">Bid Requests</TableHead>
                      <TableHead className="text-right">Wins</TableHead>
                      <TableHead className="text-right">Win Rate</TableHead>
                      <TableHead className="text-right">Avg. CPC</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topCampaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium">{campaign.name}</TableCell>
                        <TableCell className="text-right">{campaign.bidRequests.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-medium">{campaign.wins}</TableCell>
                        <TableCell className="text-right">{campaign.winRate.toFixed(1)}%</TableCell>
                        <TableCell className="text-right">${campaign.avgCpc.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          ${campaign.revenue.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="default">Active</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Bid Optimization Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Auto-Bidding Strategy</label>
                  <Select defaultValue="maximize_clicks">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="maximize_clicks">Maximize Clicks</SelectItem>
                      <SelectItem value="maximize_conversions">Maximize Conversions</SelectItem>
                      <SelectItem value="target_cpa">Target CPA</SelectItem>
                      <SelectItem value="manual">Manual Bidding</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Bid Adjustments</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Mobile</p>
                      <p className="font-medium">+10%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Desktop</p>
                      <p className="font-medium">+5%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Peak Hours</p>
                      <p className="font-medium">+15%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">High Value Users</p>
                      <p className="font-medium">+25%</p>
                    </div>
                  </div>
                </div>

                <Button className="w-full">Update Bid Strategy</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium text-blue-900">Increase Mobile Bids</p>
                      <p className="text-sm text-blue-700">Mobile shows 18% higher conversion rate</p>
                    </div>
                    <Badge variant="secondary">+18%</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium text-green-900">Optimize Peak Hours</p>
                      <p className="text-sm text-green-700">2-6 PM shows highest engagement</p>
                    </div>
                    <Badge variant="secondary">+22%</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div>
                      <p className="font-medium text-orange-900">Review Floor Prices</p>
                      <p className="text-sm text-orange-700">Consider lowering floor by 10%</p>
                    </div>
                    <Badge variant="secondary">+8%</Badge>
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