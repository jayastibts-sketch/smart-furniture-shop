import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, Heart, ShoppingCart, User, Menu, X, ChevronDown, LogOut, Settings, Package, ShieldCheck, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchWithSuggestions } from "@/components/search/SearchWithSuggestions";
import { useStore } from "@/store/useStore";
import { categories } from "@/data/products";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const {
    cart,
    wishlist
  } = useStore();
  const {
    user,
    profile,
    isAdmin,
    isModerator,
    signOut,
    isLoading
  } = useAuth();
  const { t } = useLanguage();
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);
  const navLinks = [{
    label: t("nav.home"),
    href: "/"
  }, {
    label: t("nav.shop"),
    href: "/products"
  }, {
    label: t("nav.categories"),
    href: "/products",
    hasDropdown: true
  }, {
    label: t("nav.quiz"),
    href: "/quiz"
  }, {
    label: t("nav.about"),
    href: "/about"
  }, {
    label: t("nav.contact"),
    href: "/contact"
  }];
  return <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-background/95 backdrop-blur-md shadow-soft" : "bg-transparent"}`}>
      {/* Promo Banner */}
      <div className="bg-primary text-primary-foreground text-center py-2 text-sm font-medium">
        {t("promo.banner")}
      </div>

      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Mobile Menu Toggle */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl md:text-3xl font-bold text-foreground tracking-tight font-serif">Guna woodcraft</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map(link => link.hasDropdown ? <DropdownMenu key={link.label}>
                  <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium text-foreground/80 hover:text-primary transition-colors">
                    {link.label}
                    <ChevronDown className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-48">
                    {categories.map(cat => <DropdownMenuItem key={cat.id} asChild>
                        <Link to={`/products?category=${cat.id}`}>
                          {cat.name}
                        </Link>
                      </DropdownMenuItem>)}
                  </DropdownMenuContent>
                </DropdownMenu> : <Link key={link.label} to={link.href} className={`text-sm font-medium transition-colors ${location.pathname === link.href ? "text-primary" : "text-foreground/80 hover:text-primary"}`}>
                  {link.label}
                </Link>)}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1 md:gap-2">
            {/* Theme & Language */}
            <div className="hidden md:flex items-center">
              <ThemeToggle />
              <LanguageSwitcher />
            </div>
            {/* Search */}
            <div className="hidden md:flex items-center">
              {isSearchOpen ? <div className="flex items-center gap-2 animate-fade-in">
                  <SearchWithSuggestions
                    className="w-64 lg:w-80"
                    autoFocus
                    onClose={() => setIsSearchOpen(false)}
                  />
                </div> : <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)}>
                  <Search className="h-5 w-5" />
                </Button>}
            </div>

            {/* Wishlist */}
            <Link to="/wishlist">
              <Button variant="ghost" size="icon" className="relative">
                <Heart className="h-5 w-5" />
                {wishlist.length > 0 && <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                    {wishlist.length}
                  </span>}
              </Button>
            </Link>

            {/* Cart */}
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                    {cartCount}
                  </span>}
              </Button>
            </Link>

            {/* User */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hidden md:flex relative">
                  <User className="h-5 w-5" />
                  {user && <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-green-500" />}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle className="font-display">My Account</SheetTitle>
                </SheetHeader>
                {isLoading ? <div className="mt-8 text-center text-muted-foreground">Loading...</div> : user ? <div className="mt-6 space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {profile?.full_name || "User"}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {profile?.email}
                        </p>
                      </div>
                      {isAdmin && <ShieldCheck className="h-4 w-4 text-primary" />}
                      {isModerator && !isAdmin && <Shield className="h-4 w-4 text-blue-600" />}
                    </div>
                    <Separator />
                    <nav className="space-y-1">
                      {isAdmin && <Link to="/admin" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium">
                          <ShieldCheck className="h-4 w-4" />
                          <span>Admin Dashboard</span>
                        </Link>}
                      {isModerator && <Link to="/moderator" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors font-medium">
                          <Shield className="h-4 w-4" />
                          <span>Moderator Dashboard</span>
                        </Link>}
                      <Link to="/profile" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <Settings className="h-4 w-4" />
                        <span>Profile Settings</span>
                      </Link>
                      <Link to="/profile?tab=orders" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <Package className="h-4 w-4" />
                        <span>Order History</span>
                      </Link>
                    </nav>
                    <Separator />
                    <Button variant="outline" className="w-full" onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div> : <div className="mt-8 space-y-4">
                    <Link to="/auth">
                      <Button variant="default" className="w-full">
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/auth?tab=signup">
                      <Button variant="outline" className="w-full">
                        Create Account
                      </Button>
                    </Link>
                  </div>}
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="mb-4">
              <SearchWithSuggestions className="w-full" onClose={() => setIsMobileMenuOpen(false)} />
            </div>
            <nav className="flex flex-col gap-4">
              {navLinks.map(link => <Link key={link.label} to={link.href} className={`text-base font-medium transition-colors ${location.pathname === link.href ? "text-primary" : "text-foreground/80 hover:text-primary"}`}>
                  {link.label}
                </Link>)}
            </nav>
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
              <ThemeToggle />
              <LanguageSwitcher />
            </div>
          </div>}
      </div>
    </header>;
}