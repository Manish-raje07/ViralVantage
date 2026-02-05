"use client";

import { useState } from "react";
import { FileText, Download, Calendar, Filter, Loader2, FileSpreadsheet, FileJson } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ExportFormat = "csv" | "json" | "pdf";
type DateRange = "7days" | "30days" | "90days" | "custom";

export function ReportsSection() {
  const [isLoading, setIsLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");
  const [dateRange, setDateRange] = useState<DateRange>("30days");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [exportHistory, setExportHistory] = useState<
    { format: string; date: Date; size: string }[]
  >([]);

  const getDateRange = () => {
    const now = new Date();
    const startDate = new Date();

    switch (dateRange) {
      case "7days":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30days":
        startDate.setDate(now.getDate() - 30);
        break;
      case "90days":
        startDate.setDate(now.getDate() - 90);
        break;
      case "custom":
        return {
          startDate: customStartDate,
          endDate: customEndDate,
        };
    }

    return {
      startDate: startDate.toISOString().split("T")[0],
      endDate: now.toISOString().split("T")[0],
    };
  };

  const handleExport = async () => {
    setIsLoading(true);
    const { startDate, endDate } = getDateRange();

    try {
      if (exportFormat === "pdf") {
        // For PDF, we'll generate client-side
        await generatePDFReport(startDate, endDate);
      } else {
        // For CSV and JSON, fetch from API
        const params = new URLSearchParams({
          format: exportFormat,
          ...(startDate && { startDate }),
          ...(endDate && { endDate }),
        });

        const response = await fetch(`/api/reports?${params}`);

        if (exportFormat === "csv") {
          const blob = await response.blob();
          downloadBlob(
            blob,
            `social-analytics-report-${new Date().toISOString().split("T")[0]}.csv`
          );
        } else {
          const data = await response.json();
          const blob = new Blob([JSON.stringify(data.data, null, 2)], {
            type: "application/json",
          });
          downloadBlob(
            blob,
            `social-analytics-report-${new Date().toISOString().split("T")[0]}.json`
          );
        }
      }

      // Add to history
      setExportHistory((prev) => [
        {
          format: exportFormat.toUpperCase(),
          date: new Date(),
          size: "~250 KB",
        },
        ...prev.slice(0, 4),
      ]);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generatePDFReport = async (startDate: string, endDate: string) => {
    // Fetch data first
    const response = await fetch(
      `/api/reports?startDate=${startDate}&endDate=${endDate}`
    );
    const result = await response.json();

    if (!result.success) {
      throw new Error("Failed to fetch report data");
    }

    const data = result.data;

    // Dynamic import jsPDF
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();

    // Title
    doc.setFontSize(24);
    doc.setTextColor(37, 99, 235);
    doc.text("Social Media Analytics Report", 20, 25);

    // Date range
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Report Period: ${startDate} to ${endDate}`, 20, 35);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 42);

    // Summary Section
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("Summary", 20, 55);

    doc.setFontSize(11);
    const summary = data.summary;
    const summaryItems = [
      `Total Posts: ${summary.totalPosts}`,
      `Total Likes: ${summary.totalLikes.toLocaleString()}`,
      `Total Comments: ${summary.totalComments.toLocaleString()}`,
      `Total Shares: ${summary.totalShares.toLocaleString()}`,
      `Total Reach: ${summary.totalReach.toLocaleString()}`,
      `Avg Engagement Rate: ${summary.avgEngagementRate}%`,
    ];

    summaryItems.forEach((item, i) => {
      doc.text(item, 25, 65 + i * 7);
    });

    // Platform Breakdown
    doc.setFontSize(16);
    doc.text("Platform Breakdown", 20, 115);

    doc.setFontSize(11);
    let yPos = 125;
    Object.entries(data.platformBreakdown || {}).forEach(([platform, stats]: [string, unknown]) => {
      const s = stats as { posts: number; likes: number; engagement: number };
      doc.text(
        `${platform.charAt(0).toUpperCase() + platform.slice(1)}: ${s.posts} posts, ${s.likes.toLocaleString()} likes`,
        25,
        yPos
      );
      yPos += 7;
    });

    // Top Posts
    doc.setFontSize(16);
    doc.text("Top Performing Posts", 20, yPos + 15);

    doc.setFontSize(10);
    yPos += 25;
    (data.topPosts || []).slice(0, 5).forEach((post: { platform: string; type: string; engagementRate: number; likes: number }, i: number) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(
        `${i + 1}. [${post.platform}] ${post.type} - ${post.engagementRate}% engagement, ${post.likes} likes`,
        25,
        yPos
      );
      yPos += 7;
    });

    // Insights
    if (data.insights && data.insights.length > 0) {
      doc.addPage();
      doc.setFontSize(16);
      doc.text("Key Insights", 20, 25);

      doc.setFontSize(11);
      yPos = 35;
      data.insights.forEach((insight: { title: string; content: string }, i: number) => {
        doc.setFont("helvetica", "bold");
        doc.text(`${i + 1}. ${insight.title}`, 25, yPos);
        doc.setFont("helvetica", "normal");
        yPos += 7;
        
        // Wrap long content
        const lines = doc.splitTextToSize(insight.content, 160);
        doc.text(lines, 30, yPos);
        yPos += lines.length * 5 + 10;
      });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${i} of ${pageCount} | Social Media Analytics Dashboard`,
        20,
        285
      );
    }

    // Save
    doc.save(
      `social-analytics-report-${new Date().toISOString().split("T")[0]}.pdf`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
          <FileText className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Export Reports</h2>
          <p className="text-sm text-muted-foreground">
            Download your analytics data for planning and decision-making
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Export Options */}
        <div className="lg:col-span-2 space-y-6">
          {/* Date Range */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" />
                Select Date Range
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { key: "7days", label: "Last 7 Days" },
                  { key: "30days", label: "Last 30 Days" },
                  { key: "90days", label: "Last 90 Days" },
                  { key: "custom", label: "Custom Range" },
                ].map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setDateRange(option.key as DateRange)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                      dateRange === option.key
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-muted/50 hover:bg-muted border-border"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {dateRange === "custom" && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="text-sm text-muted-foreground">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full mt-1 p-2 rounded-lg border bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full mt-1 p-2 rounded-lg border bg-background"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Format Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Filter className="h-4 w-4" />
                Select Export Format
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    key: "csv",
                    label: "CSV",
                    description: "Spreadsheet format",
                    icon: FileSpreadsheet,
                    color: "from-green-500 to-emerald-500",
                  },
                  {
                    key: "json",
                    label: "JSON",
                    description: "Structured data",
                    icon: FileJson,
                    color: "from-blue-500 to-cyan-500",
                  },
                  {
                    key: "pdf",
                    label: "PDF",
                    description: "Printable report",
                    icon: FileText,
                    color: "from-rose-500 to-pink-500",
                  },
                ].map((format) => (
                  <button
                    key={format.key}
                    onClick={() => setExportFormat(format.key as ExportFormat)}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      exportFormat === format.key
                        ? "ring-2 ring-blue-500 border-blue-500"
                        : "hover:border-blue-500/50"
                    }`}
                  >
                    <div
                      className={`h-10 w-10 rounded-lg bg-gradient-to-br ${format.color} flex items-center justify-center mb-3`}
                    >
                      <format.icon className="h-5 w-5 text-white" />
                    </div>
                    <p className="font-semibold">{format.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {format.description}
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Export Button */}
          <Button
            size="lg"
            className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
            onClick={handleExport}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Generating Report...
              </>
            ) : (
              <>
                <Download className="h-5 w-5 mr-2" />
                Export {exportFormat.toUpperCase()} Report
              </>
            )}
          </Button>
        </div>

        {/* Export History */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Recent Exports</CardTitle>
          </CardHeader>
          <CardContent>
            {exportHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No exports yet
              </p>
            ) : (
              <div className="space-y-3">
                {exportHistory.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.format}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.date.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {item.size}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* What's Included */}
      <Card className="bg-gradient-to-br from-muted/50 to-muted">
        <CardHeader>
          <CardTitle className="text-base">What&apos;s Included in Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              "All post metrics",
              "Platform breakdown",
              "Engagement analytics",
              "Top performing content",
              "Content type analysis",
              "AI-generated insights",
              "Daily performance",
              "Growth trends",
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-sm"
              >
                <div className="h-2 w-2 rounded-full bg-green-500" />
                {item}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
