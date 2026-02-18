import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users as UsersIcon, Eye, Shield, User, Crown } from "lucide-react";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

interface UserWithRole extends UserProfile {
  roles: AppRole[];
}

const roles: AppRole[] = ["user", "moderator", "admin"];

const Users = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchUsers = async () => {
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => ({
        ...profile,
        roles: (userRoles || [])
          .filter((r) => r.user_id === profile.user_id)
          .map((r) => r.role),
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const viewUserDetails = async (user: UserWithRole) => {
    setSelectedUser(user);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.user_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUserOrders(data || []);
      setIsDialogOpen(true);
    } catch (error) {
      console.error("Error fetching user orders:", error);
      toast.error("Failed to fetch user details");
    }
  };

  const updateUserRole = async (userId: string, newRole: AppRole) => {
    try {
      // First, delete existing role
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (deleteError) throw deleteError;

      // Then, insert new role
      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: newRole });

      if (insertError) throw insertError;

      toast.success("User role updated");
      fetchUsers();
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error("Failed to update user role");
    }
  };

  const getRoleIcon = (role: AppRole) => {
    switch (role) {
      case "admin":
        return <Crown className="h-3 w-3" />;
      case "moderator":
        return <Shield className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  const getRoleBadge = (role: AppRole) => {
    const colors: Record<AppRole, string> = {
      admin: "bg-red-100 text-red-800",
      moderator: "bg-purple-100 text-purple-800",
      user: "bg-blue-100 text-blue-800",
    };
    return colors[role];
  };

  return (
    <>
      <Helmet>
        <title>Manage Users | Admin Dashboard</title>
      </Helmet>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Users</h1>
              <p className="text-muted-foreground">Manage user accounts and roles</p>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              <UsersIcon className="mr-2 h-4 w-4" />
              {users.length} Users
            </Badge>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground">Loading users...</p>
              ) : users.length === 0 ? (
                <p className="text-muted-foreground">No users found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                              {user.avatar_url ? (
                                <img
                                  src={user.avatar_url}
                                  alt={user.full_name || "User"}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <User className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <span className="font-medium">
                              {user.full_name || "Unnamed User"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone || "—"}</TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={user.roles[0] || "user"}
                            onValueChange={(value) =>
                              updateUserRole(user.user_id, value as AppRole)
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {roles.map((role) => (
                                <SelectItem key={role} value={role}>
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${getRoleBadge(role)}`}
                                  >
                                    {getRoleIcon(role)}
                                    {role}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewUserDetails(user)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* User Details Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {selectedUser.avatar_url ? (
                      <img
                        src={selectedUser.avatar_url}
                        alt={selectedUser.full_name || "User"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">
                      {selectedUser.full_name || "Unnamed User"}
                    </h3>
                    <p className="text-muted-foreground">{selectedUser.email}</p>
                    <div className="flex gap-2 mt-2">
                      {selectedUser.roles.map((role) => (
                        <span
                          key={role}
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${getRoleBadge(role)}`}
                        >
                          {getRoleIcon(role)}
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-2">Contact Info</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Email: {selectedUser.email}</p>
                      <p>Phone: {selectedUser.phone || "Not provided"}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Account Info</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>User ID: {selectedUser.user_id}</p>
                      <p>
                        Joined: {new Date(selectedUser.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Order History ({userOrders.length} orders)</h4>
                  {userOrders.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No orders yet</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {userOrders.map((order) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div>
                            <p className="font-medium">{order.order_number}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              ₹{Number(order.total).toLocaleString()}
                            </p>
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                                order.status === "delivered"
                                  ? "bg-green-100 text-green-700"
                                  : order.status === "pending"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {order.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </>
  );
};

export default Users;
