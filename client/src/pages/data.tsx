import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Filter } from "lucide-react";

export default function Data() {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  const { data: responseData, isLoading } = useQuery({
    queryKey: ["/api/data-collection", currentPage],
    queryFn: async () => {
      const response = await fetch(`/api/data-collection?page=${currentPage}&limit=${pageSize}`);
      return response.json();
    },
  });

  const handleExportData = () => {
    // Implement CSV export functionality
    console.log("Exporting data...");
  };

  const handleFilter = () => {
    // Implement filtering functionality
    console.log("Opening filter...");
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">Data Collection</h3>
          <div className="flex space-x-3">
            <Button onClick={handleExportData} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={handleFilter} variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </div>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-12 bg-slate-200 rounded"></div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Question</TableHead>
                    <TableHead>Answer</TableHead>
                    <TableHead>Session ID</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>State</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-slate-500 py-12">
                      <div className="space-y-2">
                        <p>No data collection records available yet.</p>
                        <p className="text-sm">Data will appear here once users start interacting with questionnaires.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
