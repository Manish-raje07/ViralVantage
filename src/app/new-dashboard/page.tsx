"use client";

import { UnifiedMetricsDashboard } from "@/components/dashboards/UnifiedMetricsDashboard";
import { AIQueryInterface } from "@/components/dashboards/AIQueryInterface";
import { InsightsAndRecommendations } from "@/components/dashboards/InsightsAndRecommendations";
import { ExportableReports } from "@/components/dashboards/ExportableReports";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Lightbulb, Sparkles, FileText } from "lucide-react";

export default function NewDashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <Tabs defaultValue="metrics" className="w-full">
        <div className="border-b sticky top-0 z-10 bg-background">
          <div className="container mx-auto">
            <TabsList className="grid w-full grid-cols-4 rounded-none border-b">
              <TabsTrigger value="metrics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Metrics</span>
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                <span className="hidden sm:inline">AI Query</span>
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Insights</span>
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Reports</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <div className="container mx-auto py-8 px-4">
          <TabsContent value="metrics">
            <UnifiedMetricsDashboard />
          </TabsContent>

          <TabsContent value="ai">
            <AIQueryInterface />
          </TabsContent>

          <TabsContent value="insights">
            <InsightsAndRecommendations />
          </TabsContent>

          <TabsContent value="reports">
            <ExportableReports />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
