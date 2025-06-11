import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// SVG illustration of seniors with grocery bags
const SeniorsGroceryIllustration = () => (
  <svg viewBox="0 0 800 400" className="w-full max-w-2xl mx-auto">
    {/* Background */}
    <rect width="800" height="400" fill="#f8fafc"/>
    
    {/* Ground */}
    <ellipse cx="400" cy="380" rx="350" ry="20" fill="#e2e8f0" opacity="0.6"/>
    
    {/* Senior Woman */}
    <g transform="translate(200, 100)">
      {/* Body */}
      <ellipse cx="50" cy="180" rx="35" ry="55" fill="#fbbf24"/>
      {/* Head */}
      <circle cx="50" cy="60" r="35" fill="#fde68a"/>
      {/* Hair */}
      <path d="M20 45 Q50 20 80 45 Q75 35 50 30 Q25 35 20 45" fill="#d1d5db"/>
      {/* Face features */}
      <circle cx="42" cy="55" r="2" fill="#374151"/>
      <circle cx="58" cy="55" r="2" fill="#374151"/>
      <path d="M45 65 Q50 70 55 65" stroke="#374151" strokeWidth="2" fill="none"/>
      {/* Arms */}
      <ellipse cx="25" cy="130" rx="12" ry="40" fill="#fbbf24"/>
      <ellipse cx="75" cy="130" rx="12" ry="40" fill="#fbbf24"/>
      {/* Legs */}
      <ellipse cx="35" cy="250" rx="15" ry="45" fill="#3b82f6"/>
      <ellipse cx="65" cy="250" rx="15" ry="45" fill="#3b82f6"/>
      {/* Grocery bag in left hand */}
      <rect x="10" y="150" width="20" height="25" fill="#8b5cf6" rx="2"/>
      <rect x="12" y="148" width="16" height="8" fill="#a78bfa"/>
      {/* Grocery items poking out */}
      <rect x="14" y="145" width="3" height="8" fill="#22c55e"/>
      <rect x="18" y="143" width="4" height="10" fill="#ef4444"/>
      <rect x="23" y="146" width="3" height="7" fill="#f59e0b"/>
    </g>
    
    {/* Senior Man */}
    <g transform="translate(450, 110)">
      {/* Body */}
      <ellipse cx="50" cy="170" rx="40" ry="50" fill="#3b82f6"/>
      {/* Head */}
      <circle cx="50" cy="60" r="32" fill="#fde68a"/>
      {/* Hair */}
      <path d="M25 50 Q50 25 75 50 Q70 40 50 35 Q30 40 25 50" fill="#9ca3af"/>
      {/* Face features */}
      <circle cx="43" cy="55" r="2" fill="#374151"/>
      <circle cx="57" cy="55" r="2" fill="#374151"/>
      <path d="M46 65 Q50 70 54 65" stroke="#374151" strokeWidth="2" fill="none"/>
      {/* Arms */}
      <ellipse cx="20" cy="125" rx="15" ry="35" fill="#3b82f6"/>
      <ellipse cx="80" cy="125" rx="15" ry="35" fill="#3b82f6"/>
      {/* Legs */}
      <ellipse cx="35" cy="240" rx="18" ry="40" fill="#374151"/>
      <ellipse cx="65" cy="240" rx="18" ry="40" fill="#374151"/>
      {/* Grocery bag in right hand */}
      <rect x="85" y="145" width="22" height="28" fill="#10b981" rx="2"/>
      <rect x="87" y="143" width="18" height="8" fill="#34d399"/>
      {/* Grocery items */}
      <circle cx="92" cy="140" r="3" fill="#ef4444"/>
      <circle cx="98" cy="138" r="2.5" fill="#f59e0b"/>
      <rect x="102" y="136" width="3" height="8" fill="#22c55e"/>
    </g>
    
    {/* Excitement indicators */}
    <g transform="translate(180, 60)">
      <text x="0" y="0" fontSize="24" fill="#fbbf24">✨</text>
      <text x="30" y="-10" fontSize="20" fill="#fbbf24">✨</text>
      <text x="15" y="25" fontSize="18" fill="#fbbf24">✨</text>
    </g>
    
    <g transform="translate(520, 70)">
      <text x="0" y="0" fontSize="24" fill="#fbbf24">✨</text>
      <text x="-20" y="20" fontSize="20" fill="#fbbf24">✨</text>
      <text x="25" y="15" fontSize="18" fill="#fbbf24">✨</text>
    </g>
    
    {/* Title text */}
    <text x="400" y="50" textAnchor="middle" fontSize="32" fontWeight="bold" fill="#1f2937">
      Save More on Groceries!
    </text>
    <text x="400" y="85" textAnchor="middle" fontSize="18" fill="#6b7280">
      Discover exclusive senior discounts and benefits
    </text>
  </svg>
);

export default function SeniorBenefitsDemo() {
  const [isWidgetActive, setIsWidgetActive] = useState(false);

  const startDemo = () => {
    setIsWidgetActive(true);
    
    // Initialize the enhanced widget for senior benefits site (ID: 3)
    const script = document.createElement('script');
    script.innerHTML = `
      // Initialize widget for Senior Benefits (site ID 3)
      if (window.EnhancedCoRegWidget) {
        const widget = new window.EnhancedCoRegWidget();
        widget.siteId = 3; // Senior Benefits site ID
        widget.init();
      }
    `;
    document.body.appendChild(script);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Senior Benefits Demo</h1>
          <p className="text-gray-600">Site ID: 3 - Enhanced Widget Flow</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Demo Preview */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🎯 Senior Benefits Landing Page
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Hero Section with Seniors Illustration */}
              <div className="bg-gradient-to-r from-blue-100 to-green-100 rounded-lg p-6">
                <SeniorsGroceryIllustration />
                
                <div className="text-center mt-6 space-y-4">
                  <h2 className="text-3xl font-bold text-gray-900">
                    Unlock Senior Savings Today!
                  </h2>
                  <p className="text-lg text-gray-700">
                    Join thousands of seniors saving up to 40% on groceries, 
                    prescriptions, and everyday essentials.
                  </p>
                  
                  {!isWidgetActive ? (
                    <Button 
                      onClick={startDemo}
                      size="lg"
                      className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg font-semibold"
                    >
                      Get My Benefits Now! 🎁
                    </Button>
                  ) : (
                    <div className="bg-white rounded-lg p-4 border-2 border-green-200">
                      <p className="text-green-700 font-medium">
                        ✅ Widget Active - Check for overlay or new window
                      </p>
                      <Button 
                        onClick={() => setIsWidgetActive(false)}
                        variant="outline"
                        className="mt-2"
                      >
                        Reset Demo
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Benefits List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🛒</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">Grocery Discounts</h3>
                      <p className="text-sm text-gray-600">Save 15-40% at major retailers</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">💊</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">Prescription Savings</h3>
                      <p className="text-sm text-gray-600">Reduce medication costs</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🏥</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">Healthcare Benefits</h3>
                      <p className="text-sm text-gray-600">Access affordable care</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🎯</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">Exclusive Offers</h3>
                      <p className="text-sm text-gray-600">Senior-only deals</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Flow Information */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                ⚙️ Demo Flow Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Site Configuration</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Site ID:</strong> 3</p>
                  <p><strong>Name:</strong> seniors benefits</p>
                  <p><strong>Domain:</strong> ssbenefits</p>
                  <p><strong>Vertical:</strong> health</p>
                  <p><strong>Flow Type:</strong> Progressive</p>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">Enhanced Widget Flow</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <span>Email capture with senior benefits messaging</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <span>Personal info form (name, phone, age, zip)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <span>Progressive questionnaire (2 questions per ad)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                    <span>Targeted ads based on responses</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">5</span>
                    <span>Thank you page with benefits summary</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">Expected Experience</h3>
                <ul className="space-y-1 text-sm text-yellow-800">
                  <li>• Seniors-focused messaging and imagery</li>
                  <li>• Larger fonts and buttons for accessibility</li>
                  <li>• Health/benefits related questions</li>
                  <li>• Age-appropriate ad targeting</li>
                  <li>• Easy navigation with skip options</li>
                </ul>
              </div>

              <div className="text-center pt-4">
                <Button 
                  onClick={() => window.open('/widget-test', '_blank')}
                  variant="outline"
                  className="w-full"
                >
                  Open Widget Test Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Load the enhanced widget script */}
      <script src="/enhanced-widget.js" async></script>
    </div>
  );
}