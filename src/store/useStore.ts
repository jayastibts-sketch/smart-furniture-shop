import { create, StateCreator } from "zustand";
import { persist, PersistOptions } from "zustand/middleware";
import { Product } from "@/data/products";

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface WishlistItem {
  product: Product;
  addedAt: Date;
}

interface StoreState {
  // User ID for storage key
  currentUserId: string | null;
  setCurrentUserId: (userId: string | null) => void;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;

  // Wishlist
  wishlist: WishlistItem[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  moveToCart: (productId: string) => void;

  // Recently viewed
  recentlyViewed: Product[];
  addToRecentlyViewed: (product: Product) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Filters
  filters: {
    category: string[];
    priceRange: [number, number];
    material: string[];
    color: string[];
    brand: string[];
  };
  setFilters: (filters: Partial<StoreState["filters"]>) => void;
  clearFilters: () => void;

  // Sort
  sortBy: string;
  setSortBy: (sort: string) => void;

  // View mode
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
}

// Create a map to store user-specific data
const getUserStorageKey = (userId: string | null) => {
  return userId ? `furniture-store-${userId}` : "furniture-store-guest";
};

// Load user-specific data from localStorage
const loadUserData = (userId: string | null) => {
  const key = getUserStorageKey(userId);
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        cart: parsed.state?.cart || [],
        wishlist: parsed.state?.wishlist || [],
        recentlyViewed: parsed.state?.recentlyViewed || [],
      };
    }
  } catch (e) {
    console.error("Error loading user data:", e);
  }
  return { cart: [], wishlist: [], recentlyViewed: [] };
};

// Save user-specific data to localStorage
const saveUserData = (userId: string | null, data: { cart: CartItem[]; wishlist: WishlistItem[]; recentlyViewed: Product[] }) => {
  const key = getUserStorageKey(userId);
  try {
    localStorage.setItem(key, JSON.stringify({ state: data, version: 0 }));
  } catch (e) {
    console.error("Error saving user data:", e);
  }
};

export const useStore = create<StoreState>()(
  (set, get) => ({
    // User ID
    currentUserId: null,
    setCurrentUserId: (userId) => {
      const previousUserId = get().currentUserId;
      
      // Save current user's data before switching
      if (previousUserId !== userId) {
        const currentData = {
          cart: get().cart,
          wishlist: get().wishlist,
          recentlyViewed: get().recentlyViewed,
        };
        saveUserData(previousUserId, currentData);
        
        // Load new user's data
        const newUserData = loadUserData(userId);
        set({
          currentUserId: userId,
          cart: newUserData.cart,
          wishlist: newUserData.wishlist,
          recentlyViewed: newUserData.recentlyViewed,
        });
      }
    },

    // Cart
    cart: [],
    addToCart: (product, quantity = 1) => {
      const { cart, currentUserId } = get();
      const existingItem = cart.find((item) => item.product.id === product.id);
      
      let newCart;
      if (existingItem) {
        newCart = cart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        newCart = [...cart, { product, quantity }];
      }
      
      set({ cart: newCart });
      saveUserData(currentUserId, { cart: newCart, wishlist: get().wishlist, recentlyViewed: get().recentlyViewed });
    },
    removeFromCart: (productId) => {
      const newCart = get().cart.filter((item) => item.product.id !== productId);
      set({ cart: newCart });
      saveUserData(get().currentUserId, { cart: newCart, wishlist: get().wishlist, recentlyViewed: get().recentlyViewed });
    },
    updateQuantity: (productId, quantity) => {
      if (quantity <= 0) {
        get().removeFromCart(productId);
        return;
      }
      const newCart = get().cart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      );
      set({ cart: newCart });
      saveUserData(get().currentUserId, { cart: newCart, wishlist: get().wishlist, recentlyViewed: get().recentlyViewed });
    },
    clearCart: () => {
      set({ cart: [] });
      saveUserData(get().currentUserId, { cart: [], wishlist: get().wishlist, recentlyViewed: get().recentlyViewed });
    },
    getCartTotal: () => {
      return get().cart.reduce(
        (total, item) => total + item.product.price * item.quantity,
        0
      );
    },
    getCartCount: () => {
      return get().cart.reduce((count, item) => count + item.quantity, 0);
    },

    // Wishlist
    wishlist: [],
    addToWishlist: (product) => {
      const { wishlist, currentUserId } = get();
      if (!wishlist.find((item) => item.product.id === product.id)) {
        const newWishlist = [...wishlist, { product, addedAt: new Date() }];
        set({ wishlist: newWishlist });
        saveUserData(currentUserId, { cart: get().cart, wishlist: newWishlist, recentlyViewed: get().recentlyViewed });
      }
    },
    removeFromWishlist: (productId) => {
      const newWishlist = get().wishlist.filter((item) => item.product.id !== productId);
      set({ wishlist: newWishlist });
      saveUserData(get().currentUserId, { cart: get().cart, wishlist: newWishlist, recentlyViewed: get().recentlyViewed });
    },
    isInWishlist: (productId) => {
      return get().wishlist.some((item) => item.product.id === productId);
    },
    moveToCart: (productId) => {
      const item = get().wishlist.find((i) => i.product.id === productId);
      if (item) {
        get().addToCart(item.product);
        get().removeFromWishlist(productId);
      }
    },

    // Recently viewed
    recentlyViewed: [],
    addToRecentlyViewed: (product) => {
      const { recentlyViewed, currentUserId } = get();
      const filtered = recentlyViewed.filter((p) => p.id !== product.id);
      const newRecentlyViewed = [product, ...filtered].slice(0, 10);
      set({ recentlyViewed: newRecentlyViewed });
      saveUserData(currentUserId, { cart: get().cart, wishlist: get().wishlist, recentlyViewed: newRecentlyViewed });
    },

    // Search
    searchQuery: "",
    setSearchQuery: (query) => set({ searchQuery: query }),

    // Filters
    filters: {
      category: [],
      priceRange: [0, 5000],
      material: [],
      color: [],
      brand: [],
    },
    setFilters: (newFilters) => {
      set({ filters: { ...get().filters, ...newFilters } });
    },
    clearFilters: () => {
      set({
        filters: {
          category: [],
          priceRange: [0, 5000],
          material: [],
          color: [],
          brand: [],
        },
      });
    },

    // Sort
    sortBy: "popularity",
    setSortBy: (sort) => set({ sortBy: sort }),

    // View mode
    viewMode: "grid",
    setViewMode: (mode) => set({ viewMode: mode }),
  })
);

// Initialize with guest data on load
const initializeStore = () => {
  const guestData = loadUserData(null);
  useStore.setState({
    cart: guestData.cart,
    wishlist: guestData.wishlist,
    recentlyViewed: guestData.recentlyViewed,
  });
};

// Run initialization
initializeStore();
