import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Copy, Trash2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import AddCampaignModal from "@/components/modals/add-campaign-modal";
import type { Campaign } from "@shared/schema";

export default function Campaigns() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  const { data: campaigns, isLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
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
      <Card>
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">Campaign Manager</h3>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Campaign
          </Button>
        </div>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Vertical</TableHead>
                  <TableHead>CPC Bid</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns?.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <div className="flex items-center">
                        {campaign.imageUrl && (
                          <img
                            src={campaign.imageUrl}
                            alt="Campaign"
                            className="w-10 h-10 rounded object-cover mr-3"
                          />
                        )}
                        <div>
                          <p className="font-medium text-slate-800">{campaign.name}</p>
                          <p className="text-sm text-slate-500">
                            Age: {campaign.ageMin || 18}-{campaign.ageMax || 65}, {campaign.states || "All States"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getVerticalColor(campaign.vertical)}>
                        {campaign.vertical}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">${campaign.cpcBid}</TableCell>
                    <TableCell>
                      <Switch
                        checked={campaign.active}
                        onCheckedChange={(checked) => handleToggle(campaign.id, checked)}
                        disabled={toggleMutation.isPending}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="text-slate-800 font-medium">CTR: 3.2%</p>
                        <p className="text-slate-500">CVR: 8.5%</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(campaign)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(campaign.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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
