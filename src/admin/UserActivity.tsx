import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { userActivityService } from "@/api/userActivityService";
import { 
  Activity, 
  User, 
  Clock, 
  Eye, 
  ShoppingCart, 
  Search, 
  Home, 
  Package, 
  Filter,
  ChevronRight,
  Calendar,
  Menu,
  X,
  TrendingUp,
  PieChart as PieChartIcon,
  Users as UsersIcon,
  ArrowRight,
  Maximize2,
  Minimize2,
  ExternalLink,
  Tag,
  Layers
} from "lucide-react";
import { safeToDate } from "@/lib/utils";
import { format, startOfDay, subDays, isSameDay } from "date-fns";
import { motion, AnimatePresence } from "motion/react";
import { useGSAPReveal } from "@/hooks/useGSAP";
import { useQuery } from "@tanstack/react-query";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from "recharts";
import { useProducts } from "@/hooks/useProducts";
import { type Product } from "@/lib/types";

interface UserActivityLog {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  pageType: string;
  path: string;
  metadata: Record<string, string | undefined>;
  timestamp: string;
  duration: number;
}

interface UserSummary {
  uid: string;
  email: string;
  displayName: string;
  lastActive: Date;
  totalActivities: number;
  totalTime: number;
}

const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#6366f1"];

const UserActivity = () => {
  const { setIsSidebarOpen } = useOutletContext<{ setIsSidebarOpen: (open: boolean) => void }>();
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { data: activities = [], isLoading: loading } = useQuery({
    queryKey: ['user_activities'],
    queryFn: () => userActivityService.getAll(),
    refetchInterval: 30000,
  });

  const [selectedUserUid, setSelectedUserUid] = useState<string | null>(null);
  const [isFullPage, setIsFullPage] = useState(false);
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(null);
  const { products: allProducts } = useProducts();

  useGSAPReveal(containerRef, ".gsap-reveal", { opacity: 0, y: 20, duration: 0.6, stagger: 0.05 });

  // Process data for unique users
  const userSummaries = useMemo(() => {
    const summaries: Record<string, UserSummary> = {};
    
    activities.forEach(activity => {
      if (!summaries[activity.uid]) {
        summaries[activity.uid] = {
          uid: activity.uid,
          email: activity.email,
          displayName: activity.displayName,
          lastActive: safeToDate(activity.timestamp) || new Date(),
          totalActivities: 0,
          totalTime: 0
        };
      }
      
      summaries[activity.uid].totalActivities += 1;
      summaries[activity.uid].totalTime += activity.duration;
      
      const activityDate = safeToDate(activity.timestamp);
      if (activityDate && activityDate > summaries[activity.uid].lastActive) {
        summaries[activity.uid].lastActive = activityDate;
      }
    });
    
    return Object.values(summaries).sort((a, b) => b.lastActive.getTime() - a.lastActive.getTime());
  }, [activities]);

  // Process data for charts
  const chartData = useMemo(() => {
    // Activity over last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), i);
      return {
        date: format(date, "MMM dd"),
        count: 0,
        fullDate: date
      };
    }).reverse();

    activities.forEach(activity => {
      const activityDate = safeToDate(activity.timestamp);
      if (activityDate) {
        const dayData = last7Days.find(d => isSameDay(d.fullDate, activityDate));
        if (dayData) dayData.count += 1;
      }
    });

    // Page type distribution
    const pageTypes: Record<string, number> = {};
    activities.forEach(activity => {
      pageTypes[activity.pageType] = (pageTypes[activity.pageType] || 0) + 1;
    });

    const pieData = Object.entries(pageTypes).map(([name, value]) => ({ name, value }));

    return { last7Days, pieData };
  }, [activities]);

  const selectedUserActivities = useMemo(() => {
    if (!selectedUserUid) return [];
    return activities.filter(a => a.uid === selectedUserUid);
  }, [activities, selectedUserUid]);

  const selectedUser = useMemo(() => {
    if (!selectedUserUid) return null;
    return userSummaries.find(u => u.uid === selectedUserUid);
  }, [userSummaries, selectedUserUid]);

  const getIcon = (type: string) => {
    switch (type) {
      case "product_view": return <Package size={16} className="text-blue-600" />;
      case "category_view": return <Filter size={16} className="text-purple-600" />;
      case "checkout": return <ShoppingCart size={16} className="text-emerald-600" />;
      case "search": return <Search size={16} className="text-amber-600" />;
      case "home": return <Home size={16} className="text-indigo-600" />;
      case "compare": return <Layers size={16} className="text-cyan-600" />;
      case "wishlist": return <ShoppingCart size={16} className="text-pink-600" />;
      default: return <Eye size={16} className="text-muted-foreground" />;
    }
  };

  const getPageLabel = (activity: UserActivityLog) => {
    if (!activity.pageType) return "Unknown Page";
    if (activity.pageType === "product_view") {
      const product = allProducts.find(p => p.slug === activity.metadata?.productSlug || p.id === activity.metadata?.productSlug);
      return product ? product.name : (activity.metadata?.productName || `Product: ${activity.metadata?.productSlug || "Unknown"}`);
    }
    if (activity.pageType === "category_view") return `Category: ${activity.metadata?.categorySlug || "Unknown"}`;
    if (activity.pageType === "search") return `Search: "${activity.metadata?.query || "..."}"`;
    return activity.pageType.charAt(0).toUpperCase() + activity.pageType.slice(1).replace("_", " ");
  };

  const handleToggleProductDetails = (activityId: string) => {
    setExpandedActivityId(prev => prev === activityId ? null : activityId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium animate-pulse text-muted-foreground">Analyzing behavior patterns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen overflow-y-auto no-scrollbar pb-20 lg:pb-0" ref={containerRef}>
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Dashboard Overview - Hide in Full Page Mode */}
          {!isFullPage && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 gsap-reveal">
              <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <TrendingUp size={16} className="text-blue-600" />
                    Activity Over Time (Last 7 Days)
                  </h3>
                </div>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData.last7Days}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: "#9ca3af"}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: "#9ca3af"}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                      />
                      <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <PieChartIcon size={16} className="text-purple-600" />
                    Page Distribution
                  </h3>
                </div>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {chartData.pieData.slice(0, 4).map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-[10px] text-muted-foreground truncate">{entry.name.replace("_", " ")}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className={`grid grid-cols-1 ${isFullPage ? 'lg:grid-cols-1' : 'lg:grid-cols-12'} gap-8`}>
            {/* User List Sidebar - Hide in Full Page Mode */}
            {!isFullPage && (
              <div className="lg:col-span-4 space-y-4 gsap-reveal">
                <div className="flex items-center justify-between mb-2 px-2">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <UsersIcon size={16} className="text-muted-foreground" />
                    Active Users ({userSummaries.length})
                  </h3>
                </div>
                
                <div className="space-y-2 max-h-[600px] overflow-auto pr-2 custom-scrollbar">
                  {userSummaries.map((user) => (
                    <button
                      key={user.uid}
                      onClick={() => setSelectedUserUid(user.uid)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all ${
                        selectedUserUid === user.uid 
                          ? "bg-blue-50 border-blue-200 shadow-sm" 
                          : "bg-card border-border hover:border-border"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                          selectedUserUid === user.uid ? "bg-blue-600 text-white" : "bg-accent text-muted-foreground"
                        }`}>
                          {user.displayName ? user.displayName.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-sm text-foreground truncate">{user.displayName || "Unknown User"}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{user.email}</div>
                        </div>
                        {selectedUserUid === user.uid && (
                          <ArrowRight size={14} className="text-blue-600" />
                        )}
                      </div>
                      <div className="mt-3 flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground">Last active {format(user.lastActive, "HH:mm")}</span>
                        <span className={`font-bold ${selectedUserUid === user.uid ? "text-blue-600" : "text-muted-foreground"}`}>
                          {user.totalActivities} events
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Activity View */}
            <div className={`${isFullPage ? 'lg:col-span-1' : 'lg:col-span-8'} gsap-reveal`}>
              <AnimatePresence mode="wait">
                {selectedUser ? (
                  <motion.div
                    key={selectedUser.uid}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    {/* User Header */}
                    <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xl font-bold">
                            {selectedUser.displayName ? selectedUser.displayName.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-foreground">{selectedUser.displayName || "Unknown User"}</h2>
                            <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-muted px-4 py-2 rounded-xl">
                              <div className="text-[10px] text-muted-foreground uppercase font-bold">Total Time</div>
                              <div className="text-sm font-bold text-foreground">{Math.round(selectedUser.totalTime / 60)}m {selectedUser.totalTime % 60}s</div>
                            </div>
                            <div className="bg-muted px-4 py-2 rounded-xl">
                              <div className="text-[10px] text-muted-foreground uppercase font-bold">Events</div>
                              <div className="text-sm font-bold text-foreground">{selectedUser.totalActivities}</div>
                            </div>
                          </div>
                          <button 
                            onClick={() => setIsFullPage(!isFullPage)}
                            className="p-3 bg-accent hover:bg-accent/50 rounded-2xl text-muted-foreground transition-colors"
                            title={isFullPage ? "Exit Full Page" : "Full Page View"}
                          >
                            {isFullPage ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-2">
                        <h3 className="text-sm font-bold text-foreground">Activity Journey</h3>
                        {isFullPage && (
                          <button 
                            onClick={() => setIsFullPage(false)}
                            className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <ArrowRight size={12} className="rotate-180" /> Back to List
                          </button>
                        )}
                      </div>
                      <div className={`relative pl-8 space-y-6 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-accent ${isFullPage ? 'max-w-4xl mx-auto' : ''}`}>
                        {selectedUserActivities.map((activity, index) => (
                          <div key={activity.id} className="relative">
                            <div className={`absolute -left-[23px] top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-sm z-10 ${
                              activity.pageType === "checkout" ? "bg-emerald-500" : 
                              activity.pageType === "product_view" ? "bg-blue-500" :
                              activity.pageType === "category_view" ? "bg-purple-500" : "bg-gray-400"
                            }`} />
                            <div className="bg-card border border-border rounded-2xl p-4 shadow-sm hover:border-blue-200 transition-all group">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                                    {activity.pageType === "product_view" ? (() => {
                                      const product = allProducts.find(p => p.slug === activity.metadata?.productSlug || p.id === activity.metadata?.productSlug);
                                      return product?.image ? (
                                        <img src={product.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                      ) : <Package size={16} className="text-blue-600" />;
                                    })() : getIcon(activity.pageType)}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="text-sm font-bold text-foreground truncate">{getPageLabel(activity)}</div>
                                      <div className="flex items-center gap-2 shrink-0">
                                        {activity.pageType === "search" && activity.metadata?.query && (
                                          <Link 
                                            to={`/search?q=${encodeURIComponent(activity.metadata.query)}`}
                                            className="p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg transition-all flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider"
                                          >
                                            <ExternalLink size={12} />
                                            Try Search
                                          </Link>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate">{activity.path}</div>
                                    
                                    <div className="mt-3 flex flex-col gap-3">
                                      {activity.pageType === "product_view" && (() => {
                                        const product = allProducts.find(p => p.slug === activity.metadata?.productSlug || p.id === activity.metadata?.productSlug);
                                        const productName = product?.name || activity.metadata?.productName;
                                        const productBrand = product?.brand || activity.metadata?.productBrand;
                                        const productPrice = product?.price || Number(activity.metadata?.productPrice);
                                        const productImage = product?.image;

                                        if (!productName) return null;

                                        return (
                                          <div 
                                            onClick={() => handleToggleProductDetails(activity.id)}
                                            className={`flex items-center gap-4 p-3 rounded-2xl border transition-all cursor-pointer group/product ${
                                              expandedActivityId === activity.id 
                                                ? "bg-blue-600 border-blue-500 shadow-lg shadow-blue-500/20" 
                                                : "bg-blue-50/50 border-blue-100/50 hover:bg-blue-50 hover:border-blue-200"
                                            }`}
                                          >
                                            <div className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center p-1.5 border transition-colors ${
                                              expandedActivityId === activity.id ? "bg-white border-white" : "bg-white border-blue-100"
                                            }`}>
                                              {productImage ? (
                                                <img 
                                                  src={productImage} 
                                                  alt={productName}
                                                  className="max-w-full max-h-full object-contain rounded"
                                                  referrerPolicy="no-referrer"
                                                />
                                              ) : (
                                                <Package size={20} className="text-blue-600" />
                                              )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                              <div className={`text-[10px] font-bold uppercase tracking-tight truncate ${expandedActivityId === activity.id ? "text-blue-100" : "text-blue-600"}`}>
                                                {productBrand || "Product"}
                                              </div>
                                              <div className={`text-xs font-bold truncate ${expandedActivityId === activity.id ? "text-white" : "text-foreground"}`}>
                                                {productName}
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                              <div className={`text-sm font-bold ${expandedActivityId === activity.id ? "text-white" : "text-blue-600"}`}>
                                                ${(productPrice || 0).toLocaleString()}
                                              </div>
                                              <div className={`p-1.5 rounded-lg transition-all ${
                                                expandedActivityId === activity.id ? "bg-white/20 text-white" : "bg-blue-100 text-blue-600 group-hover/product:bg-blue-600 group-hover/product:text-white"
                                              }`}>
                                                <Eye size={14} />
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })()}

                                      <div className="flex flex-wrap gap-2">
                                        {activity.pageType === "category_view" && (
                                          <>
                                            <div className="px-2 py-1 bg-purple-50 text-purple-700 rounded-lg border border-purple-100 text-[10px] font-medium flex items-center gap-1">
                                              <Filter size={10} />
                                              Category: {activity.metadata?.categorySlug}
                                            </div>
                                            {activity.metadata?.brands && (
                                              <div className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 text-[10px] font-medium flex items-center gap-1">
                                                <Tag size={10} />
                                                Brands: {activity.metadata.brands}
                                              </div>
                                            )}
                                            {(activity.metadata?.minPrice || activity.metadata?.maxPrice) && (
                                              <div className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 text-[10px] font-medium flex items-center gap-1">
                                                <Clock size={10} />
                                                Price: {activity.metadata.minPrice || 0} - {activity.metadata.maxPrice || 'Max'}
                                              </div>
                                            )}
                                          </>
                                        )}
                                        
                                        {activity.pageType === "search" && activity.metadata?.query && (
                                          <div className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-xl border border-amber-100 text-[11px] font-bold flex items-center gap-2 w-full">
                                            <Search size={12} />
                                            Search Query: "{activity.metadata.query}"
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    {/* Product Details Dropdown */}
                                    <AnimatePresence>
                                      {expandedActivityId === activity.id && activity.pageType === "product_view" && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: "auto", opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          className="overflow-hidden"
                                        >
                                          <div className="mt-4 pt-4 border-t border-border">
                                            {(() => {
                                              const product = allProducts.find(p => p.slug === activity.metadata?.productSlug || p.id === activity.metadata?.productSlug);
                                              if (!product) return <p className="text-xs text-muted-foreground">Product details not found.</p>;
                                              return (
                                                <div className="flex flex-col md:flex-row gap-4">
                                                  <div className="w-24 h-24 bg-muted rounded-xl flex-shrink-0 flex items-center justify-center p-2">
                                                    <img 
                                                      src={product.image} 
                                                      alt={product.name}
                                                      className="max-w-full max-h-full object-contain rounded-lg"
                                                      referrerPolicy="no-referrer"
                                                    />
                                                  </div>
                                                  <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{product.brand}</span>
                                                      <span className="text-[10px] text-muted-foreground/50">•</span>
                                                      <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">{product.category}</span>
                                                    </div>
                                                    <h4 className="text-sm font-bold text-foreground mb-2">{product.name}</h4>
                                                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">{product.description}</p>
                                                    
                                                    <div className="space-y-3">
                                                      <div>
                                                        <h5 className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Specifications</h5>
                                                        <div className="flex flex-wrap gap-1.5">
                                                          {product.specs.map(spec => (
                                                            <span key={spec} className="px-2 py-0.5 bg-accent text-muted-foreground text-[9px] font-medium rounded-md">
                                                              {spec}
                                                            </span>
                                                          ))}
                                                        </div>
                                                      </div>
                                                      <div className="flex items-center justify-between pt-2">
                                                        <div className="text-sm font-mono font-bold text-blue-600">${(product.price || 0).toLocaleString()}</div>
                                                        <Link 
                                                          to={product.slug || product.id ? `/product/${product.slug || product.id}` : "#"}
                                                          className={`text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1 ${!(product.slug || product.id) ? "pointer-events-none" : ""}`}
                                                        >
                                                          Full Page <ExternalLink size={10} />
                                                        </Link>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              );
                                            })()}
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="text-xs font-bold text-foreground">{activity.duration}s</div>
                                  <div className="text-[10px] text-muted-foreground">
                                    {(() => {
                                      const date = safeToDate(activity.timestamp);
                                      return date ? format(date, "HH:mm:ss") : "Unknown";
                                    })()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                </motion.div>
              ) : (
                  <div className="h-full flex flex-col items-center justify-center bg-card border border-dashed border-border rounded-3xl p-12 text-center">
                    <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center text-muted-foreground/50 mb-4">
                      <User size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">Select a User</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
                      Choose a user from the list to view their detailed activity journey and engagement metrics.
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    );
};

export default UserActivity;
