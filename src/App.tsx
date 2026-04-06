import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";

const EVOPIXEL_IMAGE = "/images/EvoPixel.png";

import {
  ShoppingCart,
  User,
  Package,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Home,
  MessageSquare,
  Play,
  ChevronRight,
  X,
  Plus,
  Minus,
  Trash2,
  LogOut,
  ThumbsUp,
  Music2,
  Coins,
  Crown,
  Trophy,
  Users,
  Eye,
  EyeOff,
  Settings,
  Edit,
  Save,
  Check,
  Image,
  Tag,
  Ticket,
  LayoutDashboard,
  Upload,
  Camera,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Cropper from "react-easy-crop";

const CropperComponent = Cropper as unknown as React.ComponentType<any>;

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  perks?: string[];
  commands?: string[];
  image?: string;
  sort_order?: number;
}

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [coupons, setCoupons] = useState<any[]>([]);
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>(
    [],
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [userRole, setUserRole] = useState("user");
  const [isAdminView, setIsAdminView] = useState(
    window.location.pathname === "/admin",
  );
  const [isRegistering, setIsRegistering] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isBedrock, setIsBedrock] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Skyblock Ranks");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInfoModal, setShowInfoModal] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [toasts, setToasts] = useState<
    { id: number; message: string; type: "success" | "error" }[]
  >([]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [isHome, setIsHome] = useState(true);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [labelSettingsCategory, setLabelSettingsCategory] = useState<
    "__global" | string
  >("__global");
  const [activeRecentPayment, setActiveRecentPayment] = useState<number | null>(
    null,
  );
  const recentPaymentsRef = useRef<HTMLDivElement>(null);

  const apiBaseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "";

  const sortedCategories = useMemo(() => {
    const order = ["Skyblock Ranks", "Survival Ranks", "Coins"].map((n) =>
      n.toLowerCase(),
    );

    return [...categories].sort((a, b) => {
      const aIndex = order.indexOf(a.name.toLowerCase());
      const bIndex = order.indexOf(b.name.toLowerCase());

      if (aIndex !== -1 || bIndex !== -1) {
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      }

      return a.name.localeCompare(b.name);
    });
  }, [categories]);

  const getLabelValue = useCallback(
    (
      key: "label_perks" | "label_commands" | "label_description",
      categoryName?: string,
    ) => {
      if (!categoryName) return settings[key] || "";

      const category = categories.find((c) => c.name === categoryName);
      const categoryKey = category ? `${key}__${category.id}` : undefined;

      if (categoryKey) {
        const value = settings[categoryKey];
        if (value !== undefined) return value;
      }

      return settings[key] || "";
    },
    [categories, settings],
  );

  useEffect(() => {
    // Keep body scroll locked while any modal/overlay is open
    const overlayOpen =
      showLoginModal ||
      Boolean(showInfoModal) ||
      isCartOpen ||
      showTermsModal ||
      showPrivacyModal ||
      showLogoutConfirm ||
      showCheckoutConfirm;

    document.body.style.overflow = overlayOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [
    showLoginModal,
    showInfoModal,
    isCartOpen,
    showTermsModal,
    showPrivacyModal,
    showLogoutConfirm,
    showCheckoutConfirm,
  ]);

  useEffect(() => {
    if (
      categories.length > 0 &&
      !categories.some((c) => c.name === selectedCategory)
    ) {
      setSelectedCategory(sortedCategories[0]?.name || "Skyblock Ranks");
    }
  }, [categories, selectedCategory, sortedCategories]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        recentPaymentsRef.current &&
        !recentPaymentsRef.current.contains(event.target as Node)
      ) {
        setActiveRecentPayment(null);
      }
    };

    if (activeRecentPayment !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeRecentPayment]);

  const addToast = (message: string, type: "success" | "error" = "success") => {
    const id = Math.random() + Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  useEffect(() => {
    const apiUrl = apiBaseUrl;
    console.log("[App] API URL:", apiUrl || "(empty, using relative paths)");
    console.log("[App] Window origin:", window.location.origin);

    const fetchApi = (path: string) => fetch(`${apiUrl}${path}`);

    const fetchData = async () => {
      try {
        const [prodRes, catRes, settRes, coupRes] = await Promise.all([
          fetchApi("/api/products"),
          fetchApi("/api/categories"),
          fetchApi("/api/settings"),
          fetchApi("/api/coupons"),
        ]);

        if (!prodRes.ok || !catRes.ok || !settRes.ok || !coupRes.ok) {
          throw new Error("Failed to fetch store data");
        }

        const prodData = await prodRes.json();
        const catData = await catRes.json();
        const settData = await settRes.json();
        const coupData = await coupRes.json();

        setProducts(prodData);
        setCategories(catData);
        setSettings(settData);
        setCoupons(coupData);

        if (catData.length > 0) {
          setSelectedCategory(catData[0].name);
          setIsHome(false);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();

    let script: HTMLScriptElement | null = null;

    // Fetch Midtrans config and load script
    fetchApi("/api/midtrans-config")
      .then((res) => res.json())
      .then((config) => {
        if (!config.isConfigured) {
          addToast(
            "Midtrans is not configured. Please set your API keys in the settings.",
            "error",
          );
        }

        script = document.createElement("script");
        const isProd = config.isProduction;
        script.src = isProd
          ? "https://app.midtrans.com/snap/snap.js"
          : "https://app.sandbox.midtrans.com/snap/snap.js";
        script.setAttribute("data-client-key", config.clientKey);
        script.async = true;
        document.body.appendChild(script);
      })
      .catch((err) => console.error("Error fetching Midtrans config:", err));

    return () => {
      if (script) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Load session from localStorage
  useEffect(() => {
    const savedUsername = localStorage.getItem("mc_username");
    const savedIsBedrock = localStorage.getItem("mc_is_bedrock") === "true";
    const savedRole = localStorage.getItem("mc_user_role") || "user";
    if (savedUsername) {
      setUsername(savedUsername);
      setIsBedrock(savedIsBedrock);
      setUserRole(savedRole);
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (cart.length === 0) {
      setAppliedDiscount(0);
    }
  }, [cart]);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isResetting) {
        const response = await fetch("/api/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: username.trim(),
            newPassword: password.trim(),
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Reset password failed");
        }

        addToast("Password reset successfully! Please login.", "success");
        setIsResetting(false);
        setPassword("");
        return;
      }

      const endpoint = isRegistering ? "/api/register" : "/api/login";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Authentication failed");
      }

      if (isRegistering) {
        addToast("Registration successful! Please login.", "success");
        setIsRegistering(false);
        setPassword("");
      } else {
        let finalUsername = username.trim();
        if (isBedrock) {
          if (!finalUsername.startsWith(".")) {
            finalUsername = "." + finalUsername;
          }
        } else {
          if (finalUsername.startsWith(".")) {
            finalUsername = finalUsername.substring(1);
          }
        }

        setUsername(finalUsername);
        setIsLoggedIn(true);
        const role = data.role || "user";
        setUserRole(role);
        setShowLoginModal(false);
        addToast("Welcome back, " + finalUsername, "success");

        // Save session to localStorage
        localStorage.setItem("mc_username", finalUsername);
        localStorage.setItem("mc_is_bedrock", isBedrock.toString());
        localStorage.setItem("mc_user_role", role);
      }
    } catch (err: any) {
      setError(err.message);
      addToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername("");
    setUserRole("user");
    setIsAdminView(false);
    setCart([]);
    setIsCartOpen(false);
    setShowLogoutConfirm(false);
    addToast("Successfully logged out", "success");

    // Remove session from localStorage
    localStorage.removeItem("mc_username");
    localStorage.removeItem("mc_is_bedrock");
    localStorage.removeItem("mc_user_role");
  };

  const addToCart = (product: Product) => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    addToast(`${product.name} added to cart!`);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      }),
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const cartTotal = Math.max(
    0,
    cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0) -
      appliedDiscount,
  );
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    const coupon = coupons.find((c) => c.code === code && c.active);

    if (coupon) {
      if (cart.length === 0) {
        addToast("Add items to cart first", "error");
        return;
      }
      setAppliedDiscount(coupon.discount);
      addToast(
        `Coupon applied! Rp ${coupon.discount.toLocaleString()} discount.`,
        "success",
      );
    } else {
      setAppliedDiscount(0);
      addToast("Invalid or inactive coupon code", "error");
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    if (!isLoggedIn) {
      setShowLoginModal(true);
      addToast("Please login first to checkout", "error");
      return;
    }

    setShowCheckoutConfirm(true);
  };

  const confirmCheckout = async () => {
    setShowCheckoutConfirm(false);
    setLoading(true);
    try {
      // In a real app, we'd send the whole cart
      const item = cart[0];
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username,
          productId: item.product.id,
          couponCode:
            appliedDiscount > 0 ? couponCode.trim().toUpperCase() : "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Checkout failed");
      }

      if (data.token) {
        // @ts-ignore
        if (window.snap) {
          // @ts-ignore
          window.snap.pay(data.token, {
            onSuccess: (result: any) => {
              addToast("Payment successful!", "success");
              setCart([]);
              setIsCartOpen(false);
            },
            onPending: (result: any) => addToast("Payment pending.", "success"),
            onError: (result: any) => addToast("Payment failed.", "error"),
            onClose: () => setLoading(false),
          });
        } else {
          throw new Error(
            "Midtrans script not loaded yet. Please refresh or wait a moment.",
          );
        }
      }
    } catch (err: any) {
      console.error("Checkout Error:", err);
      addToast(err.message || "An error occurred during checkout", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(
    (p) => p.category === selectedCategory,
  );

  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans selection:bg-blue-500/30">
      {isAdminView && userRole === "admin" ? (
        <AdminPanel
          onClose={() => setIsAdminView(false)}
          products={products}
          categories={categories}
          settings={settings}
          coupons={coupons}
          addToast={addToast}
          onUpdate={async () => {
            const [pRes, cRes, sRes, cpRes] = await Promise.all([
              fetch("/api/products"),
              fetch("/api/categories"),
              fetch("/api/settings"),
              fetch("/api/coupons"),
            ]);
            const [pData, cData, sData, cpData] = await Promise.all([
              pRes.json(),
              cRes.json(),
              sRes.json(),
              cpRes.json(),
            ]);

            // If the currently selected category was renamed, update the selection
            if (selectedCategory) {
              const oldCat = categories.find(
                (c) => c.name === selectedCategory,
              );
              if (oldCat) {
                const newCat = cData.find((c: any) => c.id === oldCat.id);
                if (newCat && newCat.name !== selectedCategory) {
                  setSelectedCategory(newCat.name);
                }
              }
            }

            setProducts(pData);
            setCategories(cData);
            setSettings(sData);
            setCoupons(cpData);
          }}
        />
      ) : (
        <>
          {/* Top Banner */}
          {settings.show_coupon_banner === "true" && (
            <div className="bg-blue-600 py-3 text-center text-white font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-4">
              <span>
                {settings.coupon_banner_text ||
                  "Ramadan Sale 50% Discount! Use coupon code →"}
              </span>
              {coupons.find((c) => c.active) && (
                <div className="bg-[#1a1a1a] text-blue-400 px-4 py-1 rounded font-bold border border-white/10 cursor-default select-none">
                  {coupons.find((c) => c.active)?.code}
                </div>
              )}
            </div>
          )}

          {/* Hero Background */}
          <div className="relative h-[40vh] w-full overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url('${settings.hero_background || EVOPIXEL_IMAGE}')`,
              }}
            >
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]"></div>
            </div>

            {/* Header Navigation */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 sm:items-start">
              <motion.button
                onClick={() => setIsHome(true)}
                whileTap={{ scale: 0.95 }}
                className={`mc-button px-4 sm:px-6 py-2 sm:py-3 flex items-center gap-2 transition-all w-full sm:w-auto justify-center ${isHome ? "mc-button-blue" : ""}`}
              >
                <Home size={18} />
                <span className="font-bold uppercase tracking-widest text-xs sm:text-sm">
                  Home
                </span>
              </motion.button>

              <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-center">
                <motion.button
                  onClick={() => setIsCartOpen(true)}
                  whileTap={{ scale: 0.95 }}
                  className="mc-button mc-button-green px-4 sm:px-6 py-2 sm:py-3 flex items-center gap-2 transition-all font-bold uppercase tracking-widest text-xs sm:text-sm relative"
                >
                  <ShoppingCart size={18} />
                  <span className="hidden sm:inline">Cart</span>
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#121212] font-black">
                      {cartCount}
                    </span>
                  )}
                </motion.button>
                <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                  <motion.div
                    className="mc-button p-2 sm:p-4 flex items-center gap-3 sm:gap-4 cursor-pointer transition-all flex-1 sm:flex-none justify-center"
                    onClick={() => setShowLoginModal(true)}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="text-right">
                      <p className="text-[10px] sm:text-xs text-white/40 font-bold tracking-widest truncate max-w-[80px] sm:max-w-none">
                        {isLoggedIn ? username : "Guest"}
                      </p>
                      <p className="text-xs sm:text-sm font-bold uppercase whitespace-nowrap">
                        {isLoggedIn ? "Switch" : "Login"}
                      </p>
                    </div>
                    <div className="w-8 h-8 sm:w-12 sm:h-12 bg-[#333] rounded-none overflow-hidden border border-white/10 flex-shrink-0">
                      <img
                        src={`https://mc-heads.net/avatar/${username || "steve"}`}
                        alt="Avatar"
                        className="w-full h-full"
                      />
                    </div>
                  </motion.div>

                  {isLoggedIn && (
                    <div className="flex items-center gap-2 sm:gap-4">
                      {userRole === "admin" && (
                        <motion.button
                          onClick={() => setIsAdminView(true)}
                          whileTap={{ scale: 0.9 }}
                          className="mc-button mc-button-blue p-2 sm:p-4 flex items-center gap-2 transition-all"
                        >
                          <Settings size={20} />
                          <span className="hidden sm:inline font-bold uppercase tracking-widest text-xs">
                            Admin
                          </span>
                        </motion.button>
                      )}
                      <motion.button
                        onClick={() => setShowLogoutConfirm(true)}
                        whileTap={{ scale: 0.9 }}
                        className="mc-button mc-button-red p-2 sm:p-4 flex items-center justify-center transition-all group"
                        title="Logout"
                      >
                        <LogOut
                          size={20}
                          className="group-hover:scale-110 transition-transform"
                        />
                      </motion.button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-6 -mt-10 relative z-20 pb-20">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Sidebar */}
              <aside className="w-full lg:w-80 flex-shrink-0">
                <div className="bg-[#1a1a1a]/50 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden sticky top-24 shadow-2xl">
                  <div className="p-6 border-b border-white/5 bg-white/5">
                    <h4 className="text-blue-400 font-bold uppercase tracking-[0.2em] text-xs">
                      Shop Categories
                    </h4>
                  </div>
                  <div className="p-3 space-y-1">
                    {sortedCategories.map((cat) => (
                      <motion.button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(cat.name);
                          setIsHome(false);
                        }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200 group ${
                          !isHome && selectedCategory === cat.name
                            ? "bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/20"
                            : "text-white/60 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                              !isHome && selectedCategory === cat.name
                                ? "bg-black/20"
                                : "bg-[#222]"
                            }`}
                          >
                            {cat.name.toLowerCase().includes("coin") ? (
                              <Coins size={20} />
                            ) : cat.name.toLowerCase().includes("survival") ? (
                              <Crown size={20} />
                            ) : cat.name.toLowerCase().includes("skyblock") ? (
                              <Trophy size={20} />
                            ) : (
                              <Package size={20} />
                            )}
                          </div>
                          <span className="uppercase tracking-wider text-sm font-semibold">
                            {cat.name}
                          </span>
                        </div>
                        <ChevronRight
                          size={16}
                          className={`transition-transform duration-200 ${selectedCategory === cat.name ? "translate-x-1" : "opacity-0 group-hover:opacity-100"}`}
                        />
                      </motion.button>
                    ))}
                  </div>
                </div>
              </aside>

              {/* Product Grid or Home Content */}
              <div className="flex-grow">
                {isHome ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#1a1a1a]/40 backdrop-blur-xl rounded-2xl border border-white/5 p-8 sm:p-12 shadow-2xl text-left"
                  >
                    <div className="flex flex-col sm:flex-row items-center gap-6 mb-10">
                      <motion.div
                        animate={{
                          scale: [1, 1.05, 1],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="w-48 h-28 sm:w-64 sm:h-36 rounded-2xl p-4 flex items-center justify-center"
                      >
                        <img
                          src={settings.welcome_logo || EVOPIXEL_IMAGE}
                          alt="EvoPixel Logo"
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </motion.div>
                      <div className="text-center sm:text-left">
                        <h2 className="text-blue-400 text-sm sm:text-base font-bold uppercase tracking-widest mb-2">
                          Welcome to the Official
                        </h2>
                        <h1 className="text-blue-400 text-3xl sm:text-5xl font-black uppercase tracking-tight leading-tight">
                          EVOPIXEL STORE
                        </h1>
                      </div>
                    </div>

                    <div className="space-y-10 text-white/70 text-base sm:text-lg leading-relaxed">
                      <p>
                        Welcome to the official EvoPixel Store, the one-stop
                        destination for enhancing your experience on our server.
                        Explore a world of possibilities as you browse through
                        our selection of items and packages, all carefully
                        designed to elevate your gameplay. We prioritize the
                        security of your transactions and use secure payment
                        systems to process your payments with the utmost safety
                        and privacy, ensuring your peace of mind.
                      </p>

                      <section>
                        <h3 className="text-[#4CAF50] text-xl sm:text-2xl font-black uppercase tracking-wider mb-3">
                          SUPPORT
                        </h3>
                        <p>
                          Still have unanswered questions before checkout? Have
                          you been waiting for over 20 minutes but your package
                          still hasn't arrived? Create a ticket on our
                          <motion.a
                            href="https://discord.gg/dPBrr5A9wg"
                            target="_blank"
                            rel="noopener noreferrer"
                            whileTap={{ scale: 0.95 }}
                            className="text-blue-400 hover:underline mx-1.5 font-bold"
                          >
                            Discord
                          </motion.a>
                          or contact our admin via WhatsApp at
                          <motion.a
                            href="https://wa.me/6283872747478"
                            target="_blank"
                            rel="noopener noreferrer"
                            whileTap={{ scale: 0.95 }}
                            className="text-blue-400 hover:underline ml-1.5 font-bold"
                          >
                            +62 838-7274-7478
                          </motion.a>
                        </p>
                      </section>

                      <section>
                        <h3 className="text-[#F44336] text-xl sm:text-2xl font-black uppercase tracking-wider mb-3">
                          REFUND POLICY
                        </h3>
                        <p>
                          At EvoPixel, we stand by the quality of our products
                          and services. All payments are considered final and
                          non-refundable, as they directly contribute to
                          maintaining the server's quality and sustainability.
                          It's important to note that attempting a chargeback or
                          opening a payment dispute will result in severe
                          consequences, including a permanent and irreversible
                          ban from all of our servers.
                        </p>
                      </section>
                    </div>
                  </motion.div>
                ) : (
                  <>
                    <h2 className="text-blue-400 text-4xl font-black uppercase italic tracking-widest mb-8 drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]">
                      {selectedCategory}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {filteredProducts.map((product) => (
                        <motion.div
                          key={product.id}
                          className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 flex flex-col items-center group relative overflow-hidden shadow-xl hover:shadow-blue-600/10 transition-all duration-300"
                        >
                          {/* Cart Count Badge */}
                          {cart.find(
                            (item) => item.product.id === product.id,
                          ) && (
                            <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-[#4CAF50] text-white px-3 py-1.5 rounded-full font-black text-xs shadow-lg border-b-2 border-r-2 border-black/30 animate-in fade-in zoom-in duration-300">
                              <ShoppingCart
                                size={14}
                                className="fill-white/20"
                              />
                              <span>
                                {
                                  cart.find(
                                    (item) => item.product.id === product.id,
                                  )?.quantity
                                }
                              </span>
                            </div>
                          )}

                          <div className="w-full h-48 bg-gradient-to-b from-[#222] to-[#1a1a1a] rounded-xl mb-6 flex items-center justify-center border border-white/5 overflow-hidden relative">
                            <img
                              src={product.image || EVOPIXEL_IMAGE}
                              alt={product.name}
                              className="w-32 h-32 object-contain transition-transform duration-500"
                            />
                          </div>

                          <h3 className="font-bold text-xl mb-1 uppercase tracking-wider text-center text-white group-hover:text-blue-400 transition-colors">
                            {product.name}
                          </h3>

                          <p className="text-blue-400 font-bold mb-6 text-xl">
                            Rp {product.price.toLocaleString()}
                          </p>

                          <div className="flex w-full gap-2">
                            <motion.button
                              onClick={() => setShowInfoModal(product)}
                              whileTap={{ scale: 0.9 }}
                              className="mc-button mc-button-blue w-12 h-12 flex items-center justify-center transition-all"
                            >
                              <AlertCircle size={20} />
                            </motion.button>
                            <motion.button
                              onClick={() => addToCart(product)}
                              whileTap={{ scale: 0.95 }}
                              className="flex-grow mc-button mc-button-green py-3 font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3 text-sm"
                            >
                              <div className="w-5 h-5 relative flex items-center justify-center">
                                {/* Minecart Icon */}
                                <div className="w-4 h-2.5 bg-[#7c7c7c] border-x-2 border-b-2 border-black/60 relative">
                                  <div className="absolute -bottom-1 left-0 w-1 h-1 bg-[#333] rounded-full border border-black/20"></div>
                                  <div className="absolute -bottom-1 right-0 w-1 h-1 bg-[#333] rounded-full border border-black/20"></div>
                                </div>
                              </div>
                              Add to cart
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Bottom Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-10">
              {/* Top Donator */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-[#1a1a1a]/50 backdrop-blur-xl rounded-xl border border-white/5 overflow-hidden shadow-xl"
              >
                <div className="p-4 flex items-center gap-2.5 border-b border-white/5 bg-white/5">
                  <Trophy className="text-yellow-500" size={18} />
                  <h4 className="text-white font-bold uppercase tracking-widest text-[10px]">
                    Top Donator
                  </h4>
                </div>
                <div className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#333] rounded-lg overflow-hidden border border-white/10 shadow-lg">
                    <img
                      src={`https://mc-heads.net/avatar/Vallen3448`}
                      alt="TOP DONATOR"
                      className="w-full h-full"
                    />
                  </div>
                  <div>
                    <p className="text-blue-400 text-lg font-black tracking-widest leading-none mb-1">
                      .Vallen3448
                    </p>
                    <p className="text-white/40 text-[10px] font-medium">
                      Spent the most this month.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Recent Payments */}
              <motion.div
                ref={recentPaymentsRef}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-[#1a1a1a]/50 backdrop-blur-xl rounded-xl border border-white/5 overflow-hidden shadow-xl"
              >
                <div className="p-4 flex items-center gap-2.5 border-b border-white/5 bg-white/5">
                  <Users className="text-white/60" size={18} />
                  <h4 className="text-white font-bold uppercase tracking-widest text-[10px]">
                    Recent Payments
                  </h4>
                </div>
                <div className="p-4 flex flex-row flex-wrap items-center gap-2">
                  {[1, 2, 3, 4, 5].map((_, i) => (
                    <div
                      key={i}
                      className="group relative"
                      onClick={() =>
                        setActiveRecentPayment(
                          activeRecentPayment === i ? null : i,
                        )
                      }
                    >
                      <motion.div
                        whileTap={{ scale: 0.9 }}
                        className="w-9 h-9 bg-[#333] rounded-lg overflow-hidden border border-white/10 hover:scale-110 hover:border-blue-500/50 transition-all cursor-help shadow-md"
                      >
                        <img
                          src={`https://mc-heads.net/avatar/Vallen3448`}
                          alt="Recent Payment"
                          className="w-full h-full"
                        />
                      </motion.div>
                      <div
                        className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-blue-400 text-[9px] font-bold rounded-md transition-all whitespace-nowrap pointer-events-none z-50 shadow-2xl border border-white/10 ${
                          activeRecentPayment === i
                            ? "opacity-100 -translate-y-1"
                            : "opacity-0 group-hover:opacity-100 group-hover:-translate-y-1"
                        }`}
                      >
                        .Vallen3448
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Info Modal */}
          <AnimatePresence>
            {showInfoModal && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                  onClick={() => setShowInfoModal(null)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative bg-[#1a1a1a] border border-white/10 w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh] md:min-h-[500px]"
                >
                  {/* Close Button (X) - Improved responsiveness */}
                  <button
                    onClick={() => setShowInfoModal(null)}
                    className="absolute top-3 right-3 sm:top-4 sm:right-4 z-[210] mc-button mc-button-red w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center transition-all active:scale-95 shadow-lg"
                    title="Close"
                  >
                    <X size={24} strokeWidth={3} />
                  </button>

                  {/* Left Side - Product Summary (Aligned to Top) */}
                  <div className="w-full md:w-80 bg-[#121212] p-6 sm:p-8 flex flex-col items-center justify-start text-center border-b md:border-b-0 md:border-r border-white/5 shrink-0 overflow-y-auto md:overflow-visible">
                    {/* Product Image */}
                    <div className="w-full h-40 bg-gradient-to-b from-[#222] to-[#1a1a1a] rounded-xl mb-4 flex items-center justify-center border border-white/5 overflow-hidden">
                      <img
                        src={EVOPIXEL_IMAGE}
                        alt={showInfoModal.name}
                        className="w-24 h-24 object-contain"
                      />
                    </div>

                    <div className="mb-2">
                      <h3 className="text-base font-bold uppercase tracking-widest text-blue-300 mb-1">
                        {showInfoModal.name}
                      </h3>
                      <p className="text-white font-bold text-lg mb-2">
                        Rp {showInfoModal.price.toLocaleString()}
                      </p>
                    </div>

                    <div className="w-full">
                      <button
                        onClick={() => {
                          addToCart(showInfoModal);
                          setShowInfoModal(null);
                        }}
                        className="w-full mc-button mc-button-green py-3 font-black uppercase italic tracking-widest text-sm shadow-xl shadow-green-900/20"
                      >
                        Add to cart
                      </button>
                    </div>
                  </div>

                  {/* Right Side - Detailed Info */}
                  <div className="flex-grow p-6 sm:p-10 overflow-y-auto bg-[#1a1a1a]">
                    <div className="space-y-8">
                      {(() => {
                        const isCoin = showInfoModal.category
                          .toLowerCase()
                          .includes("coin");
                        const isSurvival = showInfoModal.category
                          .toLowerCase()
                          .includes("survival");
                        const labelPerks = getLabelValue(
                          "label_perks",
                          showInfoModal.category,
                        );
                        const labelCommands = getLabelValue(
                          "label_commands",
                          showInfoModal.category,
                        );
                        const labelDescription = getLabelValue(
                          "label_description",
                          showInfoModal.category,
                        );

                        const showPerksSection = isCoin
                          ? labelDescription !== ""
                          : labelPerks !== "";
                        const showCommandsSection =
                          !isCoin && !isSurvival && labelCommands !== "";

                        return (
                          <>
                            {showPerksSection && (
                              <div>
                                <h4 className="flex items-center gap-2 text-[#FF6347] font-bold uppercase tracking-widest mb-4 border-b border-[#FF6347]/20 pb-2">
                                  <span className="text-xl">❤️</span>{" "}
                                  {isCoin
                                    ? labelDescription || "DESCRIPTION"
                                    : labelPerks || "PERKS"}
                                </h4>
                                {isCoin ? (
                                  <p className="text-white/80 font-medium leading-relaxed">
                                    {showInfoModal.description ||
                                      "ECoins can be used to purchase cosmetics, tags, money, and other items available in the server's Coin Shop."}
                                  </p>
                                ) : (
                                  <ul className="space-y-3">
                                    {(
                                      showInfoModal.perks || [
                                        `${showInfoModal.name} Rank Prefix on EvoPixel SMP.`,
                                        "Access to RTP world Nether",
                                        "3x Land Create",
                                        "6 Set Homes",
                                        "6 Player Warps",
                                        "9 Auction House Slots",
                                        "15 Menit TempFly / Day",
                                        "3 Player Vaults",
                                      ]
                                    ).map((perk, i) => (
                                      <li
                                        key={i}
                                        className="flex items-start gap-3 text-white/80 font-medium"
                                      >
                                        <span className="text-blue-300">❖</span>{" "}
                                        {perk}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}

                            {showCommandsSection && (
                              <div>
                                <h4 className="flex items-center gap-2 text-[#FF6347] font-bold uppercase tracking-widest mb-4 border-b border-[#FF6347]/20 pb-2">
                                  <span className="text-xl">❤️</span>{" "}
                                  {labelCommands || "COMMANDS"}
                                </h4>
                                <ul className="space-y-3">
                                  {(
                                    showInfoModal.commands || [
                                      "Access to /hat",
                                      "Access to /back",
                                      "Access to /craft",
                                      "Access to /vault",
                                      "Access to /fly",
                                      "Access to /feed",
                                      "Access to /pweather",
                                      "Access to /enderchest",
                                      "Access to /nickname",
                                    ]
                                  ).map((cmd, i) => (
                                    <li
                                      key={i}
                                      className="flex items-start gap-3 text-white/80 font-medium"
                                    >
                                      <span className="text-blue-300">❖</span>{" "}
                                      {cmd}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Login Modal */}
          <AnimatePresence>
            {showLoginModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/90 backdrop-blur-md"
                  onClick={() => setShowLoginModal(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="relative bg-[#1a1a1a] border-b-8 border-r-8 border-black/30 border border-white/10 w-full max-w-lg rounded-none overflow-hidden shadow-2xl"
                >
                  <button
                    onClick={() => setShowLoginModal(false)}
                    className="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                  <div className="p-6 sm:p-8 text-center">
                    <h3 className="text-base sm:text-lg font-black uppercase italic tracking-widest mb-3 drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]">
                      {isResetting
                        ? "Reset your password"
                        : isRegistering
                          ? "Create your account"
                          : "Please login to continue"}
                    </h3>
                    <p className="text-white/40 text-sm mb-6 max-w-md mx-auto leading-relaxed">
                      {isResetting
                        ? "Enter your username and your new desired password."
                        : isRegistering
                          ? "Fill in your details to register. Your username will be used for store purchases."
                          : "Usernames can't contain spaces, they can have any letter and number, and they are Case Sensitive."}
                    </p>

                    <div className="space-y-4 mb-6">
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#333] rounded-none overflow-hidden border border-white/10">
                          <img
                            src={`https://mc-heads.net/avatar/${username || "steve"}`}
                            alt="Head"
                            className="w-full h-full"
                          />
                        </div>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Enter Username"
                          autoComplete="off"
                          spellCheck={false}
                          autoCorrect="off"
                          className="w-full bg-[#222] border-b-4 border-r-4 border-black/30 border border-white/5 rounded-none py-4 pl-16 pr-6 text-lg font-bold focus:outline-none focus:border-blue-500 transition-all placeholder:text-white/40"
                        />
                      </div>

                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={
                            isResetting
                              ? "Enter New Password"
                              : "Enter Password"
                          }
                          className="w-full bg-[#222] border-b-4 border-r-4 border-black/30 border border-white/5 rounded-none py-4 px-6 text-lg font-bold focus:outline-none focus:border-blue-500 transition-all placeholder:text-white/40 pr-14"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff size={20} />
                          ) : (
                            <Eye size={20} />
                          )}
                        </button>
                      </div>
                    </div>

                    <motion.button
                      onClick={handleLogin}
                      disabled={loading}
                      whileTap={{ scale: 0.98 }}
                      className="w-full mc-button mc-button-green py-4 font-black uppercase italic tracking-[0.2em] text-lg transition-all shadow-xl shadow-green-900/20 mb-6 flex items-center justify-center gap-3"
                    >
                      {loading ? (
                        <Loader2 className="animate-spin" />
                      ) : isResetting ? (
                        "Reset Password"
                      ) : isRegistering ? (
                        "Register"
                      ) : (
                        "Login"
                      )}
                    </motion.button>

                    <div className="flex flex-col gap-3 mb-6">
                      <motion.button
                        onClick={() => {
                          setIsRegistering(!isRegistering);
                          setIsResetting(false);
                          setError(null);
                        }}
                        whileTap={{ scale: 0.95 }}
                        className="text-blue-400 font-bold uppercase tracking-widest text-xs hover:underline"
                      >
                        {isResetting
                          ? "Back to Login"
                          : isRegistering
                            ? "Already have an account? Login"
                            : "Don't have an account? Register"}
                      </motion.button>

                      {!isRegistering && !isResetting && (
                        <motion.button
                          onClick={() => {
                            setIsResetting(true);
                            setError(null);
                          }}
                          whileTap={{ scale: 0.95 }}
                          className="text-white/40 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors"
                        >
                          Forgot Password?
                        </motion.button>
                      )}
                    </div>

                    <div className="flex items-center justify-center gap-4">
                      <span className="text-xs font-bold uppercase tracking-widest text-white/40">
                        Bedrock user?
                      </span>
                      <motion.button
                        onClick={() => setIsBedrock(!isBedrock)}
                        whileTap={{ scale: 0.95 }}
                        className={`px-6 py-2 rounded-none border-b-4 border-r-4 border-black/30 font-black uppercase italic tracking-widest text-xs transition-all ${
                          isBedrock
                            ? "bg-[#4CAF50] text-white"
                            : "bg-[#f44336] text-white"
                        }`}
                      >
                        {isBedrock ? "Yes" : "No"}
                      </motion.button>
                    </div>

                    {error && (
                      <p className="mt-6 text-red-400 font-bold uppercase tracking-widest text-xs">
                        {error}
                      </p>
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Terms of Service Modal */}
          <AnimatePresence>
            {showTermsModal && (
              <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowTermsModal(false)}
                  className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="relative bg-[#0f171e] border border-white/10 w-full max-w-3xl rounded-2xl shadow-2xl p-6 sm:p-12 max-h-[90vh] overflow-y-auto custom-scrollbar"
                >
                  <button
                    onClick={() => setShowTermsModal(false)}
                    className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white/40 hover:text-white transition-colors z-10"
                  >
                    <X size={24} />
                  </button>

                  <div className="space-y-8">
                    <div>
                      <h2 className="text-3xl font-bold text-white mb-2">
                        Terms & Conditions
                      </h2>
                      <div className="w-16 h-1 bg-blue-500/50 rounded-full" />
                    </div>

                    <div className="space-y-6 text-white/70 leading-relaxed">
                      <p>
                        Welcome to our store. By accessing or using our
                        platform, you agree to the following terms. Please read
                        them carefully before proceeding.
                      </p>

                      <ul className="space-y-4">
                        <li>
                          1. All purchases are final and non-refundable unless
                          stated otherwise.
                        </li>
                        <li>
                          2. Users must provide a valid username to complete a
                          transaction. We do not take responsibility for
                          incorrect usernames submitted by the user.
                        </li>
                        <li>
                          3. Any abuse, exploitation, or attempt to manipulate
                          the system will result in a permanent ban from our
                          platform.
                        </li>
                        <li>
                          4. Services and digital goods may take a few minutes
                          to be delivered. Please be patient before contacting
                          support.
                        </li>
                        <li>
                          5. We reserve the right to modify these terms at any
                          time without prior notice.
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="mt-12 pt-8 border-t border-white/5 text-center">
                    <p className="text-white/20 text-xs font-medium">
                      © 2026 EvoPixel. All Rights Reserved.
                    </p>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Privacy Policy Modal */}
          <AnimatePresence>
            {showPrivacyModal && (
              <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowPrivacyModal(false)}
                  className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="relative bg-[#0f171e] border border-white/10 w-full max-w-3xl rounded-2xl shadow-2xl p-6 sm:p-12 max-h-[90vh] overflow-y-auto custom-scrollbar"
                >
                  <button
                    onClick={() => setShowPrivacyModal(false)}
                    className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white/40 hover:text-white transition-colors z-10"
                  >
                    <X size={24} />
                  </button>

                  <div className="space-y-8">
                    <div>
                      <h2 className="text-3xl font-bold text-white mb-2">
                        Privacy Policy
                      </h2>
                      <div className="w-16 h-1 bg-emerald-500/50 rounded-full" />
                    </div>

                    <div className="space-y-6 text-white/70 leading-relaxed">
                      <p>
                        Your privacy is important to us. This policy explains
                        how we handle your data when using our store.
                      </p>

                      <ul className="space-y-4">
                        <li>
                          1. We only collect necessary information such as
                          username and password to process purchases. We do not
                          collect sensitive personal data.
                        </li>
                        <li>
                          2. Username and transaction data are used solely for
                          service delivery and verification purposes.
                        </li>
                        <li>
                          3. We do not sell, trade, or share your data with
                          third parties.
                        </li>
                        <li>
                          4. All payment processing is handled securely through
                          authorized payment gateways.
                        </li>
                        <li>
                          5. By using our platform, you agree to this data usage
                          policy.
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="mt-12 pt-8 border-t border-white/5 text-center">
                    <p className="text-white/20 text-xs font-medium">
                      © 2026 EvoPixel. All Rights Reserved.
                    </p>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Cart Sidebar */}
          <AnimatePresence>
            {isCartOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsCartOpen(false)}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]"
                />
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="fixed top-0 right-0 h-full w-full max-w-md bg-[#1a1a1a] border-l border-white/10 z-[160] shadow-2xl flex flex-col"
                >
                  {/* Header */}
                  <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h2 className="text-2xl font-black uppercase tracking-widest text-white flex items-center gap-3">
                      Your Cart
                    </h2>
                    <motion.button
                      onClick={() => setIsCartOpen(false)}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 hover:bg-white/5 rounded-full transition-colors"
                    >
                      <X size={24} />
                    </motion.button>
                  </div>

                  {/* Items List */}
                  <div className="flex-grow overflow-y-auto p-6 space-y-6">
                    {cart.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                        <ShoppingCart size={64} className="mb-4" />
                        <p className="text-lg font-bold uppercase tracking-widest">
                          Your cart is empty
                        </p>
                      </div>
                    ) : (
                      cart.map((item) => (
                        <div key={item.product.id} className="flex gap-4 group">
                          <div className="w-20 h-20 bg-[#121212] rounded-lg flex items-center justify-center border border-white/5 shrink-0 overflow-hidden">
                            <img
                              src={item.product.image || EVOPIXEL_IMAGE}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-grow">
                            <div className="flex justify-between items-start mb-1">
                              <h3 className="font-bold text-white uppercase tracking-wider text-sm">
                                {item.product.name}
                              </h3>
                              <motion.button
                                onClick={() => removeFromCart(item.product.id)}
                                whileTap={{ scale: 0.9 }}
                                className="text-white/30 hover:text-red-500 transition-colors"
                              >
                                <X size={16} />
                              </motion.button>
                            </div>
                            <p className="text-xs text-white/50 mb-3">
                              Unit Price: Rp{" "}
                              {item.product.price.toLocaleString()}
                            </p>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center bg-[#121212] rounded-lg border border-white/5 overflow-hidden">
                                <motion.button
                                  onClick={() =>
                                    updateQuantity(item.product.id, -1)
                                  }
                                  whileTap={{ scale: 0.9 }}
                                  className="p-1.5 hover:bg-white/5 transition-colors text-white/50"
                                >
                                  <Minus size={14} />
                                </motion.button>
                                <span className="w-8 text-center font-bold text-xs">
                                  {item.quantity}
                                </span>
                                <motion.button
                                  onClick={() =>
                                    updateQuantity(item.product.id, 1)
                                  }
                                  whileTap={{ scale: 0.9 }}
                                  className="p-1.5 hover:bg-white/5 transition-colors text-white/50"
                                >
                                  <Plus size={14} />
                                </motion.button>
                              </div>
                              <p className="font-bold text-blue-400">
                                Rp{" "}
                                {(
                                  item.product.price * item.quantity
                                ).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-6 bg-[#121212] border-t border-white/10 space-y-6">
                    {/* Redeem Code */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-white/50">
                        Redeem Code:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          placeholder="Enter code"
                          className="flex-grow bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                        />
                        <motion.button
                          onClick={handleApplyCoupon}
                          whileTap={{ scale: 0.95 }}
                          className="mc-button mc-button-blue px-4 py-2 text-xs font-bold uppercase tracking-widest"
                        >
                          Apply
                        </motion.button>
                      </div>
                    </div>

                    {appliedDiscount > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/50 uppercase tracking-widest">
                          Discount:
                        </span>
                        <span className="text-[#F44336] font-bold">
                          - Rp {appliedDiscount.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {/* Total */}
                    <div className="flex items-center justify-between border-t border-white/5 pt-4">
                      <span className="text-lg font-bold uppercase tracking-widest">
                        Total:
                      </span>
                      <span className="text-2xl font-black text-blue-400">
                        Rp {cartTotal.toLocaleString()}
                      </span>
                    </div>

                    {/* Checkout Button */}
                    <motion.button
                      onClick={handleCheckout}
                      disabled={cart.length === 0 || loading}
                      whileTap={{ scale: 0.98 }}
                      className="w-full mc-button mc-button-green py-4 font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        "Checkout"
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Logout Confirmation Modal */}
          <AnimatePresence>
            {showLogoutConfirm && (
              <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                  onClick={() => setShowLogoutConfirm(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative bg-[#1a1a1a] border-b-8 border-r-8 border-black/30 border border-white/10 w-full max-w-md rounded-none overflow-hidden shadow-2xl p-8 text-center"
                >
                  <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                    <LogOut size={40} className="text-red-500" />
                  </div>

                  <h3 className="text-2xl font-black uppercase italic tracking-widest mb-4 drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]">
                    Are you sure?
                  </h3>

                  <p className="text-white/60 mb-8 leading-relaxed">
                    You are about to logout from{" "}
                    <span className="text-white font-bold">{username}</span>.
                    Your cart will be cleared.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <motion.button
                      onClick={() => setShowLogoutConfirm(false)}
                      whileTap={{ scale: 0.95 }}
                      className="mc-button py-4 font-bold uppercase tracking-widest text-sm"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      onClick={handleLogout}
                      whileTap={{ scale: 0.95 }}
                      className="mc-button mc-button-red py-4 font-bold uppercase tracking-widest text-sm"
                    >
                      Logout
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Checkout Confirmation Modal */}
          <AnimatePresence>
            {showCheckoutConfirm && (
              <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                  onClick={() => setShowCheckoutConfirm(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative bg-[#1a1a1a] border-b-8 border-r-8 border-black/30 border border-white/10 w-full max-w-sm rounded-none overflow-hidden shadow-2xl p-6 sm:p-8 text-center"
                >
                  <button
                    onClick={() => setShowCheckoutConfirm(false)}
                    className="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>

                  <div className="w-20 h-20 flex items-center justify-center mx-auto mb-4 overflow-hidden">
                    <img
                      src={settings.checkout_confirm_image || EVOPIXEL_IMAGE}
                      alt="Confirm"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <h3 className="text-xl font-black uppercase italic tracking-widest mb-3 drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]">
                    Confirm Username
                  </h3>

                  <div className="bg-black/40 p-3 mb-6 border border-white/5">
                    <p className="text-white/40 text-[9px] uppercase tracking-[0.2em] font-bold mb-1">
                      Minecraft Username
                    </p>
                    <p className="text-blue-400 font-black text-xl tracking-widest drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                      {username}
                    </p>
                  </div>

                  <p className="text-white/60 mb-6 text-xs leading-relaxed">
                    <span className="text-red-400 font-bold uppercase tracking-widest text-[9px] block mb-1">
                      Important Warning:
                    </span>
                    Please make sure the username above is correct and matches
                    your <span className="text-white font-bold">Gamertag</span>.
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <motion.button
                      onClick={() => setShowCheckoutConfirm(false)}
                      whileTap={{ scale: 0.95 }}
                      className="mc-button py-3 font-bold uppercase tracking-widest text-xs"
                    >
                      Change
                    </motion.button>
                    <motion.button
                      onClick={confirmCheckout}
                      whileTap={{ scale: 0.95 }}
                      className="mc-button mc-button-green py-3 font-bold uppercase tracking-widest text-xs"
                    >
                      Yes, Correct
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <footer className="bg-[#0f0f13] border-t border-white/5 pt-20 pb-10">
            <div className="max-w-7xl mx-auto px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-20">
                {/* Useful Links */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 text-white">
                    <div className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center">
                      <span className="text-[10px] font-bold">i</span>
                    </div>
                    <h3 className="text-xl font-bold uppercase tracking-wider">
                      Useful Links
                    </h3>
                  </div>
                  <ul className="space-y-4">
                    {[
                      "Home",
                      "Store",
                      "Terms of Service",
                      "Privacy Policy",
                    ].map((link) => (
                      <li key={link}>
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (link === "Terms of Service")
                              setShowTermsModal(true);
                            if (link === "Privacy Policy")
                              setShowPrivacyModal(true);
                            if (link === "Home") {
                              setIsHome(true);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }
                            if (link === "Store") {
                              setIsHome(false);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }
                          }}
                          className="text-white/60 hover:text-white transition-colors text-sm font-medium"
                        >
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Contact Support */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 text-white">
                    <ThumbsUp size={24} />
                    <h3 className="text-xl font-bold uppercase tracking-wider">
                      Contact Support
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {/* Discord Support */}
                    <div className="bg-[#1a1a24] rounded-2xl p-6 border border-[#5865F2]/50 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#5865F2] rounded-xl flex items-center justify-center shrink-0">
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="white"
                          >
                            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.419-2.157 2.419z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-bold text-white">
                            Evo Pixel Discord
                          </h4>
                          <p className="text-xs text-white/40">
                            Join our community server!
                          </p>
                        </div>
                      </div>
                      <motion.a
                        href="https://discord.gg/dPBrr5A9wg"
                        target="_blank"
                        rel="noopener noreferrer"
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-[#5865F2]/10 hover:bg-[#5865F2]/20 border border-[#5865F2]/50 rounded-xl py-3 flex items-center justify-center gap-2 transition-all group"
                      >
                        <MessageSquare
                          size={16}
                          className="group-hover:scale-110 transition-transform"
                        />
                        <span className="font-bold uppercase tracking-widest text-xs">
                          Join Server
                        </span>
                      </motion.a>
                    </div>

                    {/* WhatsApp Support */}
                    <div className="bg-[#1a1a24] rounded-2xl p-6 border border-[#25D366]/50 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#25D366] rounded-xl flex items-center justify-center shrink-0">
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="white"
                          >
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-bold text-white">
                            Evo Pixel WhatsApp
                          </h4>
                          <p className="text-xs text-white/40">
                            Join our group & get support!
                          </p>
                        </div>
                      </div>
                      <motion.a
                        href="https://chat.whatsapp.com/HxbaCYN52rMIkuqFAcpQPY?mode=ac_t"
                        target="_blank"
                        rel="noopener noreferrer"
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/50 rounded-xl py-3 flex items-center justify-center gap-2 transition-all group"
                      >
                        <ThumbsUp
                          size={16}
                          className="group-hover:scale-110 transition-transform"
                        />
                        <span className="font-bold uppercase tracking-widest text-xs">
                          Join Group
                        </span>
                      </motion.a>
                    </div>
                  </div>
                </div>

                {/* EvoPixel Store */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 text-white">
                    <ShoppingCart size={24} />
                    <h3 className="text-xl font-bold uppercase tracking-wider">
                      EVOPIXEL STORE
                    </h3>
                  </div>
                  <p className="text-white/60 text-sm leading-relaxed">
                    We work very hard to bring you unique and original content.
                    Purchasing rank and coins helps us create more high-quality
                    updates!
                  </p>
                  <motion.button
                    onClick={() => {
                      setIsHome(false);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-[#1a1a24] hover:bg-[#222233] border border-blue-500/20 rounded-xl px-8 py-3 text-blue-400 font-bold uppercase tracking-widest text-sm transition-all"
                  >
                    Visit the store
                  </motion.button>
                  <div className="flex items-center gap-4 pt-4">
                    <motion.a
                      href="https://youtube.com/@evopixelmc?si=cjUfYPy4w"
                      target="_blank"
                      rel="noopener noreferrer"
                      whileTap={{ scale: 0.9 }}
                      className="w-10 h-10 bg-[#FF0000] rounded-lg flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-[#FF0000]/20"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="white"
                      >
                        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                      </svg>
                    </motion.a>
                    <motion.a
                      href="https://www.tiktok.com/@evopixelmc?_t=ZS-8yqWgVgxvW6&_r=1"
                      target="_blank"
                      rel="noopener noreferrer"
                      whileTap={{ scale: 0.9 }}
                      className="w-10 h-10 bg-black rounded-lg flex items-center justify-center hover:scale-110 transition-transform border border-white/10 shadow-lg shadow-black/20"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 448 512"
                        fill="white"
                      >
                        <path d="M448 209.91a210.06 210.06 0 0 1-122.77-39.25V349.38A162.55 162.55 0 1 1 185 188.31V278.2a74.62 74.62 0 1 0 52.23 71.18V0l88 0a121.18 121.18 0 0 0 1.86 22.17A122.18 122.18 0 0 0 381 102.39a121.43 121.43 0 0 0 67 20.14Z" />
                      </svg>
                    </motion.a>
                    <motion.a
                      href="https://discord.gg/dPBrr5A9wg"
                      target="_blank"
                      rel="noopener noreferrer"
                      whileTap={{ scale: 0.9 }}
                      className="w-10 h-10 bg-[#5865F2] rounded-lg flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-[#5865F2]/20"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="white"
                      >
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.419-2.157 2.419z" />
                      </svg>
                    </motion.a>
                    <motion.a
                      href="https://chat.whatsapp.com/HxbaCYN52rMIkuqFAcpQPY?mode=ac_t"
                      target="_blank"
                      rel="noopener noreferrer"
                      whileTap={{ scale: 0.9 }}
                      className="w-10 h-10 bg-[#25D366] rounded-lg flex items-center justify-center hover:scale-110 transition-transform"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="white"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    </motion.a>
                  </div>
                </div>
              </div>

              {/* Bottom Bar */}
              <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-white/30 text-xs font-medium">
                  © 2026 EvoPixel. All Rights Reserved.
                </p>
              </div>
            </div>
          </footer>
        </>
      )}

      {/* Toast Notifications */}
      <div className="fixed top-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <motion.div
              layout
              key={toast.id}
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{
                opacity: 0,
                x: 100,
                scale: 0.8,
                transition: { duration: 0.2 },
              }}
              className={`pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-xl border-b-4 border-r-4 border-black/30 shadow-2xl min-w-[300px] relative overflow-hidden ${
                toast.type === "success"
                  ? "bg-[#4CAF50] text-white"
                  : "bg-[#f44336] text-white"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle2 size={20} />
              ) : (
                <AlertCircle size={20} />
              )}
              <span className="font-bold uppercase tracking-wider text-sm">
                {toast.message}
              </span>
              <button
                onClick={() =>
                  setToasts((prev) => prev.filter((t) => t.id !== toast.id))
                }
                className="ml-auto p-1 hover:bg-black/10 rounded-full transition-colors"
              >
                <X size={16} />
              </button>

              {/* Progress Bar */}
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 3, ease: "linear" }}
                className="absolute bottom-0 left-0 right-0 h-1 bg-black/20 origin-left"
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// --- Image Cropping Helpers ---
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: any,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("No 2d context"));
        return;
      }

      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height,
      );

      resolve(canvas.toDataURL("image/png"));
    };
    image.onerror = (e) => reject(e);
  });
}

function ImageCropperModal({
  image,
  aspect,
  onCancel,
  onComplete,
}: {
  image: string;
  aspect: number;
  onCancel: () => void;
  onComplete: (base64: string) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback(
    (_croppedArea: any, croppedAreaPixels: any) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  const handleDone = async () => {
    if (!croppedAreaPixels || isProcessing) return;
    setIsProcessing(true);
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      onComplete(croppedImage);
    } catch (e) {
      console.error(e);
      alert("Failed to crop image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col">
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#1a1a1a]">
        <h3 className="font-bold uppercase tracking-widest text-xs">
          Adjust Image
        </h3>
        <button onClick={onCancel} className="text-white/40 hover:text-white">
          <X size={20} />
        </button>
      </div>
      <div className="flex-grow relative bg-black">
        <CropperComponent
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
        />
      </div>
      <div className="p-6 bg-[#1a1a1a] border-t border-white/10 flex flex-col gap-6">
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold text-white/40">
            <span>Zoom</span>
            <span>{Math.round(zoom * 100)}%</span>
          </div>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
        <div className="flex gap-4">
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-grow mc-button mc-button-red py-4 uppercase font-bold text-xs disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDone}
            disabled={isProcessing || !croppedAreaPixels}
            className="flex-grow mc-button mc-button-green py-4 uppercase font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              "Crop & Save"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Admin Panel Component ---
function AdminPanel({
  onClose,
  products,
  categories,
  settings,
  coupons,
  onUpdate,
  addToast,
}: {
  onClose: () => void;
  products: Product[];
  categories: { id: string; name: string }[];
  settings: Record<string, string>;
  coupons: any[];
  onUpdate: () => void;
  addToast: (message: string, type?: "success" | "error") => void;
}) {
  const [activeTab, setActiveTab] = useState<
    "products" | "categories" | "coupons" | "settings"
  >("products");
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    type: "product" | "category" | "coupon";
    name: string;
  } | null>(null);
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    discount: 0,
    active: true,
  });
  const [labelSettingsCategory, setLabelSettingsCategory] = useState<
    "__global" | string
  >("__global");

  const getLabelSettingKey = (base: string) =>
    labelSettingsCategory === "__global"
      ? base
      : `${base}__${labelSettingsCategory}`;

  const getLabelSettingValue = (base: string, defaultValue: string) =>
    settings[getLabelSettingKey(base)] ?? defaultValue;

  const [croppingImage, setCroppingImage] = useState<{
    src: string;
    aspect: number;
    onComplete: (base64: string) => void;
  } | null>(null);

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    aspect: number,
    onComplete: (base64: string) => void,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCroppingImage({
          src: reader.result as string,
          aspect,
          onComplete: (base64) => {
            onComplete(base64);
            setCroppingImage(null);
          },
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct.name || !editingProduct.category) {
      addToast("Name and Category are required", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingProduct),
      });
      if (res.ok) {
        setEditingProduct(null);
        onUpdate();
        addToast("Rank saved successfully!", "success");
      } else {
        const data = await res.json();
        addToast(data.message || "Failed to save rank", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Network error while saving rank", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        onUpdate();
        setDeleteConfirm(null);
        addToast("Rank deleted successfully!", "success");
      } else {
        addToast("Failed to delete rank", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Network error while deleting rank", "error");
    }
  };

  const handleSaveCoupon = async (coupon: any) => {
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(coupon),
      });
      if (res.ok) {
        onUpdate();
        addToast("Coupon saved successfully!", "success");
      } else {
        addToast("Failed to save coupon", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Network error while saving coupon", "error");
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    try {
      const res = await fetch(`/api/coupons/${code}`, { method: "DELETE" });
      if (res.ok) {
        onUpdate();
        setDeleteConfirm(null);
        addToast("Coupon deleted successfully!", "success");
      } else {
        addToast("Failed to delete coupon", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Network error while deleting coupon", "error");
    }
  };

  const handleSaveCategory = async (cat: any) => {
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cat),
      });
      if (res.ok) {
        onUpdate();
        addToast("Category saved successfully!", "success");
      } else {
        addToast("Failed to save category", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Network error while saving category", "error");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (res.ok) {
        onUpdate();
        setDeleteConfirm(null);
        addToast("Category deleted successfully!", "success");
      } else {
        addToast("Failed to delete category", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Network error while deleting category", "error");
    }
  };

  const handleSaveSetting = async (
    key: string,
    value: string,
    silent: boolean = false,
  ) => {
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (res.ok) {
        onUpdate();
        if (!silent) addToast("Setting saved successfully!", "success");
      } else {
        if (!silent) addToast("Failed to save setting", "error");
      }
    } catch (err) {
      console.error(err);
      if (!silent) addToast("Network error while saving setting", "error");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#121212] overflow-y-auto">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 shrink-0">
              <Settings className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-widest italic">
                Admin Panel
              </h1>
              <p className="text-white/40 text-[10px] sm:text-xs uppercase tracking-widest">
                Manage your store content
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="mc-button mc-button-red px-6 py-3 font-bold uppercase tracking-widest text-xs sm:text-sm flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <X size={18} /> Exit Admin
          </button>
        </div>

        <div className="flex overflow-x-auto pb-4 sm:pb-0 sm:flex-wrap gap-3 sm:gap-4 mb-8 no-scrollbar">
          {[
            { id: "products", label: "Ranks", icon: Crown },
            { id: "categories", label: "Categories", icon: Tag },
            { id: "coupons", label: "Coupons", icon: Ticket },
            { id: "settings", label: "Settings", icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-3 px-5 sm:px-6 py-3 sm:py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] sm:text-xs transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              <tab.icon size={16} className="sm:size-[18px]" />
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "products" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold uppercase tracking-widest">
                  Manage Ranks
                </h2>
                <button
                  onClick={() =>
                    setEditingProduct({
                      id: `rank_${Date.now()}`,
                      name: "New Rank",
                      price: 0,
                      category: categories[0]?.name || "",
                      command: "",
                      description: "",
                      perks: [],
                      commands: [],
                      image: EVOPIXEL_IMAGE,
                      sort_order: products.length,
                    })
                  }
                  className="mc-button mc-button-green px-4 py-2 text-xs flex items-center gap-2"
                >
                  <Plus size={16} /> Add Rank
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white/5 border border-white/5 p-4 sm:p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                  >
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-black/40 rounded-xl flex items-center justify-center border border-white/5 shrink-0 overflow-hidden">
                        <img
                          src={p.image || EVOPIXEL_IMAGE}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-bold text-base sm:text-lg">
                          {p.name}
                        </h3>
                        <p className="text-blue-400 font-bold text-sm sm:text-base">
                          Rp {p.price.toLocaleString()}
                        </p>
                        <p className="text-white/40 text-[9px] sm:text-[10px] uppercase tracking-widest mt-1">
                          {p.category}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity w-full sm:w-auto justify-end border-t border-white/5 pt-4 sm:border-t-0 sm:pt-0">
                      <button
                        onClick={() => setEditingProduct(p)}
                        className="mc-button mc-button-blue p-2.5 sm:p-3"
                      >
                        <Edit size={16} className="sm:size-[18px]" />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteConfirm({
                            id: p.id,
                            type: "product",
                            name: p.name,
                          })
                        }
                        className="mc-button mc-button-red p-2.5 sm:p-3"
                      >
                        <Trash2 size={16} className="sm:size-[18px]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "categories" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <h2 className="text-xl font-bold uppercase tracking-widest mb-6">
                Manage Categories
              </h2>
              <div className="bg-white/5 border border-white/5 p-4 sm:p-6 rounded-2xl mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Category Name"
                    className="flex-grow bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (!newCategoryName) return;
                        const id = editingCategory
                          ? editingCategory.id
                          : newCategoryName.toLowerCase().replace(/\s+/g, "_");
                        handleSaveCategory({ id, name: newCategoryName });
                        setNewCategoryName("");
                        setEditingCategory(null);
                      }}
                      className="mc-button mc-button-green px-6 py-3 font-bold uppercase tracking-widest text-xs whitespace-nowrap flex-grow sm:flex-grow-0"
                    >
                      {editingCategory ? "Update Category" : "Add Category"}
                    </button>
                    {editingCategory && (
                      <button
                        onClick={() => {
                          setNewCategoryName("");
                          setEditingCategory(null);
                        }}
                        className="mc-button mc-button-red px-6 py-3 font-bold uppercase tracking-widest text-xs whitespace-nowrap"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="bg-white/5 border border-white/5 p-4 rounded-xl flex items-center justify-between group"
                  >
                    <span className="font-bold uppercase tracking-widest text-xs sm:text-sm">
                      {cat.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingCategory(cat);
                          setNewCategoryName(cat.name);
                        }}
                        className="w-10 h-10 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center transition-all border border-blue-500/20"
                        title="Edit Category"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteConfirm({
                            id: cat.id,
                            type: "category",
                            name: cat.name,
                          })
                        }
                        className="w-10 h-10 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg flex items-center justify-center transition-all border border-red-500/20"
                        title="Delete Category"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "coupons" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <h2 className="text-xl font-bold uppercase tracking-widest mb-6">
                Manage Coupons
              </h2>

              {/* Banner Settings */}
              <div className="bg-white/5 border border-white/5 p-4 sm:p-6 rounded-2xl mb-8">
                <h3 className="font-bold mb-4 uppercase tracking-widest text-[10px] text-white/40">
                  Coupon Banner Settings
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">
                        Banner Text
                      </label>
                      <input
                        id="banner-text"
                        defaultValue={
                          settings.coupon_banner_text ||
                          "Ramadan Sale 50% Discount! Use coupon code →"
                        }
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        id="banner-show"
                        type="checkbox"
                        defaultChecked={settings.show_coupon_banner === "true"}
                        className="w-5 h-5 accent-blue-500"
                      />
                      <label className="text-xs sm:text-sm font-bold uppercase tracking-widest">
                        Show Banner
                      </label>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      const text = (
                        document.getElementById(
                          "banner-text",
                        ) as HTMLInputElement
                      ).value;
                      const show = (
                        document.getElementById(
                          "banner-show",
                        ) as HTMLInputElement
                      ).checked;
                      setLoading(true);
                      try {
                        await handleSaveSetting(
                          "coupon_banner_text",
                          text,
                          true,
                        );
                        await handleSaveSetting(
                          "show_coupon_banner",
                          show ? "true" : "false",
                          true,
                        );
                        addToast("Setting saved successfully!", "success");
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="mc-button mc-button-blue py-4 font-bold uppercase tracking-widest text-xs h-fit"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      "Save Banner Settings"
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/5 border border-white/5 p-4 sm:p-6 rounded-2xl h-fit">
                  <h3 className="font-bold mb-4 uppercase tracking-widest text-[10px] text-white/40">
                    Add / Update Coupon
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">
                        Coupon Code
                      </label>
                      <input
                        value={newCoupon.code}
                        onChange={(e) =>
                          setNewCoupon({
                            ...newCoupon,
                            code: e.target.value.toUpperCase(),
                          })
                        }
                        placeholder="RAMADAN"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">
                        Discount Amount (Rp)
                      </label>
                      <input
                        type="number"
                        value={newCoupon.discount || ""}
                        onChange={(e) =>
                          setNewCoupon({
                            ...newCoupon,
                            discount: parseInt(e.target.value) || 0,
                          })
                        }
                        placeholder="2000"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={newCoupon.active}
                        onChange={(e) =>
                          setNewCoupon({
                            ...newCoupon,
                            active: e.target.checked,
                          })
                        }
                        className="w-5 h-5 accent-blue-500"
                      />
                      <label className="text-xs sm:text-sm font-bold uppercase tracking-widest">
                        Active
                      </label>
                    </div>
                    <button
                      onClick={() => {
                        if (!newCoupon.code || newCoupon.discount <= 0) {
                          addToast(
                            "Please enter a valid code and discount",
                            "error",
                          );
                          return;
                        }
                        handleSaveCoupon(newCoupon);
                        setNewCoupon({ code: "", discount: 0, active: true });
                        addToast(`Coupon ${newCoupon.code} saved!`, "success");
                      }}
                      className="w-full mc-button mc-button-green py-4 font-bold uppercase tracking-widest text-xs"
                    >
                      Save Coupon
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {coupons.map((cp) => (
                    <div
                      key={cp.code}
                      className="bg-white/5 border border-white/5 p-4 sm:p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-black text-lg sm:text-xl tracking-widest text-blue-400">
                            {cp.code}
                          </span>
                        </div>
                        <p className="text-white/40 text-[10px] sm:text-xs font-bold">
                          Discount: Rp {cp.discount.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={() =>
                            handleSaveCoupon({ ...cp, active: !cp.active })
                          }
                          className={`mc-button p-2.5 sm:p-3 flex-grow sm:flex-grow-0 flex justify-center ${cp.active ? "mc-button-green" : "mc-button-red"}`}
                          title={
                            cp.active
                              ? "Active (Click to Deactivate)"
                              : "Inactive (Click to Activate)"
                          }
                        >
                          {cp.active ? <Check size={18} /> : <X size={18} />}
                        </button>
                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              id: cp.code,
                              type: "coupon",
                              name: cp.code,
                            })
                          }
                          className="mc-button mc-button-red p-2.5 sm:p-3 flex-grow sm:flex-grow-0 flex justify-center"
                          title="Delete Coupon"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "settings" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold uppercase tracking-widest">
                    Store Settings
                  </h2>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mt-1">
                    Customize your store labels and images
                  </p>
                </div>
              </div>

              {/* Text Labels Section */}
              <div className="bg-white/5 border border-white/5 p-4 sm:p-6 rounded-2xl mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <h3 className="font-bold uppercase tracking-widest text-[10px] text-white/40">
                    Info Modal Labels
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">
                      Apply to
                    </span>
                    <select
                      value={labelSettingsCategory}
                      onChange={(e) => setLabelSettingsCategory(e.target.value)}
                      className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                    >
                      <option value="__global">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">
                      Perks Label
                    </label>
                    <div className="relative">
                      <input
                        key={`label-perks-${labelSettingsCategory}`}
                        id="label-perks"
                        defaultValue={getLabelSettingValue(
                          "label_perks",
                          "PERKS",
                        )}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors text-sm pr-10"
                      />
                      <button
                        onClick={() => {
                          const el = document.getElementById(
                            "label-perks",
                          ) as HTMLInputElement;
                          el.value = "";
                          handleSaveSetting(
                            getLabelSettingKey("label_perks"),
                            "",
                            false,
                          );
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 hover:text-red-300"
                        title="Hide this section"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className="text-[9px] text-white/20 mt-1">
                      Clear to hide Perks section
                    </p>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">
                      Commands Label
                    </label>
                    <div className="relative">
                      <input
                        key={`label-commands-${labelSettingsCategory}`}
                        id="label-commands"
                        defaultValue={getLabelSettingValue(
                          "label_commands",
                          "COMMANDS",
                        )}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors text-sm pr-10"
                      />
                      <button
                        onClick={() => {
                          const el = document.getElementById(
                            "label-commands",
                          ) as HTMLInputElement;
                          el.value = "";
                          handleSaveSetting(
                            getLabelSettingKey("label_commands"),
                            "",
                            false,
                          );
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 hover:text-red-300"
                        title="Hide this section"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className="text-[9px] text-white/20 mt-1">
                      Clear to hide Commands section
                    </p>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">
                      Description Label (Coins)
                    </label>
                    <div className="relative">
                      <input
                        key={`label-description-${labelSettingsCategory}`}
                        id="label-description"
                        defaultValue={getLabelSettingValue(
                          "label_description",
                          "DESCRIPTION",
                        )}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors text-sm pr-10"
                      />
                      <button
                        onClick={() => {
                          const el = document.getElementById(
                            "label-description",
                          ) as HTMLInputElement;
                          el.value = "";
                          handleSaveSetting(
                            getLabelSettingKey("label_description"),
                            "",
                            false,
                          );
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 hover:text-red-300"
                        title="Hide this section"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className="text-[9px] text-white/20 mt-1">
                      Clear to hide Description section
                    </p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    const perks = (
                      document.getElementById("label-perks") as HTMLInputElement
                    ).value;
                    const commands = (
                      document.getElementById(
                        "label-commands",
                      ) as HTMLInputElement
                    ).value;
                    const desc = (
                      document.getElementById(
                        "label-description",
                      ) as HTMLInputElement
                    ).value;
                    setLoading(true);
                    try {
                      await handleSaveSetting(
                        getLabelSettingKey("label_perks"),
                        perks,
                        true,
                      );
                      await handleSaveSetting(
                        getLabelSettingKey("label_commands"),
                        commands,
                        true,
                      );
                      await handleSaveSetting(
                        getLabelSettingKey("label_description"),
                        desc,
                        true,
                      );
                      addToast("Labels saved successfully!", "success");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="mc-button mc-button-blue py-4 px-8 font-bold uppercase tracking-widest text-xs mt-6"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    "Save Labels"
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  {
                    key: "hero_background",
                    label: "Hero Background Image (Banner)",
                    aspect: 16 / 9,
                  },
                  {
                    key: "welcome_logo",
                    label: "Welcome Logo (Next to EVOPIXEL STORE Text)",
                    aspect: 16 / 9,
                  },
                  {
                    key: "checkout_confirm_image",
                    label: "Checkout Confirmation Image",
                    aspect: 1 / 1,
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="bg-white/5 border border-white/5 p-4 sm:p-6 rounded-2xl"
                  >
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-4">
                      {item.label}
                    </label>
                    <div
                      className="bg-black/40 rounded-xl mb-4 overflow-hidden border border-white/5 flex items-center justify-center group relative cursor-pointer"
                      style={{ aspectRatio: item.aspect }}
                    >
                      <img
                        src={settings[item.key] || EVOPIXEL_IMAGE}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                          <Camera size={16} /> Change Image
                        </div>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) =>
                          handleFileSelect(e, item.aspect, (base64) =>
                            handleSaveSetting(item.key, base64),
                          )
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {croppingImage && (
          <ImageCropperModal
            image={croppingImage.src}
            aspect={croppingImage.aspect}
            onCancel={() => setCroppingImage(null)}
            onComplete={croppingImage.onComplete}
          />
        )}

        {/* Edit Product Modal */}
        {editingProduct && (
          <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#1a1a1a] border border-white/10 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            >
              <div className="p-4 sm:p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                <h3 className="font-bold uppercase tracking-widest text-sm sm:text-base">
                  Edit Rank: {editingProduct.name}
                </h3>
                <button
                  onClick={() => setEditingProduct(null)}
                  className="text-white/40 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>
              <form
                onSubmit={handleSaveProduct}
                className="p-4 sm:p-6 space-y-6 overflow-y-auto"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">
                      Rank Name
                    </label>
                    <input
                      value={editingProduct.name}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          name: e.target.value,
                        })
                      }
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">
                      Price (Rp)
                    </label>
                    <input
                      type="number"
                      value={editingProduct.price ?? ""}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          price: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors text-sm"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40">
                      Rank Image (Square)
                    </label>
                    <span className="text-[9px] text-blue-400 font-bold uppercase tracking-widest">
                      Recommended: 500x500px
                    </span>
                  </div>
                  <div className="flex items-center gap-6 bg-black/20 p-4 rounded-2xl border border-white/5">
                    <div className="w-24 h-24 bg-black/40 rounded-xl overflow-hidden border border-white/10 shrink-0 flex items-center justify-center relative group shadow-2xl">
                      <img
                        src={editingProduct.image || EVOPIXEL_IMAGE}
                        alt="Rank"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-grow space-y-3">
                      <p className="text-[10px] text-white/40 leading-relaxed">
                        This image will appear in the store above the "Add to
                        Cart" button for this specific rank.
                      </p>
                      <div className="flex gap-2">
                        <label className="mc-button mc-button-blue py-2.5 px-4 text-[10px] uppercase font-bold tracking-widest inline-flex items-center gap-2 cursor-pointer">
                          <Upload size={14} /> Upload New
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              handleFileSelect(e, 1, (base64) =>
                                setEditingProduct({
                                  ...editingProduct,
                                  image: base64,
                                }),
                              )
                            }
                          />
                        </label>
                        {/* Remove button removed as per request */}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">
                    Category
                  </label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        category: e.target.value,
                      })
                    }
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">
                    RCON Command (use {"{username}"})
                  </label>
                  <input
                    value={editingProduct.command}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        command: e.target.value,
                      })
                    }
                    placeholder="lp user {username} parent add gold"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                {editingProduct.category?.toLowerCase().includes("coin") ? (
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">
                      {settings.label_description || "Description"}
                    </label>
                    <textarea
                      value={editingProduct.description || ""}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          description: e.target.value,
                        })
                      }
                      rows={4}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">
                        Perks (one per line)
                      </label>
                      <textarea
                        value={editingProduct.perks?.join("\n")}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            perks: e.target.value
                              .split("\n")
                              .filter((s) => s.trim()),
                          })
                        }
                        rows={4}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>

                    {!editingProduct.category
                      ?.toLowerCase()
                      .includes("survival") && (
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">
                          Commands (one per line)
                        </label>
                        <textarea
                          value={editingProduct.commands?.join("\n")}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              commands: e.target.value
                                .split("\n")
                                .filter((s) => s.trim()),
                            })
                          }
                          rows={4}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>
                    )}
                  </>
                )}

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-grow mc-button mc-button-green py-4 font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Save size={20} />
                    )}
                    Save Rank
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="px-8 mc-button py-4 font-bold uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#1a1a1a] border border-white/10 w-full max-w-md rounded-2xl p-6 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="text-red-500" size={32} />
              </div>
              <h3 className="text-xl font-bold uppercase tracking-widest mb-2">
                Are you sure?
              </h3>
              <p className="text-white/60 text-sm mb-8">
                You are about to delete{" "}
                <span className="text-white font-bold">
                  {deleteConfirm.name}
                </span>
                .
                {deleteConfirm.type === "category"
                  ? " This will not delete products in this category but they might not show up."
                  : " This action cannot be undone."}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="mc-button px-6 py-3 font-bold uppercase tracking-widest text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (deleteConfirm.type === "product") {
                      handleDeleteProduct(deleteConfirm.id);
                    } else if (deleteConfirm.type === "category") {
                      handleDeleteCategory(deleteConfirm.id);
                    } else {
                      handleDeleteCoupon(deleteConfirm.id);
                    }
                  }}
                  className="mc-button mc-button-red px-6 py-3 font-bold uppercase tracking-widest text-xs"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
