import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Copy, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import AddSiteModal from "@/components/modals/add-site-modal";
import type { Site } from "@shared/schema";

export default function Sites() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const { toast } = useToast();

  const { data: sites, isLoading, refetch: refetchSites } = useQuery<Site[]>({
    queryKey: ["/api/sites"],
    staleTime: 0,
    gcTime: 0,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/sites/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete site");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sites"] });
    },
  });

  const handleEdit = (site: Site) => {
    setEditingSite(site);
    setShowAddModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this site?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCopyCode = (siteCode: string) => {
    const code = `<script src="https://cdn.coreg.com/sites/${siteCode}.js"></script>`;
    navigator.clipboard.writeText(code);
    toast({
      title: "Code copied!",
      description: "Site embed code has been copied to clipboard.",
    });
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingSite(null);
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-32 bg-slate-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">Site Manager</h3>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchSites()}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Site
            </Button>
          </div>
        </div>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sites?.map((site) => (
              <Card key={site.id} className="border border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-slate-800">{site.name}</h4>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(site)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(site.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Domain:</span>
                      <span className="text-slate-800">{site.domain}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Vertical:</span>
                      <Badge className={getVerticalColor(site.vertical)}>
                        {site.vertical}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Excluded Verticals:</span>
                      <div className="flex space-x-1">
                        {(site.excludedVerticals as string[] || []).map((vertical, index) => (
                          <Badge key={index} variant="destructive" className="text-xs">
                            {vertical}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Site Code:
                      </label>
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                        <code className="text-xs text-slate-800 font-mono break-all">
                          {`<script src="https://cdn.coreg.com/sites/${site.siteCode}.js"></script>`}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-2"
                          onClick={() => handleCopyCode(site.siteCode)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <AddSiteModal
        open={showAddModal}
        onClose={handleCloseModal}
        editingSite={editingSite}
      />
    </div>
  );
}
