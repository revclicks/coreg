import { useLocation } from "wouter";
import { Bell } from "lucide-react";

const pageTitles = {
  "/": { title: "Dashboard Overview", description: "Monitor your campaign performance and system metrics" },
  "/questions": { title: "Question Manager", description: "Manage questions and set priorities for your questionnaire flow" },
  "/campaigns": { title: "Campaign Manager", description: "Create and manage advertising campaigns with targeting options" },
  "/sites": { title: "Site Manager", description: "Configure sites and manage vertical exclusions" },
  "/stats": { title: "Stats & Analytics", description: "View detailed performance analytics and conversion metrics" },
  "/data": { title: "Data Collection", description: "Access collected user response data and interaction history" },
};

export default function Header() {
  const [location] = useLocation();
  const pageInfo = pageTitles[location as keyof typeof pageTitles] || pageTitles["/"];

  return (
    <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">{pageInfo.title}</h2>
          <p className="text-slate-600">{pageInfo.description}</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Bell className="h-5 w-5 text-slate-400" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              3
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <img
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&w=40&h=40&fit=crop&crop=face"
              alt="Admin User"
              className="w-8 h-8 rounded-full"
            />
            <span className="text-slate-700 font-medium">Admin User</span>
          </div>
        </div>
      </div>
    </header>
  );
}
