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
 import { Textarea } from "@/components/ui/textarea";
 import { Label } from "@/components/ui/label";
 import { supabase } from "@/integrations/supabase/client";
 import { toast } from "sonner";
 import { MessageSquare, Search, Filter, Eye, Clock, CheckCircle, XCircle, Mail, Phone } from "lucide-react";
 import { format } from "date-fns";
 
 interface ContactRequest {
   id: string;
   name: string;
   email: string;
   phone: string | null;
   subject: string;
   message: string;
   status: string;
   notes: string | null;
   created_at: string;
   handled_at: string | null;
 }
 
 const statusOptions = ["pending", "in_progress", "resolved", "closed"];
 
 const ContactRequests = () => {
   const [requests, setRequests] = useState<ContactRequest[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [selectedRequest, setSelectedRequest] = useState<ContactRequest | null>(null);
   const [isDialogOpen, setIsDialogOpen] = useState(false);
   const [searchQuery, setSearchQuery] = useState("");
   const [statusFilter, setStatusFilter] = useState<string>("all");
   const [notes, setNotes] = useState("");
 
   const fetchRequests = async () => {
     try {
       const { data, error } = await supabase
         .from("contact_requests")
         .select("*")
         .order("created_at", { ascending: false });
 
       if (error) throw error;
       setRequests(data || []);
     } catch (error) {
       console.error("Error fetching contact requests:", error);
       toast.error("Failed to fetch contact requests");
     } finally {
       setIsLoading(false);
     }
   };
 
   useEffect(() => {
     fetchRequests();
   }, []);
 
   const updateStatus = async (id: string, newStatus: string) => {
     try {
       const updateData: Record<string, any> = { status: newStatus };
       if (newStatus === "resolved" || newStatus === "closed") {
         updateData.handled_at = new Date().toISOString();
       }
 
       const { error } = await supabase
         .from("contact_requests")
         .update(updateData)
         .eq("id", id);
 
       if (error) throw error;
       toast.success(`Status updated to ${newStatus}`);
       fetchRequests();
     } catch (error) {
       console.error("Error updating status:", error);
       toast.error("Failed to update status");
     }
   };
 
   const saveNotes = async () => {
     if (!selectedRequest) return;
     try {
       const { error } = await supabase
         .from("contact_requests")
         .update({ notes })
         .eq("id", selectedRequest.id);
 
       if (error) throw error;
       toast.success("Notes saved");
       fetchRequests();
     } catch (error) {
       console.error("Error saving notes:", error);
       toast.error("Failed to save notes");
     }
   };
 
   const getStatusBadge = (status: string) => {
     const variants: Record<string, string> = {
       pending: "bg-yellow-100 text-yellow-800",
       in_progress: "bg-blue-100 text-blue-800",
       resolved: "bg-green-100 text-green-800",
       closed: "bg-gray-100 text-gray-800",
     };
     return variants[status] || "bg-gray-100 text-gray-800";
   };
 
   const filteredRequests = requests.filter((req) => {
     const matchesSearch = 
       req.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       req.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
       req.subject.toLowerCase().includes(searchQuery.toLowerCase());
     const matchesStatus = statusFilter === "all" || req.status === statusFilter;
     return matchesSearch && matchesStatus;
   });
 
   const stats = {
     pending: requests.filter(r => r.status === "pending").length,
     inProgress: requests.filter(r => r.status === "in_progress").length,
     resolved: requests.filter(r => r.status === "resolved").length,
   };
 
   return (
     <>
       <Helmet>
         <title>Contact Requests | Admin Dashboard</title>
       </Helmet>
       <AdminLayout>
         <div className="space-y-6">
           <div className="flex items-center justify-between">
             <div>
               <h1 className="text-3xl font-bold">Contact Requests</h1>
               <p className="text-muted-foreground">Customer inquiries and custom order requests</p>
             </div>
             <Badge variant="outline" className="text-lg px-4 py-2">
               <MessageSquare className="mr-2 h-4 w-4" />
               {requests.length} Requests
             </Badge>
           </div>
 
           {/* Stats Cards */}
           <div className="grid gap-4 md:grid-cols-3">
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
                   In Progress
                 </CardTitle>
                 <MessageSquare className="h-4 w-4 text-blue-600" />
               </CardHeader>
               <CardContent>
                 <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
               </CardContent>
             </Card>
             <Card>
               <CardHeader className="flex flex-row items-center justify-between pb-2">
                 <CardTitle className="text-sm font-medium text-muted-foreground">
                   Resolved
                 </CardTitle>
                 <CheckCircle className="h-4 w-4 text-green-600" />
               </CardHeader>
               <CardContent>
                 <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
               </CardContent>
             </Card>
           </div>
 
           {/* Requests Table */}
           <Card>
             <CardHeader>
               <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                 <CardTitle className="flex items-center gap-2">
                   <MessageSquare className="h-5 w-5" />
                   Customer Inquiries
                 </CardTitle>
                 <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                   <div className="relative">
                     <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                     <Input
                       placeholder="Search requests..."
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
                       {statusOptions.map((status) => (
                         <SelectItem key={status} value={status}>
                           <span className="capitalize">{status.replace("_", " ")}</span>
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
               </div>
             </CardHeader>
             <CardContent>
               {isLoading ? (
                 <p className="text-muted-foreground">Loading contact requests...</p>
               ) : filteredRequests.length === 0 ? (
                 <div className="text-center py-12">
                   <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                   <p className="text-muted-foreground">
                     {searchQuery || statusFilter !== "all" ? "No requests match your filters" : "No contact requests yet"}
                   </p>
                 </div>
               ) : (
                 <Table>
                   <TableHeader>
                     <TableRow>
                       <TableHead>Name</TableHead>
                       <TableHead>Subject</TableHead>
                       <TableHead>Contact</TableHead>
                       <TableHead>Date</TableHead>
                       <TableHead>Status</TableHead>
                       <TableHead>Actions</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {filteredRequests.map((req) => (
                       <TableRow key={req.id}>
                         <TableCell className="font-medium">{req.name}</TableCell>
                         <TableCell>
                           <span className="line-clamp-1 max-w-[200px]">{req.subject}</span>
                         </TableCell>
                         <TableCell>
                           <div className="flex flex-col gap-1 text-sm">
                             <span className="flex items-center gap-1">
                               <Mail className="h-3 w-3 text-muted-foreground" />
                               {req.email}
                             </span>
                             {req.phone && (
                               <span className="flex items-center gap-1">
                                 <Phone className="h-3 w-3 text-muted-foreground" />
                                 {req.phone}
                               </span>
                             )}
                           </div>
                         </TableCell>
                         <TableCell>{format(new Date(req.created_at), "MMM dd, yyyy")}</TableCell>
                         <TableCell>
                           <Select
                             value={req.status}
                             onValueChange={(value) => updateStatus(req.id, value)}
                           >
                             <SelectTrigger className="w-32">
                               <SelectValue />
                             </SelectTrigger>
                             <SelectContent>
                               {statusOptions.map((status) => (
                                 <SelectItem key={status} value={status}>
                                   <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${getStatusBadge(status)}`}>
                                     {status.replace("_", " ")}
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
                             onClick={() => {
                               setSelectedRequest(req);
                               setNotes(req.notes || "");
                               setIsDialogOpen(true);
                             }}
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
 
         {/* Request Details Dialog */}
         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
           <DialogContent className="max-w-lg">
             <DialogHeader>
               <DialogTitle>Contact Request Details</DialogTitle>
             </DialogHeader>
             {selectedRequest && (
               <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-4 text-sm">
                   <div>
                     <p className="text-muted-foreground">Name</p>
                     <p className="font-medium">{selectedRequest.name}</p>
                   </div>
                   <div>
                     <p className="text-muted-foreground">Date</p>
                     <p>{format(new Date(selectedRequest.created_at), "MMM dd, yyyy HH:mm")}</p>
                   </div>
                   <div>
                     <p className="text-muted-foreground">Email</p>
                     <a href={`mailto:${selectedRequest.email}`} className="text-primary hover:underline">
                       {selectedRequest.email}
                     </a>
                   </div>
                   <div>
                     <p className="text-muted-foreground">Phone</p>
                     {selectedRequest.phone ? (
                       <a href={`tel:${selectedRequest.phone}`} className="text-primary hover:underline">
                         {selectedRequest.phone}
                       </a>
                     ) : (
                       <p className="text-muted-foreground">Not provided</p>
                     )}
                   </div>
                 </div>
                 
                 <div className="border-t pt-4">
                   <p className="text-muted-foreground text-sm mb-1">Subject</p>
                   <p className="font-medium">{selectedRequest.subject}</p>
                 </div>
 
                 <div>
                   <p className="text-muted-foreground text-sm mb-1">Message</p>
                   <p className="bg-secondary/50 p-3 rounded-lg whitespace-pre-wrap">
                     {selectedRequest.message}
                   </p>
                 </div>
 
                 <div className="border-t pt-4">
                   <Label htmlFor="notes">Admin Notes</Label>
                   <Textarea
                     id="notes"
                     value={notes}
                     onChange={(e) => setNotes(e.target.value)}
                     placeholder="Add notes about this request..."
                     rows={3}
                     className="mt-2"
                   />
                   <Button onClick={saveNotes} size="sm" className="mt-2">
                     Save Notes
                   </Button>
                 </div>
               </div>
             )}
           </DialogContent>
         </Dialog>
       </AdminLayout>
     </>
   );
 };
 
 export default ContactRequests;