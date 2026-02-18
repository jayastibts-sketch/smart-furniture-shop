import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import ModeratorLayout from "@/components/moderator/ModeratorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  ShoppingCart, 
  Package, 
  Clock, 
  CheckCircle,
  Truck,
  AlertCircle,
  Activity,
  User
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  totalProducts: number;
  lowStockProducts: number;
}

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: any;
  created_at: string;
  profile?: {
    full_name: string | null;
    email: string;
  };
}

const ModeratorDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    totalProducts: 0,
    lowStockProducts: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*");

      if (productsError) throw productsError;

      // Fetch activity logs
      const { data: logsData, error: logsError } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (logsError) throw logsError;

      // Fetch profiles for logs
      const userIds = [...new Set((logsData || []).map(l => l.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

      const logsWithProfiles = (logsData || []).map(log => ({
        ...log,
        profile: profilesMap.get(log.user_id),
      }));

      const orders = ordersData || [];
      const products = productsData || [];

      setStats({
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.status === "pending").length,
        processingOrders: orders.filter(o => o.status === "processing").length,
        shippedOrders: orders.filter(o => o.status === "shipped").length,
        totalProducts: products.length,
        lowStockProducts: products.filter(p => (p.stock_count || 0) < 10).length,
      });

      setRecentOrders(orders.slice(0, 5));
      setActivityLogs(logsWithProfiles);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Orders",
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Pending Orders",
      value: stats.pendingOrders,
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      title: "Processing",
      value: stats.processingOrders,
      icon: Package,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Shipped",
      value: stats.shippedOrders,
      icon: Truck,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Total Products",
      value: stats.totalProducts,
      icon: CheckCircle,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },
    {
      title: "Low Stock",
      value: stats.lowStockProducts,
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
      pending: { variant: "secondary", className: "bg-yellow-100 text-yellow-800" },
      processing: { variant: "secondary", className: "bg-blue-100 text-blue-800" },
      shipped: { variant: "secondary", className: "bg-purple-100 text-purple-800" },
      delivered: { variant: "secondary", className: "bg-green-100 text-green-800" },
      cancelled: { variant: "destructive", className: "" },
    };
    const config = variants[status] || { variant: "outline" as const, className: "" };
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getActionIcon = (entityType: string) => {
    switch (entityType) {
      case "order":
        return <ShoppingCart className="h-4 w-4" />;
      case "product":
        return <Package className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes("status")) return "bg-blue-100 text-blue-600";
    if (action.includes("stock")) return "bg-green-100 text-green-600";
    return "bg-gray-100 text-gray-600";
  };

  return (
    <ModeratorLayout>
      <Helmet>
        <title>Moderator Dashboard | Furnish</title>
      </Helmet>

      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Moderator Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage orders and monitor product inventory
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Recent Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : recentOrders.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No orders yet</p>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium text-sm">{order.order_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(order.created_at), "MMM dd, yyyy")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-medium text-sm">₹{order.total.toLocaleString()}</p>
                        {getStatusBadge(order.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : activityLogs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No activity yet</p>
              ) : (
                <div className="space-y-3">
                  {activityLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 rounded-lg border p-3"
                    >
                      <div className={`rounded-lg p-2 ${getActionColor(log.action)}`}>
                        {getActionIcon(log.entity_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{log.action}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground truncate">
                            {log.profile?.full_name || log.profile?.email || "Unknown"}
                          </p>
                        </div>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {log.details.old_value && log.details.new_value 
                              ? `${log.details.old_value} → ${log.details.new_value}`
                              : JSON.stringify(log.details)}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(log.created_at), "MMM dd, HH:mm")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ModeratorLayout>
  );
};

export default ModeratorDashboard;
