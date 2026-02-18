// Product images
import sofaCream from "@/assets/products/sofa-cream.jpg";
import diningTable from "@/assets/products/dining-table.jpg";
import platformBed from "@/assets/products/platform-bed.jpg";
import armchairTerracotta from "@/assets/products/armchair-terracotta.jpg";
import coffeeTable from "@/assets/products/coffee-table.jpg";
import bookshelf from "@/assets/products/bookshelf.jpg";
import nightstand from "@/assets/products/nightstand.jpg";
import officeChair from "@/assets/products/office-chair.jpg";

// Category images
import categoryBedroom from "@/assets/category-bedroom.jpg";
import categoryDining from "@/assets/category-dining.jpg";
import categoryOffice from "@/assets/category-office.jpg";
import categoryLiving from "@/assets/category-living.jpg";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  images: string[];
  category: string;
  material: string;
  color: string;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  weight: number;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  stockCount: number;
  badge?: "sale" | "new" | "bestseller" | "limited";
  brand: string;
  features: string[];
}

// Category-based shipping days
export const categoryShippingDays: Record<string, number> = {
  living: 8,
  bedroom: 10,
  dining: 12,
  office: 7,
};

export interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
  productCount: number;
}

export interface Review {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  verified: boolean;
  helpful: number;
}

export const categories: Category[] = [
  {
    id: "living",
    name: "Living Room",
    description: "Wooden sofas, chairs, coffee tables & more",
    image: categoryLiving,
    productCount: 3,
  },
  {
    id: "bedroom",
    name: "Bedroom",
    description: "Wooden beds, cots, nightstands & wardrobes",
    image: categoryBedroom,
    productCount: 2,
  },
  {
    id: "dining",
    name: "Dining Room",
    description: "Wooden dining tables & chairs",
    image: categoryDining,
    productCount: 1,
  },
  {
    id: "office",
    name: "Home Office",
    description: "Wooden desks, bookshelves & storage",
    image: categoryOffice,
    productCount: 2,
  },
];

export const products: Product[] = [
  {
    id: "1",
    name: "Teak Wood Sofa Set",
    description: "Premium 3+1+1 teak wood sofa set with cushioned seats. Handcrafted from solid teak with a natural polish finish.",
    price: 45000,
    originalPrice: 52000,
    image: sofaCream,
    images: [sofaCream, sofaCream, sofaCream],
    category: "living",
    material: "Teak Wood",
    color: "Natural Teak",
    dimensions: { width: 200, height: 85, depth: 80 },
    weight: 95,
    rating: 0,
    reviewCount: 0,
    inStock: true,
    stockCount: 8,
    badge: "bestseller",
    brand: "Guna Woodcraft",
    features: [
      "Solid teak wood construction",
      "Handcrafted by artisans",
      "Includes cushions",
      "Natural polish finish",
    ],
  },
  {
    id: "2",
    name: "Rosewood Dining Table Set",
    description: "Elegant 6-seater dining table with matching chairs. Crafted from premium rosewood with intricate carvings.",
    price: 65000,
    image: diningTable,
    images: [diningTable, diningTable, diningTable],
    category: "dining",
    material: "Rosewood",
    color: "Dark Rosewood",
    dimensions: { width: 180, height: 76, depth: 90 },
    weight: 85,
    rating: 0,
    reviewCount: 0,
    inStock: true,
    stockCount: 4,
    badge: "new",
    brand: "Guna Woodcraft",
    features: [
      "Solid rosewood construction",
      "Hand-carved details",
      "Seats 6 comfortably",
      "Includes 6 matching chairs",
    ],
  },
  {
    id: "3",
    name: "Sheesham Wood King Cot",
    description: "Sturdy king-size cot with carved headboard. Made from premium sheesham wood with a glossy finish.",
    price: 38000,
    originalPrice: 45000,
    image: platformBed,
    images: [platformBed, platformBed, platformBed],
    category: "bedroom",
    material: "Sheesham Wood",
    color: "Honey Brown",
    dimensions: { width: 180, height: 100, depth: 210 },
    weight: 75,
    rating: 0,
    reviewCount: 0,
    inStock: true,
    stockCount: 6,
    badge: "sale",
    brand: "Guna Woodcraft",
    features: [
      "Carved headboard design",
      "Strong load capacity",
      "Sheesham wood durability",
      "Easy assembly",
    ],
  },
  {
    id: "4",
    name: "Teak Wood Easy Chair",
    description: "Classic wooden easy chair with armrests. Perfect for relaxation with ergonomic design.",
    price: 12000,
    image: armchairTerracotta,
    images: [armchairTerracotta, armchairTerracotta, armchairTerracotta],
    category: "living",
    material: "Teak Wood",
    color: "Natural Teak",
    dimensions: { width: 65, height: 90, depth: 70 },
    weight: 18,
    rating: 0,
    reviewCount: 0,
    inStock: true,
    stockCount: 15,
    brand: "Guna Woodcraft",
    features: [
      "Solid teak construction",
      "Comfortable armrests",
      "Ergonomic backrest",
      "Natural wood grain",
    ],
  },
  {
    id: "5",
    name: "Mango Wood Coffee Table",
    description: "Modern round coffee table with tapered legs. Solid mango wood with a smooth lacquer finish.",
    price: 8500,
    originalPrice: 10000,
    image: coffeeTable,
    images: [coffeeTable, coffeeTable, coffeeTable],
    category: "living",
    material: "Mango Wood",
    color: "Light Brown",
    dimensions: { width: 90, height: 42, depth: 90 },
    weight: 15,
    rating: 0,
    reviewCount: 0,
    inStock: true,
    stockCount: 20,
    badge: "sale",
    brand: "Guna Woodcraft",
    features: [
      "Solid mango wood top",
      "Tapered wooden legs",
      "Water-resistant finish",
      "Lightweight design",
    ],
  },
  {
    id: "6",
    name: "Teak Bookshelf Unit",
    description: "Tall bookshelf with 5 shelves and cabinet storage. Handcrafted from teak wood for durability.",
    price: 22000,
    image: bookshelf,
    images: [bookshelf, bookshelf, bookshelf],
    category: "office",
    material: "Teak Wood",
    color: "Natural Teak",
    dimensions: { width: 100, height: 180, depth: 35 },
    weight: 45,
    rating: 0,
    reviewCount: 0,
    inStock: true,
    stockCount: 7,
    badge: "bestseller",
    brand: "Guna Woodcraft",
    features: [
      "5 open shelves",
      "Bottom cabinet storage",
      "Wall-mounting option",
      "Strong load capacity",
    ],
  },
  {
    id: "7",
    name: "Rosewood Bedside Table",
    description: "Elegant nightstand with drawer and open shelf. Handcrafted from rosewood with brass handles.",
    price: 7500,
    image: nightstand,
    images: [nightstand, nightstand, nightstand],
    category: "bedroom",
    material: "Rosewood",
    color: "Dark Rosewood",
    dimensions: { width: 45, height: 55, depth: 38 },
    weight: 12,
    rating: 0,
    reviewCount: 0,
    inStock: true,
    stockCount: 18,
    badge: "new",
    brand: "Guna Woodcraft",
    features: [
      "Solid rosewood",
      "Brass drawer handles",
      "Smooth drawer slides",
      "Open shelf storage",
    ],
  },
  {
    id: "8",
    name: "Sheesham Wood Study Table",
    description: "Spacious study table with drawers and keyboard tray. Perfect for home office setup.",
    price: 18000,
    image: officeChair,
    images: [officeChair, officeChair, officeChair],
    category: "office",
    material: "Sheesham Wood",
    color: "Walnut Brown",
    dimensions: { width: 120, height: 76, depth: 60 },
    weight: 35,
    rating: 0,
    reviewCount: 0,
    inStock: true,
    stockCount: 10,
    badge: "bestseller",
    brand: "Guna Woodcraft",
    features: [
      "3 storage drawers",
      "Keyboard tray",
      "Cable management hole",
      "Sturdy construction",
    ],
  },
];

export const reviews: Review[] = [
  {
    id: "r1",
    productId: "1",
    userName: "Sarah M.",
    rating: 5,
    title: "Absolutely gorgeous sofa!",
    comment: "This sofa exceeded all my expectations. The fabric is so soft and the color is exactly as shown. Assembly was easy and it looks stunning in my living room.",
    date: "2025-12-15",
    verified: true,
    helpful: 24,
  },
  {
    id: "r2",
    productId: "1",
    userName: "Michael R.",
    rating: 4,
    title: "Great quality, minor issue",
    comment: "Beautiful sofa with excellent build quality. Only giving 4 stars because delivery took longer than expected. Otherwise, perfect!",
    date: "2025-12-10",
    verified: true,
    helpful: 12,
  },
  {
    id: "r3",
    productId: "1",
    userName: "Emily K.",
    rating: 5,
    title: "Best furniture purchase ever",
    comment: "I've been looking for the perfect sectional for months. This one is it! Comfortable, stylish, and well-made. Worth every penny.",
    date: "2025-12-01",
    verified: true,
    helpful: 31,
  },
];

export const brands = ["Guna Woodcraft"];
export const materials = ["Teak Wood", "Rosewood", "Sheesham Wood", "Mango Wood", "Oak Wood", "Walnut Wood"];
export const colors = ["Natural Teak", "Dark Rosewood", "Honey Brown", "Light Brown", "Walnut Brown"];
