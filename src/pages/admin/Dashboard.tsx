import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingCart, Users, Package, IndianRupee, TrendingUp, Clock, ArrowUpRight, ArrowDownRight, BarChart3, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { RefreshCw, MessageSquare, ArrowRight } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, ComposedChart } from "recharts";
import { format, subDays, startOfDay, endOfDay, subMonths, startOfMonth, endOfMonth } from "date-fns";

interface DashboardStats {
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  pendingOrders: number;
  ordersChange: number;
  revenueChange: number;
  avgOrderValue: number;
  totalProducts: number;
  pendingRefunds: number;
  pendingContactRequests: number;
}

interface OrdersByDay {
  date: string;
  orders: number;
  revenue: number;
}

interface OrdersByStatus {
  name: string;
  value: number;
  color: string;
}

interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
}

interface MonthlyData {
  month: string;
  orders: number;
  revenue: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    ordersChange: 0,
    revenueChange: 0,
    avgOrderValue: 0,
    totalProducts: 0,
    pendingRefunds: 0,
    pendingContactRequests: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recentContactRequests, setRecentContactRequests] = useState<any[]>([]);
  const [ordersByDay, setOrdersByDay] = useState<OrdersByDay[]>([]);
  const [ordersByDay30, setOrdersByDay30] = useState<OrdersByDay[]>([]);
  const [ordersByStatus, setOrdersByStatus] = useState<OrdersByStatus[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("7d");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Fetch all orders
        const { data: orders, error: ordersError } = await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false });

        if (ordersError) throw ordersError;

        // Fetch users count
        const { data: users, error: usersError } = await supabase
          .from("profiles")
          .select("id");

        if (usersError) throw usersError;

        // Fetch products count
        const { data: products, error: productsError } = await supabase
          .from("products")
          .select("id")
          .eq("is_active", true);

        if (productsError) throw productsError;
 
        // Fetch pending refunds count
        const { data: refundOrders, error: refundError } = await supabase
          .from("orders")
          .select("id")
          .eq("refund_status", "pending");
 
        if (refundError) throw refundError;
 
        // Fetch pending contact requests
        const { data: contactRequests, error: contactError } = await supabase
          .from("contact_requests")
          .select("*")
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(5);
 
        if (contactError) throw contactError;

        // Fetch order items for top products
        const { data: orderItems, error: itemsError } = await supabase
          .from("order_items")
          .select("product_name, quantity, price");

        if (itemsError) throw itemsError;

        // Calculate stats
        const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
        const pendingOrders = orders?.filter((order) => order.status === "pending").length || 0;
        const avgOrderValue = orders && orders.length > 0 ? totalRevenue / orders.length : 0;

        // Calculate change from last 7 days vs previous 7 days
        const today = new Date();
        const last7Days = orders?.filter(o => new Date(o.created_at) >= subDays(today, 7)) || [];
        const prev7Days = orders?.filter(o => {
          const date = new Date(o.created_at);
          return date >= subDays(today, 14) && date < subDays(today, 7);
        }) || [];

        const last7Revenue = last7Days.reduce((sum, o) => sum + Number(o.total), 0);
        const prev7Revenue = prev7Days.reduce((sum, o) => sum + Number(o.total), 0);
        const revenueChange = prev7Revenue > 0 ? ((last7Revenue - prev7Revenue) / prev7Revenue) * 100 : 0;
        const ordersChange = prev7Days.length > 0 ? ((last7Days.length - prev7Days.length) / prev7Days.length) * 100 : 0;

        setStats({
          totalOrders: orders?.length || 0,
          totalUsers: users?.length || 0,
          totalRevenue,
          pendingOrders,
          ordersChange: Math.round(ordersChange),
          revenueChange: Math.round(revenueChange),
          avgOrderValue: Math.round(avgOrderValue),
          totalProducts: products?.length || 0,
          pendingRefunds: refundOrders?.length || 0,
          pendingContactRequests: contactRequests?.length || 0,
        });

        // Recent orders
        setRecentOrders(orders?.slice(0, 5) || []);
 
        // Recent contact requests
        setRecentContactRequests(contactRequests || []);

        // Orders by day (last 7 days)
        const dailyData7: OrdersByDay[] = [];
        for (let i = 6; i >= 0; i--) {
          const date = subDays(today, i);
          const dayOrders = orders?.filter(o => {
            const orderDate = new Date(o.created_at);
            return orderDate >= startOfDay(date) && orderDate <= endOfDay(date);
          }) || [];
          dailyData7.push({
            date: format(date, "MMM dd"),
            orders: dayOrders.length,
            revenue: dayOrders.reduce((sum, o) => sum + Number(o.total), 0),
          });
        }
        setOrdersByDay(dailyData7);

        // Orders by day (last 30 days)
        const dailyData30: OrdersByDay[] = [];
        for (let i = 29; i >= 0; i--) {
          const date = subDays(today, i);
          const dayOrders = orders?.filter(o => {
            const orderDate = new Date(o.created_at);
            return orderDate >= startOfDay(date) && orderDate <= endOfDay(date);
          }) || [];
          dailyData30.push({
            date: format(date, "MMM dd"),
            orders: dayOrders.length,
            revenue: dayOrders.reduce((sum, o) => sum + Number(o.total), 0),
          });
        }
        setOrdersByDay30(dailyData30);

        // Monthly data (last 6 months)
        const monthly: MonthlyData[] = [];
        for (let i = 5; i >= 0; i--) {
          const monthStart = startOfMonth(subMonths(today, i));
          const monthEnd = endOfMonth(subMonths(today, i));
          const monthOrders = orders?.filter(o => {
            const orderDate = new Date(o.created_at);
            return orderDate >= monthStart && orderDate <= monthEnd;
          }) || [];
          monthly.push({
            month: format(monthStart, "MMM yyyy"),
            orders: monthOrders.length,
            revenue: monthOrders.reduce((sum, o) => sum + Number(o.total), 0),
          });
        }
        setMonthlyData(monthly);

        // Orders by status
        const statusCounts = {
          pending: orders?.filter(o => o.status === "pending").length || 0,
          processing: orders?.filter(o => o.status === "processing").length || 0,
          shipped: orders?.filter(o => o.status === "shipped").length || 0,
          delivered: orders?.filter(o => o.status === "delivered").length || 0,
          cancelled: orders?.filter(o => o.status === "cancelled").length || 0,
        };
        setOrdersByStatus([
          { name: "Pending", value: statusCounts.pending, color: "#f59e0b" },
          { name: "Processing", value: statusCounts.processing, color: "#3b82f6" },
          { name: "Shipped", value: statusCounts.shipped, color: "#8b5cf6" },
          { name: "Delivered", value: statusCounts.delivered, color: "#22c55e" },
          { name: "Cancelled", value: statusCounts.cancelled, color: "#ef4444" },
        ]);

        // Top products
        const productMap = new Map<string, { quantity: number; revenue: number }>();
        orderItems?.forEach(item => {
          const existing = productMap.get(item.product_name) || { quantity: 0, revenue: 0 };
          productMap.set(item.product_name, {
            quantity: existing.quantity + item.quantity,
            revenue: existing.revenue + (Number(item.price) * item.quantity),
          });
        });
        const topProds = Array.from(productMap.entries())
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);
        setTopProducts(topProds);

      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const statCards = [
    {
      title: "Total Revenue",
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: IndianRupee,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
      change: stats.revenueChange,
    },
    {
      title: "Total Orders",
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      change: stats.ordersChange,
    },
    {
      title: "Avg Order Value",
      value: `₹${stats.avgOrderValue.toLocaleString()}`,
      icon: BarChart3,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Active Products",
      value: stats.totalProducts,
      icon: Package,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },
    {
      title: "Pending Orders",
      value: stats.pendingOrders,
      icon: Clock,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      title: "Pending Refunds",
      value: stats.pendingRefunds,
      icon: RefreshCw,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Contact Requests",
      value: stats.pendingContactRequests,
      icon: MessageSquare,
      color: "text-cyan-600",
      bgColor: "bg-cyan-100",
    },
  ];

  const getChartData = () => {
    switch (dateRange) {
      case "30d":
        return ordersByDay30;
      case "90d":
        return monthlyData.map(m => ({ date: m.month, orders: m.orders, revenue: m.revenue }));
      default:
        return ordersByDay;
    }
  };

  return (
    <>
      <Helmet>
        <title>Admin Dashboard | Furniture Store</title>
      </Helmet>
      <AdminLayout>
        <div className="space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">Sales reports and analytics overview</p>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Tabs value={dateRange} onValueChange={(v) => setDateRange(v as "7d" | "30d" | "90d")}>
                <TabsList>
                  <TabsTrigger value="7d">7 Days</TabsTrigger>
                  <TabsTrigger value="30d">30 Days</TabsTrigger>
                  <TabsTrigger value="90d">6 Months</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
            {statCards.map((stat) => (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`rounded-full p-2 ${stat.bgColor}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoading ? "..." : stat.value}
                  </div>
                  {stat.change !== undefined && (
                    <p className={`text-xs flex items-center gap-1 mt-1 ${stat.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {stat.change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {Math.abs(stat.change)}% from last week
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Revenue & Orders Combined Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Revenue & Orders Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={getChartData()}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis yAxisId="left" className="text-xs" tickFormatter={(value) => `₹${value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}`} />
                    <YAxis yAxisId="right" orientation="right" className="text-xs" />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        name === "revenue" ? `₹${value.toLocaleString()}` : value,
                        name === "revenue" ? "Revenue" : "Orders"
                      ]}
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                    />
                    <Legend />
                    <Area 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary)/0.2)" 
                      strokeWidth={2}
                      name="Revenue"
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="orders" 
                      stroke="#22c55e" 
                      strokeWidth={2}
                      dot={{ fill: "#22c55e", strokeWidth: 2 }}
                      name="Orders"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Charts Row */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Orders by Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Orders by Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ordersByStatus.filter(s => s.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {ordersByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Top Selling Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topProducts.length === 0 ? (
                  <p className="text-muted-foreground">No sales data yet</p>
                ) : (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topProducts} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" tickFormatter={(value) => `₹${value}`} />
                        <YAxis type="category" dataKey="name" width={120} className="text-xs" />
                        <Tooltip 
                          formatter={(value: number, name: string) => [
                            name === "revenue" ? `₹${value.toLocaleString()}` : value,
                            name === "revenue" ? "Revenue" : "Qty Sold"
                          ]}
                          contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                        />
                        <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Revenue" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

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
                <p className="text-muted-foreground">Loading...</p>
              ) : recentOrders.length === 0 ? (
                <p className="text-muted-foreground">No orders yet</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex flex-col gap-2 rounded-lg border p-4"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{order.order_number}</p>
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            order.status === "delivered"
                              ? "bg-green-100 text-green-700"
                              : order.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : order.status === "processing"
                              ? "bg-blue-100 text-blue-700"
                              : order.status === "shipped"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <p className="text-lg font-bold">₹{Number(order.total).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
 
          {/* Contact Requests Widget */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Recent Contact Requests
              </CardTitle>
              <Link to="/admin/contact-requests">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentContactRequests.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No pending contact requests</p>
              ) : (
                <div className="space-y-3">
                  {recentContactRequests.map((req: any) => (
                    <div
                      key={req.id}
                      className="flex items-start justify-between gap-4 p-3 rounded-lg border bg-secondary/30"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{req.name}</p>
                          <span className="inline-flex rounded-full px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800">
                            {req.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{req.subject}</p>
                        <p className="text-xs text-muted-foreground mt-1">{req.email}</p>
                      </div>
                      <p className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(req.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
 
          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-2">
            <Link to="/admin/refunds">
              <Card className="cursor-pointer hover:bg-secondary/50 transition-colors">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="p-3 rounded-full bg-orange-100">
                    <RefreshCw className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-semibold">Manage Refunds</p>
                    <p className="text-sm text-muted-foreground">
                      {stats.pendingRefunds} pending refund{stats.pendingRefunds !== 1 ? "s" : ""} to review
                    </p>
                  </div>
                  <ArrowRight className="ml-auto h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
            <Link to="/admin/contact-requests">
              <Card className="cursor-pointer hover:bg-secondary/50 transition-colors">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="p-3 rounded-full bg-cyan-100">
                    <MessageSquare className="h-6 w-6 text-cyan-600" />
                  </div>
                  <div>
                    <p className="font-semibold">Customer Inquiries</p>
                    <p className="text-sm text-muted-foreground">
                      {stats.pendingContactRequests} pending request{stats.pendingContactRequests !== 1 ? "s" : ""} to respond
                    </p>
                  </div>
                  <ArrowRight className="ml-auto h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </AdminLayout>
    </>
  );
};

export default Dashboard;
