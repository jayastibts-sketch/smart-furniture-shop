import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "en" | "ta" | "hi";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Nav
    "nav.home": "Home",
    "nav.shop": "Shop",
    "nav.categories": "Categories",
    "nav.quiz": "Quiz",
    "nav.about": "About",
    "nav.contact": "Contact",
    // Hero
    "hero.tagline": "Premium Wooden Furniture",
    "hero.title1": "Handcrafted",
    "hero.title2": "Wooden Furniture",
    "hero.description": "Discover timeless wooden furniture crafted with passion. Premium teak, rosewood & sheesham creations for your home.",
    "hero.shop": "Shop Collection",
    "hero.learn": "Learn More",
    "hero.stat1": "Wood Products",
    "hero.stat2": "Happy Customers",
    "hero.stat3": "Years Experience",
    // Promo banner
    "promo.banner": "Free delivery on all orders | Premium handcrafted wooden furniture",
    // Account
    "account.title": "My Account",
    "account.signin": "Sign In",
    "account.create": "Create Account",
    "account.signout": "Sign Out",
    "account.profile": "Profile Settings",
    "account.orders": "Order History",
    "account.admin": "Admin Dashboard",
    "account.moderator": "Moderator Dashboard",
    // Search
    "search.placeholder": "Search furniture...",
    "cart.empty": "Your cart is empty",
    // Footer
    "footer.rights": "All rights reserved",
    "footer.newsletter.title": "Join Our Newsletter",
    "footer.newsletter.desc": "Subscribe for exclusive offers, design inspiration, and new arrivals.",
    "footer.newsletter.placeholder": "Enter your email",
    "footer.newsletter.button": "Subscribe",
    "footer.brand.desc": "Premium handcrafted wooden furniture. Crafted with care, designed for generations.",
    "footer.shop": "Shop",
    "footer.shop.living": "Living Room",
    "footer.shop.bedroom": "Bedroom",
    "footer.shop.dining": "Dining Room",
    "footer.shop.office": "Home Office",
    "footer.shop.new": "New Arrivals",
    "footer.shop.sale": "Sale",
    "footer.customer": "Customer Service",
    "footer.customer.account": "My Account",
    "footer.customer.tracking": "Order Tracking",
    "footer.customer.wishlist": "Wishlist",
    "footer.customer.delivery": "Delivery Info",
    "footer.customer.returns": "Returns & Refunds",
    "footer.customer.faq": "FAQ",
    "footer.company": "Company",
    "footer.company.about": "About Us",
    "footer.company.careers": "Careers",
    "footer.company.press": "Press",
    "footer.company.sustainability": "Sustainability",
    "footer.company.contact": "Contact Us",
    "footer.privacy": "Privacy Policy",
    "footer.terms": "Terms of Service",
    // Features
    "features.shipping.title": "Free Shipping",
    "features.shipping.desc": "Free delivery on all orders",
    "features.payment.title": "Secure Payment",
    "features.payment.desc": "100% secure payment processing",
    "features.returns.title": "Easy Returns",
    "features.returns.desc": "30-day hassle-free returns",
    "features.support.title": "24/7 Support",
    "features.support.desc": "Dedicated customer support",
    // Categories section
    "categories.title": "Shop by Room",
    "categories.desc": "Find the perfect pieces for every room in your home",
    "categories.products": "products",
    "categories.explore": "Explore",
    // Featured products
    "featured.title": "Featured Collection",
    "featured.subtitle": "Handpicked pieces for your home",
    "featured.viewAll": "View All",
    // Testimonials
    "testimonials.title": "What Our Customers Say",
    "testimonials.desc": "Join thousands of satisfied customers who have transformed their homes",
    // Promo section
    "promo.limited": "Limited Time Offer",
    "promo.discount": "Up to 40% Off",
    "promo.living": "Living Room",
    "promo.shopNow": "Shop Now",
    "promo.newArrivals": "New Arrivals",
    "promo.collection": "2025 Collection",
    "promo.available": "Now Available",
    "promo.discover": "Discover",
    // Products page
    "products.title": "Shop Furniture",
    "products.breadcrumb.home": "Home",
    "products.breadcrumb.shop": "Shop",
    "products.filters": "Filters",
    "products.categories": "Categories",
    "products.priceRange": "Price Range",
    "products.material": "Material",
    "products.color": "Color",
    "products.brand": "Brand",
    "products.clearAll": "Clear All Filters",
    "products.showing": "Showing",
    "products.productsLabel": "products",
    "products.loading": "Loading...",
    "products.sort.popularity": "Popularity",
    "products.sort.newest": "Newest",
    "products.sort.priceLow": "Price: Low to High",
    "products.sort.priceHigh": "Price: High to Low",
    "products.sort.rating": "Top Rated",
    "products.activeFilters": "Active filters:",
    "products.clearAllLink": "Clear all",
    "products.noProducts": "No products found",
    "products.noProductsDesc": "Try adjusting your filters or search query",
  },
  ta: {
    // Nav
    "nav.home": "முகப்பு",
    "nav.shop": "கடை",
    "nav.categories": "வகைகள்",
    "nav.quiz": "வினாடி வினா",
    "nav.about": "எங்களைப் பற்றி",
    "nav.contact": "தொடர்பு",
    // Hero
    "hero.tagline": "உயர்தர மர மரச்சாமான்கள்",
    "hero.title1": "கைவினை",
    "hero.title2": "மர மரச்சாமான்கள்",
    "hero.description": "ஆர்வத்துடன் வடிவமைக்கப்பட்ட காலத்தை வென்ற மர மரச்சாமான்களைக் கண்டறியுங்கள்.",
    "hero.shop": "தொகுப்பைப் பாருங்கள்",
    "hero.learn": "மேலும் அறிக",
    "hero.stat1": "மர பொருட்கள்",
    "hero.stat2": "மகிழ்ச்சியான வாடிக்கையாளர்கள்",
    "hero.stat3": "ஆண்டுகள் அனுபவம்",
    // Promo banner
    "promo.banner": "அனைத்து ஆர்டர்களுக்கும் இலவச டெலிவரி | உயர்தர கைவினை மர மரச்சாமான்கள்",
    // Account
    "account.title": "என் கணக்கு",
    "account.signin": "உள்நுழைக",
    "account.create": "கணக்கு உருவாக்கு",
    "account.signout": "வெளியேறு",
    "account.profile": "சுயவிவர அமைப்புகள்",
    "account.orders": "ஆர்டர் வரலாறு",
    "account.admin": "நிர்வாக டாஷ்போர்டு",
    "account.moderator": "மதிப்பாய்வாளர் டாஷ்போர்டு",
    // Search
    "search.placeholder": "மரச்சாமான்களைத் தேடு...",
    "cart.empty": "உங்கள் வண்டி காலியாக உள்ளது",
    // Footer
    "footer.rights": "அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை",
    "footer.newsletter.title": "எங்கள் செய்திமடலில் சேருங்கள்",
    "footer.newsletter.desc": "பிரத்யேக சலுகைகள், வடிவமைப்பு உத்வேகம் மற்றும் புதிய வரவுகளுக்கு குழுசேரவும்.",
    "footer.newsletter.placeholder": "உங்கள் மின்னஞ்சலை உள்ளிடுங்கள்",
    "footer.newsletter.button": "குழுசேர்",
    "footer.brand.desc": "உயர்தர கைவினை மர மரச்சாமான்கள். அக்கறையுடன் வடிவமைக்கப்பட்டது.",
    "footer.shop": "கடை",
    "footer.shop.living": "அறை",
    "footer.shop.bedroom": "படுக்கையறை",
    "footer.shop.dining": "சாப்பாட்டு அறை",
    "footer.shop.office": "அலுவலகம்",
    "footer.shop.new": "புதிய வரவுகள்",
    "footer.shop.sale": "விற்பனை",
    "footer.customer": "வாடிக்கையாளர் சேவை",
    "footer.customer.account": "என் கணக்கு",
    "footer.customer.tracking": "ஆர்டர் கண்காணிப்பு",
    "footer.customer.wishlist": "விருப்பப்பட்டியல்",
    "footer.customer.delivery": "டெலிவரி தகவல்",
    "footer.customer.returns": "திரும்ப & பணம் திரும்ப",
    "footer.customer.faq": "அடிக்கடி கேட்கப்படும் கேள்விகள்",
    "footer.company": "நிறுவனம்",
    "footer.company.about": "எங்களைப் பற்றி",
    "footer.company.careers": "வேலைவாய்ப்புகள்",
    "footer.company.press": "செய்தி",
    "footer.company.sustainability": "நிலைத்தன்மை",
    "footer.company.contact": "எங்களை தொடர்புகொள்ளுங்கள்",
    "footer.privacy": "தனியுரிமைக் கொள்கை",
    "footer.terms": "சேவை விதிமுறைகள்",
    // Features
    "features.shipping.title": "இலவச ஷிப்பிங்",
    "features.shipping.desc": "$999 க்கு மேல் இலவச டெலிவரி",
    "features.payment.title": "பாதுகாப்பான பணம்",
    "features.payment.desc": "100% பாதுகாப்பான பணம் செலுத்துதல்",
    "features.returns.title": "எளிதான திரும்பல்",
    "features.returns.desc": "30 நாள் எளிதான திரும்பல்",
    "features.support.title": "24/7 ஆதரவு",
    "features.support.desc": "அர்ப்பணிப்பு வாடிக்கையாளர் ஆதரவு",
    // Categories section
    "categories.title": "அறை வாரியாக வாங்குங்கள்",
    "categories.desc": "உங்கள் வீட்டின் ஒவ்வொரு அறைக்கும் சரியான பொருட்களைக் கண்டறியுங்கள்",
    "categories.products": "பொருட்கள்",
    "categories.explore": "ஆராயுங்கள்",
    // Featured
    "featured.title": "சிறப்புத் தொகுப்பு",
    "featured.subtitle": "உங்கள் வீட்டிற்கு தேர்ந்தெடுக்கப்பட்ட பொருட்கள்",
    "featured.viewAll": "அனைத்தையும் காண்க",
    // Testimonials
    "testimonials.title": "எங்கள் வாடிக்கையாளர்கள் என்ன சொல்கிறார்கள்",
    "testimonials.desc": "தங்கள் வீடுகளை மாற்றிய ஆயிரக்கணக்கான திருப்தியான வாடிக்கையாளர்களுடன் சேருங்கள்",
    // Promo
    "promo.limited": "குறிப்பிட்ட நேர சலுகை",
    "promo.discount": "40% வரை தள்ளுபடி",
    "promo.living": "அறை",
    "promo.shopNow": "இப்போது வாங்குங்கள்",
    "promo.newArrivals": "புதிய வரவுகள்",
    "promo.collection": "2025 தொகுப்பு",
    "promo.available": "இப்போது கிடைக்கிறது",
    "promo.discover": "கண்டுபிடி",
    // Products page
    "products.title": "மரச்சாமான்கள் வாங்குங்கள்",
    "products.breadcrumb.home": "முகப்பு",
    "products.breadcrumb.shop": "கடை",
    "products.filters": "வடிகட்டிகள்",
    "products.categories": "வகைகள்",
    "products.priceRange": "விலை வரம்பு",
    "products.material": "பொருள்",
    "products.color": "நிறம்",
    "products.brand": "பிராண்ட்",
    "products.clearAll": "அனைத்து வடிகட்டிகளையும் அழிக்கவும்",
    "products.showing": "காட்டுகிறது",
    "products.productsLabel": "பொருட்கள்",
    "products.loading": "ஏற்றுகிறது...",
    "products.sort.popularity": "புகழ்",
    "products.sort.newest": "புதியது",
    "products.sort.priceLow": "விலை: குறைவு முதல் அதிகம்",
    "products.sort.priceHigh": "விலை: அதிகம் முதல் குறைவு",
    "products.sort.rating": "சிறந்த மதிப்பீடு",
    "products.activeFilters": "செயலில் உள்ள வடிகட்டிகள்:",
    "products.clearAllLink": "அனைத்தையும் அழி",
    "products.noProducts": "பொருட்கள் எதுவும் கிடைக்கவில்லை",
    "products.noProductsDesc": "உங்கள் வடிகட்டிகள் அல்லது தேடல் வினவலை சரிசெய்யவும்",
  },
  hi: {
    // Nav
    "nav.home": "होम",
    "nav.shop": "दुकान",
    "nav.categories": "श्रेणियाँ",
    "nav.quiz": "क्विज़",
    "nav.about": "हमारे बारे में",
    "nav.contact": "संपर्क",
    // Hero
    "hero.tagline": "प्रीमियम लकड़ी का फर्नीचर",
    "hero.title1": "हस्तनिर्मित",
    "hero.title2": "लकड़ी का फर्नीचर",
    "hero.description": "जुनून से बने कालातीत लकड़ी के फर्नीचर की खोज करें। प्रीमियम सागौन, शीशम और गुलाब की लकड़ी।",
    "hero.shop": "कलेक्शन देखें",
    "hero.learn": "और जानें",
    "hero.stat1": "लकड़ी के उत्पाद",
    "hero.stat2": "खुश ग्राहक",
    "hero.stat3": "वर्षों का अनुभव",
    // Promo banner
    "promo.banner": "सभी ऑर्डर पर मुफ्त डिलीवरी | प्रीमियम हस्तनिर्मित लकड़ी का फर्नीचर",
    // Account
    "account.title": "मेरा खाता",
    "account.signin": "साइन इन",
    "account.create": "खाता बनाएं",
    "account.signout": "साइन आउट",
    "account.profile": "प्रोफ़ाइल सेटिंग्स",
    "account.orders": "ऑर्डर इतिहास",
    "account.admin": "एडमिन डैशबोर्ड",
    "account.moderator": "मॉडरेटर डैशबोर्ड",
    // Search
    "search.placeholder": "फर्नीचर खोजें...",
    "cart.empty": "आपकी कार्ट खाली है",
    // Footer
    "footer.rights": "सर्वाधिकार सुरक्षित",
    "footer.newsletter.title": "हमारे न्यूज़लेटर से जुड़ें",
    "footer.newsletter.desc": "विशेष ऑफ़र, डिज़ाइन प्रेरणा और नए उत्पादों के लिए सदस्यता लें।",
    "footer.newsletter.placeholder": "अपना ईमेल दर्ज करें",
    "footer.newsletter.button": "सदस्यता लें",
    "footer.brand.desc": "प्रीमियम हस्तनिर्मित लकड़ी का फर्नीचर। देखभाल के साथ बनाया गया।",
    "footer.shop": "दुकान",
    "footer.shop.living": "लिविंग रूम",
    "footer.shop.bedroom": "बेडरूम",
    "footer.shop.dining": "डाइनिंग रूम",
    "footer.shop.office": "होम ऑफिस",
    "footer.shop.new": "नए उत्पाद",
    "footer.shop.sale": "सेल",
    "footer.customer": "ग्राहक सेवा",
    "footer.customer.account": "मेरा खाता",
    "footer.customer.tracking": "ऑर्डर ट्रैकिंग",
    "footer.customer.wishlist": "विशलिस्ट",
    "footer.customer.delivery": "डिलीवरी जानकारी",
    "footer.customer.returns": "रिटर्न और रिफंड",
    "footer.customer.faq": "अक्सर पूछे जाने वाले प्रश्न",
    "footer.company": "कंपनी",
    "footer.company.about": "हमारे बारे में",
    "footer.company.careers": "करियर",
    "footer.company.press": "प्रेस",
    "footer.company.sustainability": "स्थिरता",
    "footer.company.contact": "संपर्क करें",
    "footer.privacy": "गोपनीयता नीति",
    "footer.terms": "सेवा की शर्तें",
    // Features
    "features.shipping.title": "मुफ्त शिपिंग",
    "features.shipping.desc": "$999 से अधिक पर मुफ्त डिलीवरी",
    "features.payment.title": "सुरक्षित भुगतान",
    "features.payment.desc": "100% सुरक्षित भुगतान प्रक्रिया",
    "features.returns.title": "आसान रिटर्न",
    "features.returns.desc": "30 दिन की आसान रिटर्न",
    "features.support.title": "24/7 सहायता",
    "features.support.desc": "समर्पित ग्राहक सहायता",
    // Categories section
    "categories.title": "कमरे के अनुसार खरीदें",
    "categories.desc": "अपने घर के हर कमरे के लिए सही फर्नीचर खोजें",
    "categories.products": "उत्पाद",
    "categories.explore": "देखें",
    // Featured
    "featured.title": "विशेष संग्रह",
    "featured.subtitle": "आपके घर के लिए चुने हुए फर्नीचर",
    "featured.viewAll": "सभी देखें",
    // Testimonials
    "testimonials.title": "हमारे ग्राहक क्या कहते हैं",
    "testimonials.desc": "हज़ारों संतुष्ट ग्राहकों से जुड़ें जिन्होंने अपने घर को बदला है",
    // Promo
    "promo.limited": "सीमित समय का ऑफ़र",
    "promo.discount": "40% तक की छूट",
    "promo.living": "लिविंग रूम",
    "promo.shopNow": "अभी खरीदें",
    "promo.newArrivals": "नए उत्पाद",
    "promo.collection": "2025 संग्रह",
    "promo.available": "अब उपलब्ध",
    "promo.discover": "खोजें",
    // Products page
    "products.title": "फर्नीचर खरीदें",
    "products.breadcrumb.home": "होम",
    "products.breadcrumb.shop": "दुकान",
    "products.filters": "फ़िल्टर",
    "products.categories": "श्रेणियाँ",
    "products.priceRange": "मूल्य सीमा",
    "products.material": "सामग्री",
    "products.color": "रंग",
    "products.brand": "ब्रांड",
    "products.clearAll": "सभी फ़िल्टर साफ़ करें",
    "products.showing": "दिखा रहे हैं",
    "products.productsLabel": "उत्पाद",
    "products.loading": "लोड हो रहा है...",
    "products.sort.popularity": "लोकप्रियता",
    "products.sort.newest": "नवीनतम",
    "products.sort.priceLow": "मूल्य: कम से अधिक",
    "products.sort.priceHigh": "मूल्य: अधिक से कम",
    "products.sort.rating": "शीर्ष रेटेड",
    "products.activeFilters": "सक्रिय फ़िल्टर:",
    "products.clearAllLink": "सभी साफ़ करें",
    "products.noProducts": "कोई उत्पाद नहीं मिला",
    "products.noProductsDesc": "अपने फ़िल्टर या खोज को समायोजित करें",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("app-language");
    return (saved as Language) || "en";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("app-language", lang);
  };

  const t = (key: string) => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}

export const languageLabels: Record<Language, string> = {
  en: "English",
  ta: "தமிழ்",
  hi: "हिन्दी",
};
