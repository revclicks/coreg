import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Download, Filter, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface Lead {
  id: number;
  campaignId: number;
  campaignName: string;
  companyName: string;
  questionText: string;
  userAnswer: string;
  leadResponse: "yes" | "no";
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  leadPrice: string;
  status: string;
  webhookDelivered: boolean;
  deliveryAttempts: number;
  createdAt: string;
  deliveredAt?: string;
}

interface LeadStats {
  totalLeads: number;
  deliveredLeads: number;
  failedDeliveries: number;
  totalValue: string;
  deliveryRate: string;
}

export default function LeadCollectionPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [campaignFilter, setCampaignFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: ""
  });

  // Fetch all leads
  const { data: leads = [], isLoading: leadsLoading, refetch: refetchLeads } = useQuery({
    queryKey: ['/api/leads', statusFilter, campaignFilter, dateRange.start, dateRange.end],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (campaignFilter !== "all") params.append("campaignId", campaignFilter);
      if (dateRange.start) params.append("startDate", dateRange.start);
      if (dateRange.end) params.append("endDate", dateRange.end);
      
      return fetch(`/api/leads?${params}`).then(res => res.json());
    }
  });

  // Fetch lead statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/leads/stats'],
    queryFn: () => fetch('/api/leads/stats').then(res => res.json())
  });

  // Fetch campaigns for filter
  const { data: campaigns = [] } = useQuery({
    queryKey: ['/api/campaigns'],
    queryFn: () => fetch('/api/campaigns?type=lead').then(res => res.json())
  });

  const handleRetryFailedDeliveries = async () => {
    try {
      await fetch('/api/leads/retry-failed', { method: 'POST' });
      refetchLeads();
    } catch (error) {
      console.error('Failed to retry deliveries:', error);
    }
  };

  const exportLeads = () => {
    const csvContent = [
      ['Campaign', 'Company', 'Question', 'User Answer', 'Lead Response', 'Email', 'Name', 'Phone', 'Price', 'Status', 'Delivered', 'Created At'].join(','),
      ...leads.map((lead: Lead) => [
        lead.campaignName || '',
        lead.companyName || '',
        `"${lead.questionText}"`,
        `"${lead.userAnswer}"`,
        lead.leadResponse,
        lead.email || '',
        `"${[lead.firstName, lead.lastName].filter(Boolean).join(' ')}"`,
        lead.phone || '',
        lead.leadPrice,
        lead.status,
        lead.webhookDelivered ? 'Yes' : 'No',
        format(new Date(lead.createdAt), 'yyyy-MM-dd HH:mm:ss')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (lead: Lead) => {
    if (lead.leadResponse === "no") {
      return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Declined</Badge>;
    }
    
    if (lead.webhookDelivered) {
      return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Delivered</Badge>;
    }
    
    if (lead.deliveryAttempts > 0) {
      return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>;
    }
    
    return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
  };

  const yesLeads = leads.filter((lead: Lead) => lead.leadResponse === "yes");
  const noLeads = leads.filter((lead: Lead) => lead.leadResponse === "no");

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Lead Collection</h1>
          <p className="text-gray-600 mt-2">Monitor and manage captured leads from campaigns</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetchLeads()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportLeads}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handleRetryFailedDeliveries}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Failed
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{statsLoading ? "..." : stats?.totalLeads || 0}</div>
            <p className="text-sm text-gray-600">Total Leads</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{yesLeads.length}</div>
            <p className="text-sm text-gray-600">Interested</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{statsLoading ? "..." : stats?.deliveredLeads || 0}</div>
            <p className="text-sm text-gray-600">Delivered</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{statsLoading ? "..." : stats?.failedDeliveries || 0}</div>
            <p className="text-sm text-gray-600">Failed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">${statsLoading ? "..." : stats?.totalValue || "0"}</div>
            <p className="text-sm text-gray-600">Total Value</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Campaign</label>
              <Select value={campaignFilter} onValueChange={setCampaignFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All campaigns" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  {campaigns.map((campaign: any) => (
                    <SelectItem key={campaign.id} value={campaign.id.toString()}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Lead Details</CardTitle>
          <CardDescription>
            View all captured leads and their delivery status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">All Leads ({leads.length})</TabsTrigger>
              <TabsTrigger value="interested">Interested ({yesLeads.length})</TabsTrigger>
              <TabsTrigger value="declined">Declined ({noLeads.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <LeadTable leads={leads} isLoading={leadsLoading} />
            </TabsContent>
            
            <TabsContent value="interested">
              <LeadTable leads={yesLeads} isLoading={leadsLoading} />
            </TabsContent>
            
            <TabsContent value="declined">
              <LeadTable leads={noLeads} isLoading={leadsLoading} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function LeadTable({ leads, isLoading }: { leads: Lead[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No leads found for the selected criteria
      </div>
    );
  }

  const getStatusBadge = (lead: Lead) => {
    if (lead.leadResponse === "no") {
      return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Declined</Badge>;
    }
    
    if (lead.webhookDelivered) {
      return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Delivered</Badge>;
    }
    
    if (lead.deliveryAttempts > 0) {
      return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>;
    }
    
    return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Campaign</TableHead>
            <TableHead>Question</TableHead>
            <TableHead>User Answer</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Response</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{lead.campaignName}</div>
                  <div className="text-sm text-gray-500">{lead.companyName}</div>
                </div>
              </TableCell>
              <TableCell>
                <div className="max-w-xs truncate" title={lead.questionText}>
                  {lead.questionText}
                </div>
              </TableCell>
              <TableCell>
                <div className="max-w-xs truncate" title={lead.userAnswer}>
                  {lead.userAnswer}
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{lead.email}</div>
                  {(lead.firstName || lead.lastName) && (
                    <div className="text-sm text-gray-500">
                      {[lead.firstName, lead.lastName].filter(Boolean).join(' ')}
                    </div>
                  )}
                  {lead.phone && (
                    <div className="text-sm text-gray-500">{lead.phone}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={lead.leadResponse === "yes" ? "default" : "secondary"}>
                  {lead.leadResponse === "yes" ? "Interested" : "Not Interested"}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="font-medium">${lead.leadPrice}</span>
              </TableCell>
              <TableCell>
                {getStatusBadge(lead)}
                {lead.deliveryAttempts > 1 && (
                  <div className="text-xs text-gray-500 mt-1">
                    {lead.deliveryAttempts} attempts
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {format(new Date(lead.createdAt), 'MMM dd, yyyy')}
                </div>
                <div className="text-xs text-gray-500">
                  {format(new Date(lead.createdAt), 'HH:mm')}
                </div>
                {lead.deliveredAt && (
                  <div className="text-xs text-green-600 mt-1">
                    Delivered: {format(new Date(lead.deliveredAt), 'MMM dd, HH:mm')}
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}