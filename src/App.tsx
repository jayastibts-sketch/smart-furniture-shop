import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import ProtectedAdminRoute from "@/components/admin/ProtectedAdminRoute";
import ProtectedModeratorRoute from "@/components/moderator/ProtectedModeratorRoute";
import { ChatbotWidget } from "@/components/chatbot/ChatbotWidget";
import Index from "./pages/Index";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Wishlist from "./pages/Wishlist";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import OrderTracking from "./pages/OrderTracking";
import Quiz from "./pages/Quiz";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminOrders from "./pages/admin/Orders";
import AdminUsers from "./pages/admin/Users";
import AdminProducts from "./pages/admin/Products";
import AdminCategories from "./pages/admin/Categories";
import AdminCustomers from "./pages/admin/Customers";
import AdminRefunds from "./pages/admin/Refunds";
import AdminContactRequests from "./pages/admin/ContactRequests";
import AdminNewsletterSubscribers from "./pages/admin/NewsletterSubscribers";
import ModeratorDashboard from "./pages/moderator/Dashboard";
import ModeratorOrders from "./pages/moderator/Orders";
import ModeratorProducts from "./pages/moderator/Products";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AuthProvider>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:id" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/wishlist" element={<Wishlist />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/order/:orderNumber" element={<OrderTracking />} />
                  <Route path="/quiz" element={<Quiz />} />
                  {/* Admin Routes */}
                  <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
                  <Route path="/admin/orders" element={<ProtectedAdminRoute><AdminOrders /></ProtectedAdminRoute>} />
                  <Route path="/admin/users" element={<ProtectedAdminRoute><AdminUsers /></ProtectedAdminRoute>} />
                  <Route path="/admin/products" element={<ProtectedAdminRoute><AdminProducts /></ProtectedAdminRoute>} />
                  <Route path="/admin/categories" element={<ProtectedAdminRoute><AdminCategories /></ProtectedAdminRoute>} />
                  <Route path="/admin/customers" element={<ProtectedAdminRoute><AdminCustomers /></ProtectedAdminRoute>} />
                  <Route path="/admin/refunds" element={<ProtectedAdminRoute><AdminRefunds /></ProtectedAdminRoute>} />
                  <Route path="/admin/contact-requests" element={<ProtectedAdminRoute><AdminContactRequests /></ProtectedAdminRoute>} />
                  <Route path="/admin/newsletter" element={<ProtectedAdminRoute><AdminNewsletterSubscribers /></ProtectedAdminRoute>} />
                  {/* Moderator Routes */}
                  <Route path="/moderator" element={<ProtectedModeratorRoute><ModeratorDashboard /></ProtectedModeratorRoute>} />
                  <Route path="/moderator/orders" element={<ProtectedModeratorRoute><ModeratorOrders /></ProtectedModeratorRoute>} />
                  <Route path="/moderator/products" element={<ProtectedModeratorRoute><ModeratorProducts /></ProtectedModeratorRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <ChatbotWidget />
              </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
