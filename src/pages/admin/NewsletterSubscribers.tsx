import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Search, Loader2, Trash2, Users, UserCheck, UserX, Download } from "lucide-react";
import { format } from "date-fns";

interface Subscriber {
  id: string;
  email: string;
  subscribed_at: string;
  is_active: boolean;
}

export default function NewsletterSubscribers() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchSubscribers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("*")
        .order("subscribed_at", { ascending: false });

      if (error) throw error;
      setSubscribers(data || []);
    } catch (err) {
      console.error("Error fetching subscribers:", err);
      toast.error("Failed to load subscribers");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const handleToggleActive = async (subscriber: Subscriber) => {
    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .update({ is_active: !subscriber.is_active })
        .eq("id", subscriber.id);

      if (error) throw error;

      setSubscribers((prev) =>
        prev.map((s) =>
          s.id === subscriber.id ? { ...s, is_active: !s.is_active } : s
        )
      );
      toast.success(
        subscriber.is_active
          ? "Subscriber deactivated"
          : "Subscriber reactivated"
      );
    } catch (err) {
      console.error("Error updating subscriber:", err);
      toast.error("Failed to update subscriber");
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setSubscribers((prev) => prev.filter((s) => s.id !== id));
      toast.success("Subscriber removed");
    } catch (err) {
      console.error("Error deleting subscriber:", err);
      toast.error("Failed to remove subscriber");
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportCSV = () => {
    const activeSubscribers = filteredSubscribers.filter((s) => s.is_active);
    const csv = [
      ["Email", "Subscribed At", "Status"],
      ...filteredSubscribers.map((s) => [
        s.email,
        format(new Date(s.subscribed_at), "yyyy-MM-dd HH:mm"),
        s.is_active ? "Active" : "Inactive",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-subscribers-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredSubscribers.length} subscribers`);
  };

  const filteredSubscribers = subscribers.filter((s) =>
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = subscribers.filter((s) => s.is_active).length;
  const inactiveCount = subscribers.filter((s) => !s.is_active).length;

  return (
    <>
      <Helmet>
        <title>Newsletter Subscribers | Admin</title>
      </Helmet>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Newsletter Subscribers</h1>
              <p className="text-muted-foreground mt-1">
                Manage customers who subscribed to your newsletter
              </p>
            </div>
            <Button onClick={handleExportCSV} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Subscribers</p>
                  <p className="text-2xl font-bold">{subscribers.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserCheck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold text-primary">{activeCount}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <UserX className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Inactive</p>
                  <p className="text-2xl font-bold text-muted-foreground">{inactiveCount}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Subscriber List
                </CardTitle>
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by email..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredSubscribers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Mail className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No subscribers found</p>
                  <p className="text-sm mt-1">
                    {searchQuery
                      ? "Try a different search query"
                      : "Subscribers will appear here once they sign up"}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Subscribed At</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubscribers.map((subscriber) => (
                      <TableRow key={subscriber.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            {subscriber.email}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(subscriber.subscribed_at), "dd MMM yyyy, HH:mm")}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={subscriber.is_active ? "default" : "secondary"}
                            className={subscriber.is_active ? "bg-green-500 hover:bg-green-600" : ""}
                          >
                            {subscriber.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleActive(subscriber)}
                            >
                              {subscriber.is_active ? (
                                <>
                                  <UserX className="h-3 w-3 mr-1" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-3 w-3 mr-1" />
                                  Reactivate
                                </>
                              )}
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  disabled={deletingId === subscriber.id}
                                >
                                  {deletingId === subscriber.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3 w-3" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove Subscriber</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to permanently remove{" "}
                                    <strong>{subscriber.email}</strong> from the newsletter? This
                                    cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(subscriber.id)}
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </>
  );
}
