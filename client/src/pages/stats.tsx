import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Stats() {
  const { data: questionStats, isLoading: loadingQuestions } = useQuery({
    queryKey: ["/api/stats/questions"],
  });

  const { data: campaignStats, isLoading: loadingCampaigns } = useQuery({
    queryKey: ["/api/stats/campaigns"],
  });

  if (loadingQuestions || loadingCampaigns) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-64 bg-slate-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <Card>
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Performance Analytics</h3>
        </div>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Question</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Clicks</TableHead>
                  <TableHead>CTR</TableHead>
                  <TableHead>CVR</TableHead>
                  <TableHead>EPC</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questionStats?.map((stat: any) => (
                  <TableRow key={stat.questionId}>
                    <TableCell className="font-medium">{stat.questionText}</TableCell>
                    <TableCell>{stat.views.toLocaleString()}</TableCell>
                    <TableCell>{stat.clicks.toLocaleString()}</TableCell>
                    <TableCell>
                      <span className="text-green-600 font-medium">{stat.ctr}%</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-blue-600 font-medium">{stat.cvr}%</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-emerald-600 font-medium">${stat.epc}</span>
                    </TableCell>
                  </TableRow>
                ))}
                {!questionStats?.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                      No question data available yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="px-6 py-4 border-b border-slate-200">
            <h4 className="text-lg font-semibold text-slate-800">Top Performing Campaigns</h4>
          </div>
          <CardContent className="p-6">
            <div className="space-y-4">
              {campaignStats?.slice(0, 5).map((campaign: any) => (
                <div key={campaign.campaignId} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-800">{campaign.campaignName}</p>
                    <p className="text-sm text-slate-500">
                      Clicks: {campaign.clicks} | CVR: {campaign.cvr}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">${campaign.revenue}</p>
                    <p className="text-sm text-slate-500">Revenue</p>
                  </div>
                </div>
              ))}
              {!campaignStats?.length && (
                <p className="text-center text-slate-500 py-8">No campaign data available yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <div className="px-6 py-4 border-b border-slate-200">
            <h4 className="text-lg font-semibold text-slate-800">Campaign Metrics</h4>
          </div>
          <CardContent className="p-6">
            <div className="space-y-4">
              {campaignStats?.slice(0, 5).map((campaign: any) => (
                <div key={campaign.campaignId} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-800">{campaign.campaignName}</p>
                    <p className="text-sm text-slate-500">Vertical: {campaign.vertical}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600">{campaign.clicks}</p>
                    <p className="text-sm text-slate-500">Clicks</p>
                  </div>
                </div>
              ))}
              {!campaignStats?.length && (
                <p className="text-center text-slate-500 py-8">No campaign metrics available yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
