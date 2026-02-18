import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, ArrowRight, Clock, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface ProductSuggestion {
  id: string;
  name: string;
  slug: string;
  price: number;
  image_url: string | null;
  category_name?: string;
}

interface SearchWithSuggestionsProps {
  onClose?: () => void;
  className?: string;
  inputClassName?: string;
  autoFocus?: boolean;
}

const TRENDING_SEARCHES = ["Teak Wood", "Dining Table", "Sofa", "Bookshelf", "Office Chair"];

export function SearchWithSuggestions({
  onClose,
  className,
  inputClassName,
  autoFocus = false,
}: SearchWithSuggestionsProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("recent-searches");
      if (stored) setRecentSearches(JSON.parse(stored).slice(0, 5));
    } catch {}
  }, []);

  const saveRecentSearch = (term: string) => {
    const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("recent-searches", JSON.stringify(updated));
  };

  const removeRecentSearch = (term: string) => {
    const updated = recentSearches.filter((s) => s !== term);
    setRecentSearches(updated);
    localStorage.setItem("recent-searches", JSON.stringify(updated));
  };

  const clearAllRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("recent-searches");
  };

  const fetchSuggestions = useCallback(async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setSuggestions([]);
      return;
    }
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from("products")
        .select("id, name, slug, price, image_url, category_id, categories(name)")
        .eq("is_active", true)
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .limit(6);

      if (data) {
        setSuggestions(
          data.map((p: any) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: p.price,
            image_url: p.image_url,
            category_name: p.categories?.name,
          }))
        );
      }
    } catch {
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchSuggestions]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const navigateToProduct = (slug: string, name: string) => {
    saveRecentSearch(name);
    setIsOpen(false);
    setQuery("");
    onClose?.();
    navigate(`/products/${slug}`);
  };

  const navigateToSearch = (term: string) => {
    if (!term.trim()) return;
    saveRecentSearch(term);
    setIsOpen(false);
    setQuery("");
    onClose?.();
    navigate(`/products?search=${encodeURIComponent(term)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = suggestions.length;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        navigateToProduct(suggestions[selectedIndex].slug, suggestions[selectedIndex].name);
      } else {
        navigateToSearch(query);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      onClose?.();
    }
  };

  const showDropdown = isOpen && (query.length > 0 || recentSearches.length > 0);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search furniture..."
          className={cn("pl-9 pr-9", inputClassName)}
          autoFocus={autoFocus}
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setSuggestions([]);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Product suggestions */}
          {query.length >= 2 && suggestions.length > 0 && (
            <div className="p-2">
              <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">Products</p>
              {suggestions.map((product, index) => (
                <button
                  key={product.id}
                  onClick={() => navigateToProduct(product.slug, product.name)}
                  className={cn(
                    "w-full flex items-center gap-3 px-2 py-2 rounded-md text-left transition-colors",
                    selectedIndex === index ? "bg-accent text-accent-foreground" : "hover:bg-muted/50"
                  )}
                >
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-10 w-10 rounded-md object-cover bg-muted flex-shrink-0"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-md bg-muted flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    {product.category_name && (
                      <p className="text-xs text-muted-foreground">{product.category_name}</p>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-primary whitespace-nowrap">
                    ₹{product.price.toLocaleString()}
                  </span>
                </button>
              ))}
              <button
                onClick={() => navigateToSearch(query)}
                className="w-full flex items-center gap-2 px-2 py-2 mt-1 rounded-md text-sm text-primary hover:bg-muted/50 transition-colors font-medium"
              >
                <ArrowRight className="h-4 w-4" />
                View all results for "{query}"
              </button>
            </div>
          )}

          {/* Loading state */}
          {query.length >= 2 && isLoading && suggestions.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">Searching...</div>
          )}

          {/* No results */}
          {query.length >= 2 && !isLoading && suggestions.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No products found for "{query}"
            </div>
          )}

          {/* Recent searches & trending (when query is empty or short) */}
          {query.length < 2 && (
            <div className="p-2">
              {recentSearches.length > 0 && (
                <div className="mb-2">
                  <div className="flex items-center justify-between px-2 py-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recent</p>
                    <button
                      onClick={clearAllRecentSearches}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Clear all
                    </button>
                  </div>
              {recentSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => {
                        setQuery(term);
                        navigateToSearch(term);
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-muted/50 transition-colors text-left group"
                    >
                      <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="truncate flex-1">{term}</span>
                      <span
                        role="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRecentSearch(term);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
                      >
                        <X className="h-3.5 w-3.5" />
                      </span>
                    </button>
                  ))}
                </div>
              )}
              <div>
                <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">Trending</p>
                {TRENDING_SEARCHES.map((term) => (
                  <button
                    key={term}
                    onClick={() => {
                      setQuery(term);
                      navigateToSearch(term);
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-muted/50 transition-colors text-left"
                  >
                    <TrendingUp className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{term}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
