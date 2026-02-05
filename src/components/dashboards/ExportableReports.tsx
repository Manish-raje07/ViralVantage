"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, BarChart3, Calendar } from "lucide-react";

interface Report {
  id: string;
  name: string;
  description: string;
  format: "PDF" | "CSV" | "JSON";
  period: string;
  metrics: string[];
}

const AVAILABLE_REPORTS: Report[] = [
  {
    id: "performance",
    name: "Overall Performance Report",
    description: "Complete overview of engagement, reach, and follower growth across all platforms",
    format: "PDF",
    period: "Weekly, Monthly, Quarterly",
    metrics: [
      "Total Reach",
      "Engagement Rate",
      "Audience Growth",
      "Top Posts",
      "Platform Breakdown",
    ],
  },
  {
    id: "content-analysis",
    name: "Content Analysis Report",
    description: "Detailed breakdown of content performance by type, format, and platform",
    format: "PDF",
    period: "Monthly",
    metrics: [
      "Post Type Performance",
      "Content Themes",
      "Best Performing Topics",
      "Posting Schedule",
      "Optimal Post Times",
    ],
  },
  {
    id: "audience",
    name: "Audience Insights Report",
    description: "Demographics, behavior patterns, and engagement preferences",
    format: "PDF",
    period: "Monthly, Quarterly",
    metrics: [
      "Audience Demographics",
      "Growth Metrics",
      "Engagement Patterns",
      "Follower Sources",
      "Audience Interests",
    ],
  },
  {
    id: "competitor",
    name: "Competitor Comparison Report",
    description: "Compare your performance against competitors in your industry",
    format: "PDF",
    period: "Monthly",
    metrics: [
      "Engagement Benchmarks",
      "Growth Comparison",
      "Content Strategy Analysis",
      "Market Position",
    ],
  },
  {
    id: "roi",
    name: "ROI & Sales Impact Report",
    description: "Track how social media drives business results and conversions",
    format: "PDF",
    period: "Monthly, Quarterly",
    metrics: [
      "Conversion Rate",
      "Sales Driven",
      "Cost Per Acquisition",
      "Customer Lifetime Value",
      "ROI by Platform",
    ],
  },
];

export function ExportableReports() {
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<"PDF" | "CSV" | "JSON">("PDF");
  const [timePeriod, setTimePeriod] = useState("monthly");
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const toggleReport = (reportId: string) => {
    setSelectedReports((prev) =>
      prev.includes(reportId)
        ? prev.filter((id) => id !== reportId)
        : [...prev, reportId]
    );
  };

  const handleExport = async () => {
    if (selectedReports.length === 0) {
      setExportStatus("Please select at least one report");
      return;
    }

    try {
      setIsExporting(true);
      setExportStatus("Generating report...");

      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reports: selectedReports,
          format: exportFormat,
          period: timePeriod,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate report");
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `social-media-report-${timePeriod}-${Date.now()}.${exportFormat.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setExportStatus("Report exported successfully!");
      setTimeout(() => setExportStatus(null), 3000);
    } catch (error) {
      setExportStatus(
        error instanceof Error ? error.message : "Failed to export report"
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Export Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Export Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Time Period</label>
              <select
                value={timePeriod}
                onChange={(e) => setTimePeriod(e.target.value)}
                className="w-full mt-2 px-3 py-2 rounded-lg border bg-background"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Format</label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as any)}
                className="w-full mt-2 px-3 py-2 rounded-lg border bg-background"
              >
                <option value="PDF">PDF (Formatted Report)</option>
                <option value="CSV">CSV (Data Table)</option>
                <option value="JSON">JSON (Raw Data)</option>
              </select>
            </div>
          </div>

          {exportStatus && (
            <div className={`p-3 rounded-lg text-sm ${
              exportStatus.includes("successfully")
                ? "bg-green-50 text-green-700"
                : "bg-yellow-50 text-yellow-700"
            }`}>
              {exportStatus}
            </div>
          )}

          <Button
            onClick={handleExport}
            disabled={isExporting || selectedReports.length === 0}
            className="w-full"
          >
            {isExporting ? (
              <>Generating...</>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export Selected Reports
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Available Reports */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Available Reports</h3>
        <div className="grid gap-4">
          {AVAILABLE_REPORTS.map((report) => (
            <Card
              key={report.id}
              className={`cursor-pointer transition-all ${
                selectedReports.includes(report.id)
                  ? "border-blue-500 bg-blue-50"
                  : "hover:border-slate-400"
              }`}
              onClick={() => toggleReport(report.id)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={selectedReports.includes(report.id)}
                    onChange={() => toggleReport(report.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {report.name}
                      </h4>
                      <Badge variant="outline">{report.format}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {report.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {report.metrics.map((metric) => (
                        <Badge key={metric} variant="secondary" className="text-xs">
                          {metric}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Available: {report.period}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Report Preview */}
      {selectedReports.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-sm">Report Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {selectedReports.map((reportId) => {
                const report = AVAILABLE_REPORTS.find((r) => r.id === reportId);
                return report ? (
                  <li key={reportId} className="flex items-center gap-2">
                    <span className="h-2 w-2 bg-blue-500 rounded-full" />
                    {report.name}
                  </li>
                ) : null;
              })}
            </ul>
            <p className="text-xs text-muted-foreground mt-4">
              Your report will include data from the selected time period and be exported as {exportFormat}.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
