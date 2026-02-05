"use client";

import { DashboardSection } from "./sections/DashboardSection";
import { OverviewSection } from "./sections/OverviewSection";
import { PostsSection } from "./sections/PostsSection";
import { AnalyticsSection } from "./sections/AnalyticsSection";
import { EngagementSection } from "./sections/EngagementSection";
import { CampaignsSection } from "./sections/CampaignsSection";
import { CustomersSection } from "./sections/CustomersSection";
import { UsersSection } from "./sections/UsersSection";
import { SettingsSection } from "./sections/SettingsSection";
import { AIQuerySection } from "./sections/AIQuerySection";
import { CompareSection } from "./sections/CompareSection";
import { InsightsSection } from "./sections/InsightsSection";
import { ReportsSection } from "./sections/ReportsSection";

export function DashboardHome({ section }: { section: string }) {
  switch (section) {
    case "overview":
      return <OverviewSection />;
    case "ai-query":
      return <AIQuerySection />;
    case "compare":
      return <CompareSection />;
    case "insights":
      return <InsightsSection />;
    case "reports":
      return <ReportsSection />;
    case "posts":
      return <PostsSection />;
    case "analytics":
      return <AnalyticsSection />;
    case "engagement":
      return <EngagementSection />;
    case "campaigns":
      return <CampaignsSection />;
    case "customers":
      return <CustomersSection />;
    case "users":
      return <UsersSection />;
    case "settings":
      return <SettingsSection />;
    default:
      return <DashboardSection />;
  }
}
