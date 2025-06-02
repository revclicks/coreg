import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Filter, ChevronDown, ChevronRight, ChevronLeft, Users, Activity, Smartphone, Monitor } from "lucide-react";

export default function Data() {
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data: collectionData, isLoading } = useQuery({
    queryKey: ["/api/data-collection", currentPage, pageSize],
    queryFn: async () => {
      const response = await fetch(`/api/data-collection?page=${currentPage}&limit=${pageSize}`);
      return response.json();
    },
  });

  const toggleSession = (sessionId: string) => {
    const newExpanded = new Set(expandedSessions);
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
    }
    setExpandedSessions(newExpanded);
  };

  const handleExportData = () => {
    if (!collectionData?.sessions) return;
    
    // Create CSV content
    const csvRows = [];
    csvRows.push(['Email', 'Timestamp', 'Site', 'Device', 'State', 'Questions Answered', 'Session ID']);
    
    collectionData.sessions.forEach((session: any) => {
      csvRows.push([
        session.email,
        new Date(session.timestamp).toLocaleString(),
        session.site,
        session.device,
        session.state,
        session.totalQuestions,
        session.sessionId
      ]);
    });

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data-collection.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Analytics Cards */}
      {collectionData?.analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{collectionData.analytics.totalLeads}</div>
              <p className="text-xs text-muted-foreground">
                Users with email addresses
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{collectionData.analytics.totalSessions}</div>
              <p className="text-xs text-muted-foreground">
                Unique user sessions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mobile Users</CardTitle>
              <Smartphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{collectionData.analytics.deviceBreakdown.mobile}</div>
              <p className="text-xs text-muted-foreground">
                Mobile device sessions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Desktop Users</CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{collectionData.analytics.deviceBreakdown.desktop}</div>
              <p className="text-xs text-muted-foreground">
                Desktop device sessions
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Data Collection Table */}
      <Card>
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">Lead Collection Data</h3>
          <div className="flex space-x-3">
            <Button onClick={handleExportData} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-200 rounded"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {collectionData?.sessions?.length > 0 ? (
                collectionData.sessions.map((session: any) => (
                  <Collapsible
                    key={session.sessionId}
                    open={expandedSessions.has(session.sessionId)}
                    onOpenChange={() => toggleSession(session.sessionId)}
                  >
                    <Card className="border border-slate-200">
                      <CollapsibleTrigger asChild>
                        <div className="px-4 py-3 hover:bg-slate-50 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              {expandedSessions.has(session.sessionId) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              <div>
                                <div className="font-medium">{session.email}</div>
                                <div className="text-sm text-muted-foreground">
                                  {new Date(session.timestamp).toLocaleString()}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-6 text-sm">
                              <span className="text-muted-foreground">{session.site}</span>
                              <span className="text-muted-foreground">{session.device}</span>
                              <span className="text-muted-foreground">{session.state}</span>
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                {session.totalQuestions} questions
                              </span>
                            </div>
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="px-4 pb-4 border-t border-slate-100">
                          <div className="mt-3">
                            <h4 className="text-sm font-medium mb-2">Question Responses:</h4>
                            <div className="space-y-2">
                              {session.responses?.map((response: any, idx: number) => (
                                <div key={idx} className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">{response.question}:</span>
                                  <span className="font-medium">{response.answer}</span>
                                </div>
                              ))}
                            </div>
                            <div className="mt-3 pt-2 border-t border-slate-100">
                              <span className="text-xs text-muted-foreground font-mono">
                                Session ID: {session.sessionId}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                ))
              ) : (
                <div className="text-center text-slate-500 py-12">
                  <div className="space-y-2">
                    <p>No data collection records available yet.</p>
                    <p className="text-sm">Data will appear here once users start interacting with questionnaires.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pagination Controls */}
          {!isLoading && collectionData?.sessions?.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <span>Show:</span>
                  <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(parseInt(value))}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <span>per page</span>
                </div>
                <div>
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, collectionData?.total || 0)} of {collectionData?.total || 0} entries
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {[...Array(Math.ceil((collectionData?.total || 0) / pageSize))].map((_, i) => {
                    const pageNum = i + 1;
                    const totalPages = Math.ceil((collectionData?.total || 0) / pageSize);
                    
                    // Show first page, last page, current page, and pages around current
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                    ) {
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    } else if (
                      pageNum === currentPage - 2 ||
                      pageNum === currentPage + 2
                    ) {
                      return (
                        <span key={pageNum} className="px-2 text-muted-foreground">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage >= Math.ceil((collectionData?.total || 0) / pageSize)}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
