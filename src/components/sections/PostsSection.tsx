"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  Eye,
  Heart,
  MessageCircle,
  Share,
  BarChart3,
  Clock,
} from "lucide-react";

type Post = {
  id: string;
  content: string;
  platforms: ("Facebook" | "Instagram" | "Twitter" | "LinkedIn" | "TikTok")[];
  scheduledAt: string;
  status: "scheduled" | "posted" | "failed" | "draft";
  mediaType: "text" | "image" | "video" | "carousel";
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
  tags: string[];
  campaign?: string;
};

export function PostsSection() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/analytics?type=posts");
        if (!response.ok) throw new Error("Failed to fetch posts");
        const data = await response.json();
        // Transform API data to component format
        const transformedPosts = (data.data?.posts || []).map((p: any) => ({
          id: p.postId || p.id,
          content: p.content,
          platforms: [p.platform || "Twitter"],
          scheduledAt: p.publishedAt,
          status: "posted" as const,
          mediaType: p.type || "text",
          engagement: {
            likes: p.metrics?.likes || 0,
            comments: p.metrics?.comments || 0,
            shares: p.metrics?.shares || 0,
            views: p.metrics?.impressions || 0,
          },
          tags: p.hashtags || [],
        }));
        setPosts(transformedPosts);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading posts");
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Placeholder CRUD handlers
  const handleAdd = () => {};
  const handleEdit = () => {};
  const handleDelete = () => {};

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      Facebook: "#1877f2",
      Instagram: "#e4405f",
      Twitter: "#1da1f2",
      LinkedIn: "#0077b5",
      TikTok: "#000000",
    };
    return colors[platform] || "#6366f1";
  };

  const getMediaTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return "🎥";
      case "image":
        return "📷";
      case "carousel":
        return "🖼️";
      default:
        return "📝";
    }
  };

  const totalPosts = posts.length;
  const scheduledPosts = posts.filter((p) => p.status === "scheduled").length;
  const postedPosts = posts.filter((p) => p.status === "posted").length;
  const draftPosts = posts.filter((p) => p.status === "draft").length;

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Content Management</h2>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold">Content Management</h2>
        <Button onClick={handleAdd} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Create Post
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPosts}</div>
            <p className="text-xs text-muted-foreground">All content pieces</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledPosts}</div>
            <p className="text-xs text-muted-foreground">Ready to publish</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{postedPosts}</div>
            <p className="text-xs text-muted-foreground">Live content</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{draftPosts}</div>
            <p className="text-xs text-muted-foreground">Work in progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id}>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {getMediaTypeIcon(post.mediaType)}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {new Date(post.scheduledAt).toLocaleString()}
                      </span>
                    </div>
                    {post.campaign && (
                      <p className="text-xs text-muted-foreground">
                        Campaign: {post.campaign}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-medium ${
                      post.status === "scheduled"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        : post.status === "posted"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : post.status === "failed"
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                    }`}
                  >
                    {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Content Preview */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm line-clamp-3">{post.content}</p>
              </div>
              {/* Platforms & Tags */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <h4 className="text-sm font-medium mb-2">Platforms</h4>
                  <div className="flex flex-wrap gap-2">
                    {post.platforms.map((platform) => (
                      <span
                        key={platform}
                        className="text-xs px-2 py-1 rounded-full text-white font-medium"
                         
                        style={{ backgroundColor: getPlatformColor(platform) }}
                      >
                        {platform}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              {/* Engagement Stats (for posted content) */}
              {post.engagement && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-3">Performance</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Heart className="h-4 w-4 text-red-500" />
                      <span className="font-medium">
                        {post.engagement.likes.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground">likes</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MessageCircle className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">
                        {post.engagement.comments.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground">comments</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Share className="h-4 w-4 text-green-500" />
                      <span className="font-medium">
                        {post.engagement.shares.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground">shares</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Eye className="h-4 w-4 text-purple-500" />
                      <span className="font-medium">
                        {post.engagement.views.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground">views</span>
                    </div>
                  </div>
                </div>
              )}
              {/* Actions */}{" "}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={handleDelete}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
