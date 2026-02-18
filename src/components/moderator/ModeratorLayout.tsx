import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  LogOut,
  ChevronRight,
  Home,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface ModeratorLayoutProps {
  children: ReactNode;
}

const navItems = [
  { label: "Dashboard", href: "/moderator", icon: LayoutDashboard },
  { label: "Orders", href: "/moderator/orders", icon: ShoppingCart },
  { label: "Products", href: "/moderator/products", icon: Package },
];

const ModeratorLayout = ({ children }: ModeratorLayoutProps) => {
  const { signOut, profile, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-background">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b px-6">
            <Link to="/moderator" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Shield className="h-4 w-4" />
              </div>
              <span className="font-semibold">Moderator Panel</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                  {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t p-4">
            <div className="mb-3 rounded-lg bg-muted p-3">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs text-muted-foreground">Logged in as</p>
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                  Moderator
                </Badge>
              </div>
              <p className="truncate text-sm font-medium">{profile?.email}</p>
            </div>
            <div className="flex gap-2">
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => navigate("/admin")}
                >
                  Admin
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => navigate("/")}
              >
                <Home className="mr-2 h-4 w-4" />
                Store
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="pl-64">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
};

export default ModeratorLayout;
