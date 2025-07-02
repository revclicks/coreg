import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Download, Eye, Filter, Search, Database, Users, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface FormSubmission {
  id: number;
  siteId: number;
  siteName: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  zipCode?: string;
  gender?: string;
  userData: any;
  submittedAt: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

interface Site {
  id: number;
  name: string;
  domain: string;
  status: string;
}

export default function FormDataPage() {
  const { toast } = useToast();
  const [selectedSite, setSelectedSite] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);

  const { data: sites } = useQuery<Site[]>({
    queryKey: ["/api/sites"],
  });

  const { data: submissions, isLoading } = useQuery<FormSubmission[]>({
    queryKey: ["/api/form-data", selectedSite, searchTerm, dateFilter],
  });

  const handleExportData = async () => {
    try {
      const response = await fetch("/api/form-data/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          siteId: selectedSite !== "all" ? parseInt(selectedSite) : null,
          searchTerm,
          dateFilter,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `form-data-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Export Successful",
          description: "Form data has been exported to CSV.",
        });
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export form data.",
        variant: "destructive",
      });
    }
  };

  const filteredSubmissions = submissions?.filter((submission: FormSubmission) => {
    const matchesSearch = !searchTerm || 
      submission.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.siteName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  }) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Form Data Management</h1>
        <p className="text-muted-foreground">
          View and manage form submissions from all connected sites
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submissions?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              All time submissions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(submissions?.map((s: FormSubmission) => s.email)).size || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Unique email addresses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Submissions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {submissions?.filter((s: FormSubmission) => 
                new Date(s.submittedAt).toDateString() === new Date().toDateString()
              ).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Submitted today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sites</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sites?.filter((s: Site) => s.status === 'active').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Sites collecting data
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by email, name, or site..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="site">Filter by Site</Label>
              <Select value={selectedSite} onValueChange={setSelectedSite}>
                <SelectTrigger>
                  <SelectValue placeholder="All sites" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sites</SelectItem>
                  {sites?.map((site: Site) => (
                    <SelectItem key={site.id} value={site.id.toString()}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date Range</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Actions</Label>
              <Button onClick={handleExportData} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Form Submissions</CardTitle>
          <CardDescription>
            {filteredSubmissions.length} submissions found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading submissions...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.map((submission: FormSubmission) => (
                  <TableRow key={submission.id}>
                    <TableCell>
                      {format(new Date(submission.submittedAt), "MMM d, yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{submission.siteName}</span>
                        <span className="text-xs text-muted-foreground">
                          ID: {submission.siteId}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{submission.email}</TableCell>
                    <TableCell>
                      {submission.firstName && submission.lastName
                        ? `${submission.firstName} ${submission.lastName}`
                        : submission.firstName || submission.lastName || "-"}
                    </TableCell>
                    <TableCell>{submission.phone || "-"}</TableCell>
                    <TableCell>{submission.zipCode || "-"}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedSubmission(submission)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Form Submission Details</DialogTitle>
                            <DialogDescription>
                              Submitted on {format(new Date(submission.submittedAt), "PPP")}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                              <div>
                                <Label>Email</Label>
                                <p className="text-sm">{submission.email}</p>
                              </div>
                              <div>
                                <Label>Site</Label>
                                <p className="text-sm">{submission.siteName}</p>
                              </div>
                              <div>
                                <Label>First Name</Label>
                                <p className="text-sm">{submission.firstName || "-"}</p>
                              </div>
                              <div>
                                <Label>Last Name</Label>
                                <p className="text-sm">{submission.lastName || "-"}</p>
                              </div>
                              <div>
                                <Label>Phone</Label>
                                <p className="text-sm">{submission.phone || "-"}</p>
                              </div>
                              <div>
                                <Label>Date of Birth</Label>
                                <p className="text-sm">{submission.dateOfBirth || "-"}</p>
                              </div>
                              <div>
                                <Label>Zip Code</Label>
                                <p className="text-sm">{submission.zipCode || "-"}</p>
                              </div>
                              <div>
                                <Label>Gender</Label>
                                <p className="text-sm">{submission.gender || "-"}</p>
                              </div>
                            </div>
                            
                            <div>
                              <Label>Session Information</Label>
                              <div className="text-sm space-y-1">
                                <p><strong>Session ID:</strong> {submission.sessionId || "-"}</p>
                                <p><strong>IP Address:</strong> {submission.ipAddress || "-"}</p>
                                <p><strong>User Agent:</strong> {submission.userAgent || "-"}</p>
                              </div>
                            </div>

                            {submission.userData && Object.keys(submission.userData).length > 0 && (
                              <div>
                                <Label>Additional Data</Label>
                                <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                                  {JSON.stringify(submission.userData, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}