 import { useEffect, useState } from "react";
 import { Helmet } from "react-helmet-async";
 import AdminLayout from "@/components/admin/AdminLayout";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
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
 import { Input } from "@/components/ui/input";
 import { supabase } from "@/integrations/supabase/client";
 import { toast } from "sonner";
 import { RefreshCw, Search, Filter, Eye, IndianRupee, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
 import { format } from "date-fns";
 
 interface RefundOrder {
   id: string;
   order_number: string;
   status: string;
   payment_status: string;
   total: number;
   refund_status: string | null;
   refund_requested_at: string | null;
   cancellation_reason: string | null;
   cancelled_at: string | null;
   created_at: string;
   profile?: {
     email: string;
     full_name: string | null;
   };
 }
 
 const refundStatuses = ["pending", "approved", "processed", "rejected"];
 
 const Refunds = () => {
   const [orders, setOrders] = useState<RefundOrder[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [selectedOrder, setSelectedOrder] = useState<RefundOrder | null>(null);
   const [isDialogOpen, setIsDialogOpen] = useState(false);
   const [searchQuery, setSearchQuery] = useState("");
   const [statusFilter, setStatusFilter] = useState<string>("all");
 
   const fetchRefundOrders = async () => {
     try {
       const { data: ordersData, error: ordersError } = await supabase
         .from("orders")
         .select("*")
         .not("refund_status", "is", null)
         .order("refund_requested_at", { ascending: false });
 
       if (ordersError) throw ordersError;
 
       // Fetch profiles for each order
       const userIds = [...new Set((ordersData || []).map(o => o.user_id))];
       const { data: profilesData } = await supabase
         .from("profiles")
         .select("user_id, email, full_name")
         .in("user_id", userIds);
 
       const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
       
       const ordersWithProfiles = (ordersData || []).map(order => ({
         ...order,
         profile: profilesMap.get(order.user_id),
       }));
 
       setOrders(ordersWithProfiles);
     } catch (error) {
       console.error("Error fetching refund orders:", error);
       toast.error("Failed to fetch refund orders");
     } finally {
       setIsLoading(false);
     }
   };
 
   useEffect(() => {
     fetchRefundOrders();
   }, []);
 
   const updateRefundStatus = async (orderId: string, newStatus: string) => {
     try {
       const updateData: Record<string, any> = { refund_status: newStatus };
       
       // If processed, also update payment_status to refunded
       if (newStatus === "processed") {
         updateData.payment_status = "refunded";
       }
 
       const { error } = await supabase
         .from("orders")
         .update(updateData)
         .eq("id", orderId);
 
       if (error) throw error;
       toast.success(`Refund status updated to ${newStatus}`);
       fetchRefundOrders();
     } catch (error) {
       console.error("Error updating refund status:", error);
       toast.error("Failed to update refund status");
     }
   };
 
   const getStatusBadge = (status: string) => {
     const variants: Record<string, { className: string; icon: React.ReactNode }> = {
       pending: { className: "bg-yellow-100 text-yellow-800", icon: <Clock className="h-3 w-3" /> },
       approved: { className: "bg-blue-100 text-blue-800", icon: <AlertCircle className="h-3 w-3" /> },
       processed: { className: "bg-green-100 text-green-800", icon: <CheckCircle className="h-3 w-3" /> },
       rejected: { className: "bg-red-100 text-red-800", icon: <XCircle className="h-3 w-3" /> },
     };
     return variants[status] || { className: "bg-gray-100 text-gray-800", icon: null };
   };
 
   const filteredOrders = orders.filter((order) => {
     const matchesSearch = 
       order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
       order.profile?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       order.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
     const matchesStatus = statusFilter === "all" || order.refund_status === statusFilter;
     return matchesSearch && matchesStatus;
   });
 
   const stats = {
     pending: orders.filter(o => o.refund_status === "pending").length,
     approved: orders.filter(o => o.refund_status === "approved").length,
     processed: orders.filter(o => o.refund_status === "processed").length,
     rejected: orders.filter(o => o.refund_status === "rejected").length,
     totalAmount: orders.filter(o => o.refund_status === "pending" || o.refund_status === "approved")
       .reduce((sum, o) => sum + Number(o.total), 0),
   };
 
   return (
     <>
       <Helmet>
         <title>Refunds Management | Admin Dashboard</title>
       </Helmet>
       <AdminLayout>
         <div className="space-y-6">
           <div className="flex items-center justify-between">
             <div>
               <h1 className="text-3xl font-bold">Refunds</h1>
               <p className="text-muted-foreground">Manage order cancellations and refunds</p>
             </div>
             <Badge variant="outline" className="text-lg px-4 py-2">
               <RefreshCw className="mr-2 h-4 w-4" />
               {orders.length} Refund Requests
             </Badge>
           </div>
 
           {/* Stats Cards */}
           <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
             <Card>
               <CardHeader className="flex flex-row items-center justify-between pb-2">
                 <CardTitle className="text-sm font-medium text-muted-foreground">
                   Pending
                 </CardTitle>
                 <Clock className="h-4 w-4 text-yellow-600" />
               </CardHeader>
               <CardContent>
                 <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
               </CardContent>
             </Card>
             <Card>
               <CardHeader className="flex flex-row items-center justify-between pb-2">
                 <CardTitle className="text-sm font-medium text-muted-foreground">
                   Approved
                 </CardTitle>
                 <AlertCircle className="h-4 w-4 text-blue-600" />
               </CardHeader>
               <CardContent>
                 <div className="text-2xl font-bold text-blue-600">{stats.approved}</div>
               </CardContent>
             </Card>
             <Card>
               <CardHeader className="flex flex-row items-center justify-between pb-2">
                 <CardTitle className="text-sm font-medium text-muted-foreground">
                   Processed
                 </CardTitle>
                 <CheckCircle className="h-4 w-4 text-green-600" />
               </CardHeader>
               <CardContent>
                 <div className="text-2xl font-bold text-green-600">{stats.processed}</div>
               </CardContent>
             </Card>
             <Card>
               <CardHeader className="flex flex-row items-center justify-between pb-2">
                 <CardTitle className="text-sm font-medium text-muted-foreground">
                   Rejected
                 </CardTitle>
                 <XCircle className="h-4 w-4 text-red-600" />
               </CardHeader>
               <CardContent>
                 <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
               </CardContent>
             </Card>
             <Card>
               <CardHeader className="flex flex-row items-center justify-between pb-2">
                 <CardTitle className="text-sm font-medium text-muted-foreground">
                   Pending Amount
                 </CardTitle>
                 <IndianRupee className="h-4 w-4 text-amber-600" />
               </CardHeader>
               <CardContent>
                 <div className="text-2xl font-bold text-amber-600">₹{stats.totalAmount.toLocaleString()}</div>
               </CardContent>
             </Card>
           </div>
 
           {/* Refunds Table */}
           <Card>
             <CardHeader>
               <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                 <CardTitle className="flex items-center gap-2">
                   <RefreshCw className="h-5 w-5" />
                   Refund Requests
                 </CardTitle>
                 <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                   <div className="relative">
                     <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                     <Input
                       placeholder="Search orders..."
                       value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)}
                       className="pl-9 w-full sm:w-48"
                     />
                   </div>
                   <Select value={statusFilter} onValueChange={setStatusFilter}>
                     <SelectTrigger className="w-full sm:w-36">
                       <Filter className="mr-2 h-4 w-4" />
                       <SelectValue placeholder="Filter status" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="all">All Statuses</SelectItem>
                       {refundStatuses.map((status) => (
                         <SelectItem key={status} value={status}>
                           <span className="capitalize">{status}</span>
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
               </div>
             </CardHeader>
             <CardContent>
               {isLoading ? (
                 <p className="text-muted-foreground">Loading refund requests...</p>
               ) : filteredOrders.length === 0 ? (
                 <div className="text-center py-12">
                   <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                   <p className="text-muted-foreground">
                     {searchQuery || statusFilter !== "all" ? "No refunds match your filters" : "No refund requests yet"}
                   </p>
                 </div>
               ) : (
                 <Table>
                   <TableHeader>
                     <TableRow>
                       <TableHead>Order #</TableHead>
                       <TableHead>Customer</TableHead>
                       <TableHead>Request Date</TableHead>
                       <TableHead>Amount</TableHead>
                       <TableHead>Reason</TableHead>
                       <TableHead>Status</TableHead>
                       <TableHead>Actions</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {filteredOrders.map((order) => {
                       const statusInfo = getStatusBadge(order.refund_status || "pending");
                       return (
                         <TableRow key={order.id}>
                           <TableCell className="font-medium">{order.order_number}</TableCell>
                           <TableCell>
                             <div className="text-sm">
                               <p className="font-medium">{order.profile?.full_name || "N/A"}</p>
                               <p className="text-muted-foreground">{order.profile?.email || "N/A"}</p>
                             </div>
                           </TableCell>
                           <TableCell>
                             {order.refund_requested_at 
                               ? format(new Date(order.refund_requested_at), "MMM dd, yyyy")
                               : "-"}
                           </TableCell>
                           <TableCell className="font-semibold">₹{Number(order.total).toLocaleString()}</TableCell>
                           <TableCell>
                             <span className="text-sm text-muted-foreground line-clamp-1 max-w-[150px]">
                               {order.cancellation_reason || "No reason provided"}
                             </span>
                           </TableCell>
                           <TableCell>
                             <Select
                               value={order.refund_status || "pending"}
                               onValueChange={(value) => updateRefundStatus(order.id, value)}
                             >
                               <SelectTrigger className="w-32">
                                 <div className="flex items-center gap-1">
                                   {statusInfo.icon}
                                   <SelectValue />
                                 </div>
                               </SelectTrigger>
                               <SelectContent>
                                 {refundStatuses.map((status) => {
                                   const info = getStatusBadge(status);
                                   return (
                                     <SelectItem key={status} value={status}>
                                       <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${info.className}`}>
                                         {info.icon}
                                         {status}
                                       </span>
                                     </SelectItem>
                                   );
                                 })}
                               </SelectContent>
                             </Select>
                           </TableCell>
                           <TableCell>
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => {
                                 setSelectedOrder(order);
                                 setIsDialogOpen(true);
                               }}
                             >
                               <Eye className="h-4 w-4" />
                             </Button>
                           </TableCell>
                         </TableRow>
                       );
                     })}
                   </TableBody>
                 </Table>
               )}
             </CardContent>
           </Card>
         </div>
 
         {/* Order Details Dialog */}
         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
           <DialogContent className="max-w-lg">
             <DialogHeader>
               <DialogTitle>Refund Details - {selectedOrder?.order_number}</DialogTitle>
             </DialogHeader>
             {selectedOrder && (
               <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-4 text-sm">
                   <div>
                     <p className="text-muted-foreground">Customer</p>
                     <p className="font-medium">{selectedOrder.profile?.full_name || "N/A"}</p>
                     <p className="text-muted-foreground">{selectedOrder.profile?.email}</p>
                   </div>
                   <div>
                     <p className="text-muted-foreground">Refund Amount</p>
                     <p className="font-bold text-xl text-primary">₹{Number(selectedOrder.total).toLocaleString()}</p>
                   </div>
                 </div>
                 
                 <div className="border-t pt-4">
                   <p className="text-muted-foreground text-sm mb-1">Cancellation Reason</p>
                   <p className="bg-secondary/50 p-3 rounded-lg">
                     {selectedOrder.cancellation_reason || "No reason provided"}
                   </p>
                 </div>
 
                 <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
                   <div>
                     <p className="text-muted-foreground">Order Date</p>
                     <p>{format(new Date(selectedOrder.created_at), "MMM dd, yyyy")}</p>
                   </div>
                   <div>
                     <p className="text-muted-foreground">Cancelled At</p>
                     <p>{selectedOrder.cancelled_at ? format(new Date(selectedOrder.cancelled_at), "MMM dd, yyyy HH:mm") : "-"}</p>
                   </div>
                   <div>
                     <p className="text-muted-foreground">Refund Requested</p>
                     <p>{selectedOrder.refund_requested_at ? format(new Date(selectedOrder.refund_requested_at), "MMM dd, yyyy HH:mm") : "-"}</p>
                   </div>
                   <div>
                     <p className="text-muted-foreground">Current Status</p>
                     <Badge className={getStatusBadge(selectedOrder.refund_status || "pending").className}>
                       {selectedOrder.refund_status || "pending"}
                     </Badge>
                   </div>
                 </div>
               </div>
             )}
           </DialogContent>
         </Dialog>
       </AdminLayout>
     </>
   );
 };
 
 export default Refunds;