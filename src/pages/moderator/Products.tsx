import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import ModeratorLayout from "@/components/moderator/ModeratorLayout";
import { Card, CardContent } from "@/components/ui/card";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activityLogger";
import { Search, Package, Edit } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  original_price: number | null;
  image_url: string | null;
  in_stock: boolean | null;
  stock_count: number | null;
  is_active: boolean | null;
  category?: {
    id: string;
    name: string;
  } | null;
}

const ModeratorProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editStock, setEditStock] = useState(0);
  const [editInStock, setEditInStock] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*, category:categories(id, name)")
        .order("name");

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to fetch products");
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (product: Product) => {
    setSelectedProduct(product);
    setEditStock(product.stock_count || 0);
    setEditInStock(product.in_stock ?? true);
    setIsEditOpen(true);
  };

  const handleUpdateStock = async () => {
    if (!selectedProduct) return;

    const oldStock = selectedProduct.stock_count;
    const oldInStock = selectedProduct.in_stock;

    try {
      const { error } = await supabase
        .from("products")
        .update({
          stock_count: editStock,
          in_stock: editInStock,
        })
        .eq("id", selectedProduct.id);

      if (error) throw error;

      // Log activity
      await logActivity({
        action: `Updated product stock`,
        entityType: "product",
        entityId: selectedProduct.name,
        details: {
          old_value: `Stock: ${oldStock}, In Stock: ${oldInStock}`,
          new_value: `Stock: ${editStock}, In Stock: ${editInStock}`,
        },
      });

      toast.success("Product stock updated successfully");
      setIsEditOpen(false);
      fetchProducts();
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product stock");
    }
  };

  const getStockBadge = (inStock: boolean | null, stockCount: number | null) => {
    if (!inStock) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    }
    if ((stockCount || 0) < 10) {
      return <Badge className="bg-yellow-100 text-yellow-800">Low Stock ({stockCount})</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800">In Stock ({stockCount})</Badge>;
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStock =
      stockFilter === "all" ||
      (stockFilter === "in_stock" && product.in_stock) ||
      (stockFilter === "out_of_stock" && !product.in_stock) ||
      (stockFilter === "low_stock" && product.in_stock && (product.stock_count || 0) < 10);
    return matchesSearch && matchesStock;
  });

  return (
    <ModeratorLayout>
      <Helmet>
        <title>Manage Products | Moderator</title>
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Products</h1>
            <p className="text-muted-foreground mt-1">
              View products and update stock levels
            </p>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <Package className="h-4 w-4 mr-2" />
            {products.length} Products
          </Badge>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by stock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="in_stock">In Stock</SelectItem>
                  <SelectItem value="low_stock">Low Stock</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {product.image_url && (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="h-10 w-10 rounded object-cover"
                            />
                          )}
                          <div>
                            <p className="font-medium">{product.name}</p>
                            {!product.is_active && (
                              <Badge variant="outline" className="text-xs">Inactive</Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{product.category?.name || "Uncategorized"}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">₹{product.price.toLocaleString()}</p>
                          {product.original_price && product.original_price > product.price && (
                            <p className="text-sm text-muted-foreground line-through">
                              ₹{product.original_price.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStockBadge(product.in_stock, product.stock_count)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(product)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Update Stock
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Edit Stock Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Stock - {selectedProduct?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="stock_count">Stock Count</Label>
              <Input
                id="stock_count"
                type="number"
                min="0"
                value={editStock}
                onChange={(e) => setEditStock(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="in_stock">Stock Status</Label>
              <Select
                value={editInStock ? "true" : "false"}
                onValueChange={(value) => setEditInStock(value === "true")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">In Stock</SelectItem>
                  <SelectItem value="false">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStock}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModeratorLayout>
  );
};

export default ModeratorProducts;
