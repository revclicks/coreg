import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Edit, Copy, Trash2, Calendar as CalendarIcon, TrendingUp, Eye, MousePointer, Target, DollarSign } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { queryClient } from "@/lib/queryClient";
import AddCampaignModal from "@/components/modals/add-campaign-modal";
import type { Campaign } from "@shared/schema";

export default function Campaigns() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 7),
    to: new Date()
  });
  const [timeframe, setTimeframe] = useState("7d");

  const { data: campaigns, isLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

  const { data: campaignStats, isLoading: loadingStats } = useQuery({
    queryKey: ["/api/campaigns/stats", dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange.from) params.append("startDate", dateRange.from.toISOString());
      if (dateRange.to) params.append("endDate", dateRange.to.toISOString());
      
      const response = await fetch(`/api/campaigns/stats?${params}`);
      return response.json();
    }
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      const response = await fetch(`/api/campaigns/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ active }),
      });
      if (!response.ok) throw new Error("Failed to update campaign");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/campaigns/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete campaign");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
    },
  });

  const handleTimeframeChange = (value: string) => {
    setTimeframe(value);
    const now = new Date();
    let from: Date;
    
    switch (value) {
      case "1d":
        from = subDays(now, 1);
        break;
      case "7d":
        from = subDays(now, 7);
        break;
      case "30d":
        from = subDays(now, 30);
        break;
      case "90d":
        from = subDays(now, 90);
        break;
      default:
        from = subDays(now, 7);
    }
    
    setDateRange({ from, to: now });
  };

  const getCampaignStats = (campaignId: number) => {
    return campaignStats?.find((stat: any) => stat.campaignId === campaignId) || {
      impressions: 0,
      clicks: 0,
      conversions: 0,
      spend: 0,
      revenue: 0,
      ctr: 0,
      cvr: 0
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setShowAddModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this campaign?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggle = (id: number, active: boolean) => {
    toggleMutation.mutate({ id, active });
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingCampaign(null);
  };

  const getVerticalColor = (vertical: string) => {
    const colors: Record<string, string> = {
      health: "bg-blue-100 text-blue-800",
      finance: "bg-green-100 text-green-800",
      technology: "bg-purple-100 text-purple-800",
      energy: "bg-amber-100 text-amber-800",
      travel: "bg-pink-100 text-pink-800",
    };
    return colors[vertical.toLowerCase()] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Campaign Performance Dashboard</CardTitle>
            <div className="flex items-center space-x-4">
              <Select value={timeframe} onValueChange={handleTimeframeChange}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">Last Day</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-auto">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd")} - {format(dateRange.to, "LLL dd")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      "Pick a date"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setDateRange({ from: range.from, to: range.to });
                        setTimeframe("custom");
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
              
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Campaign
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Performance Summary Cards */}
      {campaignStats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Eye className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Impressions</p>
                  <p className="text-2xl font-bold">{campaignStats.reduce((sum: number, stat: any) => sum + (stat.impressions || 0), 0).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <MousePointer className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Clicks</p>
                  <p className="text-2xl font-bold">{campaignStats.reduce((sum: number, stat: any) => sum + (stat.clicks || 0), 0).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Conversions</p>
                  <p className="text-2xl font-bold">{campaignStats.reduce((sum: number, stat: any) => sum + (stat.conversions || 0), 0).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Spend</p>
                  <p className="text-2xl font-bold">{formatCurrency(campaignStats.reduce((sum: number, stat: any) => sum + (stat.spend || 0), 0))}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-slate-600">Avg. CTR</p>
                  <p className="text-2xl font-bold">
                    {campaignStats.length > 0 ? 
                      (campaignStats.reduce((sum: number, stat: any) => sum + (stat.ctr || 0), 0) / campaignStats.length).toFixed(2) 
                      : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Campaign Table */}
      <Card>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold">Campaign</TableHead>
                  <TableHead className="font-semibold">Delivery</TableHead>
                  <TableHead className="font-semibold">Daily Budget</TableHead>
                  <TableHead className="font-semibold">Spend</TableHead>
                  <TableHead className="font-semibold">Impressions</TableHead>
                  <TableHead className="font-semibold">CPM</TableHead>
                  <TableHead className="font-semibold">CTR</TableHead>
                  <TableHead className="font-semibold">CPC</TableHead>
                  <TableHead className="font-semibold">Conversions</TableHead>
                  <TableHead className="font-semibold">Conv. Rate</TableHead>
                  <TableHead className="font-semibold">Cost per Conv.</TableHead>
                  <TableHead className="font-semibold">Revenue</TableHead>
                  <TableHead className="font-semibold">ROAS</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns?.map((campaign) => {
                  const stats = getCampaignStats(campaign.id);
                  const cpm = stats.impressions > 0 ? (stats.spend / stats.impressions) * 1000 : 0;
                  const costPerConversion = stats.conversions > 0 ? stats.spend / stats.conversions : 0;
                  const roas = stats.spend > 0 ? (stats.revenue / stats.spend) * 100 : 0;
                  
                  return (
                    <TableRow key={campaign.id} className="hover:bg-slate-50">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${campaign.active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          <div>
                            <p className="font-medium text-slate-800">{campaign.name}</p>
                            <p className="text-xs text-slate-500">ID: {campaign.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          campaign.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {campaign.active ? 'Active' : 'Paused'}
                        </span>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <span className="font-medium">{formatCurrency(Number(campaign.dailyBudget) || 0)}</span>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <span className="font-medium">{formatCurrency(stats.spend)}</span>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <span className="font-medium">{stats.impressions.toLocaleString()}</span>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <span className="font-medium">{formatCurrency(cpm)}</span>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <span className={`font-medium ${stats.ctr > 0 ? 'text-blue-600' : 'text-gray-500'}`}>
                          {stats.ctr ? `${stats.ctr.toFixed(2)}%` : '0.00%'}
                        </span>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <span className="font-medium">{formatCurrency(Number(campaign.cpcBid))}</span>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <span className="font-medium">{stats.conversions.toLocaleString()}</span>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <span className={`font-medium ${stats.cvr > 0 ? 'text-purple-600' : 'text-gray-500'}`}>
                          {stats.cvr ? `${stats.cvr.toFixed(2)}%` : '0.00%'}
                        </span>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <span className="font-medium">{formatCurrency(costPerConversion)}</span>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <span className={`font-medium ${stats.revenue > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                          {formatCurrency(stats.revenue)}
                        </span>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <span className={`font-medium ${roas > 100 ? 'text-green-600' : roas > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                          {roas > 0 ? `${roas.toFixed(1)}%` : '0.0%'}
                        </span>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(campaign)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(campaign.id)}
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

      <AddCampaignModal
        open={showAddModal}
        onClose={handleCloseModal}
        editingCampaign={editingCampaign}
      />
    </div>
  );
}
