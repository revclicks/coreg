import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, HelpCircle, TrendingUp, DollarSign } from "lucide-react";

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/stats/dashboard"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-slate-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Active Campaigns",
      value: stats?.activeCampaigns || 0,
      icon: BarChart3,
      color: "bg-blue-100 text-blue-600",
      change: "+12%",
      changeText: "vs last month",
    },
    {
      title: "Total Questions",
      value: stats?.totalQuestions || 0,
      icon: HelpCircle,
      color: "bg-green-100 text-green-600",
      change: "+8",
      changeText: "new this week",
    },
    {
      title: "Daily Conversions",
      value: stats?.dailyConversions || 0,
      icon: TrendingUp,
      color: "bg-amber-100 text-amber-600",
      change: "+18%",
      changeText: "vs yesterday",
    },
    {
      title: "Revenue Today",
      value: `$${stats?.revenue || "0.00"}`,
      icon: DollarSign,
      color: "bg-emerald-100 text-emerald-600",
      change: "+24%",
      changeText: "vs last week",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">{stat.title}</p>
                    <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                  </div>
                  <div className={`rounded-lg p-3 ${stat.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <span className="text-green-600 text-sm font-medium">{stat.change}</span>
                  <span className="text-slate-500 text-sm ml-1">{stat.changeText}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
                <div className="flex items-center">
                  <HelpCircle className="h-5 w-5 text-blue-600 mr-3" />
                  <div>
                    <p className="font-medium text-slate-800">Add New Question</p>
                    <p className="text-sm text-slate-500">Create a new question for your flow</p>
                  </div>
                </div>
              </button>
              <button className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
                <div className="flex items-center">
                  <BarChart3 className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium text-slate-800">Create Campaign</p>
                    <p className="text-sm text-slate-500">Set up a new advertising campaign</p>
                  </div>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-800">Campaign "Health Plus" created</p>
                  <p className="text-sm text-slate-500">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-800">Question priority updated</p>
                  <p className="text-sm text-slate-500">15 minutes ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
