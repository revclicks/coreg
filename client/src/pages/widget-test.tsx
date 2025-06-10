import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function WidgetTest() {
  const [widgetLoaded, setWidgetLoaded] = useState(false);

  const loadWidget = () => {
    // Remove existing widget if present
    const existingWidget = document.getElementById('coreg-widget');
    if (existingWidget) {
      existingWidget.remove();
    }

    // Create script element and load widget
    const script = document.createElement('script');
    script.src = '/widget.js';
    script.onload = () => {
      setWidgetLoaded(true);
      // Initialize widget after script loads
      if (window.coregWidget) {
        window.coregWidget.init();
      }
    };
    document.head.appendChild(script);
  };

  const loadEnhancedWidget = () => {
    // Remove existing widget if present
    const existingWidget = document.getElementById('coreg-widget');
    if (existingWidget) {
      existingWidget.remove();
    }

    // Create script element and load enhanced widget
    const script = document.createElement('script');
    script.src = '/enhanced-widget.js';
    script.onload = () => {
      setWidgetLoaded(true);
      // Initialize widget after script loads
      if (window.enhancedCoregWidget) {
        window.enhancedCoregWidget.init();
      }
    };
    document.head.appendChild(script);
  };

  const loadEmbeddedWidget = () => {
    // Remove existing widget if present
    const existingWidget = document.getElementById('coreg-widget');
    if (existingWidget) {
      existingWidget.remove();
    }

    // Create script element and load embedded widget
    const script = document.createElement('script');
    script.src = '/embedded-widget.js';
    script.onload = () => {
      setWidgetLoaded(true);
      // Initialize widget after script loads
      if (window.coregWidget) {
        window.coregWidget.init();
      }
    };
    document.head.appendChild(script);
  };

  const clearWidget = () => {
    const existingWidget = document.getElementById('coreg-widget');
    if (existingWidget) {
      existingWidget.remove();
    }
    setWidgetLoaded(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Widget Testing Environment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <Button onClick={loadWidget} variant="default">
              Load Standard Widget
            </Button>
            <Button onClick={loadEnhancedWidget} variant="secondary">
              Load Enhanced Widget
            </Button>
            <Button onClick={loadEmbeddedWidget} variant="outline">
              Load Embedded Widget
            </Button>
            <Button onClick={clearWidget} variant="destructive">
              Clear Widget
            </Button>
          </div>
          
          {widgetLoaded && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm">
                Widget loaded successfully! The widget should appear on the page.
              </p>
            </div>
          )}
          
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Testing Instructions:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Standard Widget: Basic questionnaire flow with ads</li>
              <li>• Enhanced Widget: Progressive flow with advanced targeting</li>
              <li>• Embedded Widget: Minimal overlay design</li>
              <li>• Test the skip button functionality on ads</li>
              <li>• Verify click tracking works properly</li>
              <li>• Check that clicks are recorded as clicks, not impressions</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}