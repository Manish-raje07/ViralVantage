"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, UserPlus } from "lucide-react";

type User = {
  id: string;
  name: string;
  role: "admin" | "editor" | "viewer";
  email: string;
  status: "active" | "invited" | "suspended";
};

export function UsersSection() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        // In a real app, this would fetch from a users API endpoint
        // For now, we'll return empty as demo data is removed
        setUsers([]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Placeholder CRUD handlers
  const handleAdd = () => {};
  const handleEdit = () => {};
  const handleDelete = () => {};

  if (error) {
    return (
      <div>
        <h2 className="text-xl font-bold mb-6">User Management</h2>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">User Management</h2>
        <Button onClick={handleAdd}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite User
        </Button>
      </div>
      {users.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <p>No users available. Connect to real user API to load data.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {users.map((user) => (
            <Card key={user.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>
                    {user.name} ({user.role})
                  </span>
                  <span
                    className={
                      user.status === "active"
                        ? "text-green-600"
                        : user.status === "invited"
                          ? "text-blue-600"
                          : "text-red-600"
                    }
                  >
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span>{user.email}</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={handleEdit}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={handleDelete}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
