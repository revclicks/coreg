import { Link, useLocation } from "wouter";
import { BarChart3, HelpCircle, Megaphone, Globe, Database, ChartBar, Target, TrendingUp, Users } from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Question Manager", href: "/questions", icon: HelpCircle },
  { name: "Campaign Manager", href: "/campaigns", icon: Megaphone },
  { name: "Site Manager", href: "/sites", icon: Globe },
  { name: "Audience Segments", href: "/audience-segments", icon: Users },
  { name: "A/B Testing", href: "/ab-testing", icon: Target },
  { name: "Stats & Analytics", href: "/stats", icon: ChartBar },
  { name: "Advanced Analytics", href: "/analytics", icon: TrendingUp },
  { name: "Data Collection", href: "/data", icon: Database },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 bg-white shadow-lg border-r border-slate-200">
      <div className="p-6 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-800">CoReg Admin</h1>
        <p className="text-sm text-slate-500">Campaign Management</p>
      </div>
      
      <nav className="mt-6">
        <div className="px-4 space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive
                    ? "text-blue-600 bg-blue-50"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
