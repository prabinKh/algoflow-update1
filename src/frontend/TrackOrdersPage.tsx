import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Search, Package, Truck, CheckCircle, Clock, ArrowRight, ChevronRight, MapPin, Calendar, CreditCard, ShoppingBag, Menu } from "lucide-react";
import { Header as Navbar } from "@/frontend/components/Header";
import { Footer } from "@/frontend/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { orderService } from "@/api/orderService";
import { format } from "date-fns";
import { Sidebar } from "@/admin/components/Sidebar";
import { Order } from "@/types/admin";

export default function TrackOrdersPage() {
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    const fetchUserOrders = async () => {
      if (user) {
        try {
          const orders = await orderService.getAll();
          const filteredOrders = orders
            .filter((o) => o.uid === user.id)
            .slice(0, 5);
          setUserOrders(filteredOrders);
        } catch (err) {
          console.error("Error fetching user orders:", err);
        }
      }
      setIsAuthChecking(false);
    };
    fetchUserOrders();
  }, [user, authLoading]);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) return;

    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const orders = await orderService.getAll();
      const matchingOrder = orders.find(o => o.id === orderId || o.orderId === orderId);
      
      if (!matchingOrder) {
        setError("Order not found. Please check your Order ID and try again.");
      } else {
        const orderData = matchingOrder;
        // If email is provided, verify it
        if (email && orderData.customerEmail && orderData.customerEmail.toLowerCase() !== email.toLowerCase()) {
          setError("Email does not match our records for this order.");
        } else {
          setOrder(orderData);
        }
      }
    } catch (err) {
      console.error("Error tracking order:", err);
      setError("An error occurred while tracking your order. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending": return <Clock className="text-amber-500" />;
      case "processing": return <Clock className="text-blue-500" />;
      case "shipped": return <Truck className="text-purple-500" />;
      case "delivered": return <CheckCircle className="text-emerald-500" />;
      case "cancelled": return <ArrowRight className="text-red-500 rotate-45" />;
      default: return <Package className="text-muted-foreground" />;
    }
  };

  const getStatusStep = (status: string) => {
    const steps = ["pending", "processing", "shipped", "delivered"];
    const currentStep = steps.indexOf(status.toLowerCase());
    return currentStep === -1 ? 0 : currentStep;
  };

  return (
    <div className="min-h-screen bg-muted">
      <Navbar />
      
      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="max-w-3xl mx-auto">
          <header className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl font-black text-foreground mb-4 tracking-tight">Track Your Order</h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                Enter your order ID and email address to see the current status of your delivery.
              </p>
            </motion.div>
          </header>

          {/* Tracking Form */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-card rounded-[2.5rem] p-8 shadow-xl shadow-black/5 border border-border mb-12"
          >
            <form onSubmit={handleTrack} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-2">Order ID</label>
                  <div className="relative">
                    <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input 
                      placeholder="e.g. ORD-123456"
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      className="pl-12 h-14 bg-muted border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-600 transition-all"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-2">Email Address (Optional)</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input 
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-12 h-14 bg-muted border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-600 transition-all"
                    />
                  </div>
                </div>
              </div>
              
              <Button 
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>Track Order <ArrowRight size={20} /></>
                )}
              </Button>
            </form>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-medium rounded-2xl flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <ArrowRight size={16} className="rotate-45" />
                </div>
                {error}
              </motion.div>
            )}
          </motion.div>

          {/* Order Result */}
          {order && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Status Card */}
              <div className="bg-card rounded-[2.5rem] p-8 shadow-xl shadow-black/5 border border-border overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[5rem] -mr-8 -mt-8 -z-0 opacity-50" />
                
                <div className="relative z-10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                          {getStatusIcon(order.status)}
                        </div>
                        <div>
                          <h2 className="text-2xl font-black text-foreground tracking-tight">Order #{String(order.id).slice(-6).toUpperCase()}</h2>
                          <p className="text-sm text-muted-foreground">Placed on {format(new Date(order.createdAt), "MMMM dd, yyyy")}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-left md:text-right">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Current Status</div>
                      <div className="inline-flex items-center px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm font-bold border border-blue-100">
                        {order.status.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative mb-12">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-accent -translate-y-1/2" />
                    <div 
                      className="absolute top-1/2 left-0 h-1 bg-blue-600 -translate-y-1/2 transition-all duration-1000" 
                      style={{ width: `${(getStatusStep(order.status) / 3) * 100}%` }}
                    />
                    
                    <div className="relative flex justify-between">
                      {["Pending", "Processing", "Shipped", "Delivered"].map((step, idx) => {
                        const isCompleted = idx <= getStatusStep(order.status);
                        const isCurrent = idx === getStatusStep(order.status);
                        
                        return (
                          <div key={step} className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all duration-500 ${
                              isCompleted ? "bg-blue-600 text-white scale-110 shadow-lg shadow-blue-200" : "bg-card border-2 border-border text-muted-foreground/50"
                            }`}>
                              {isCompleted ? <CheckCircle size={16} /> : <div className="w-2 h-2 bg-accent/50 rounded-full" />}
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-widest mt-3 ${
                              isCompleted ? "text-blue-600" : "text-muted-foreground"
                            }`}>
                              {step}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Order Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-border">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                          <MapPin size={12} /> Shipping Address
                        </h3>
                        <div className="text-sm text-muted-foreground leading-relaxed">
                          {order.shippingAddress?.fullName}<br />
                          {order.shippingAddress?.address}<br />
                          {order.shippingAddress?.city}, {order.shippingAddress?.zipCode}<br />
                          {order.shippingAddress?.country}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                          <Calendar size={12} /> Estimated Delivery
                        </h3>
                        <div className="text-sm font-bold text-foreground">
                          {order.status.toLowerCase() === 'delivered' 
                            ? `Delivered on ${format(new Date(order.createdAt), "MMM dd")}`
                            : `Expected by ${format(new Date(new Date(order.createdAt).getTime() + 5 * 24 * 60 * 60 * 1000), "MMMM dd, yyyy")}`
                          }
                        </div>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                          <ShoppingBag size={12} /> Order Summary
                        </h3>
                        <div className="space-y-2">
                          {order.items?.map((item, idx: number) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className="text-muted-foreground truncate mr-4">{item.quantity}x {item.name}</span>
                              <span className="font-mono font-bold text-foreground">${((item.price || 0) * (item.quantity || 0)).toLocaleString()}</span>
                            </div>
                          ))}
                          <div className="pt-2 border-t border-border flex justify-between text-base font-black text-blue-600">
                            <span>Total</span>
                            <span className="font-mono">${order.totalAmount?.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                          <CreditCard size={12} /> Payment Method
                        </h3>
                        <div className="text-sm text-muted-foreground">
                          {order.paymentMethod === 'card' ? 'Credit / Debit Card' : 'Cash on Delivery'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Recent Orders for Logged In Users */}
          {!isAuthChecking && userOrders.length > 0 && !order && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-16"
            >
              <h3 className="text-sm font-bold text-foreground mb-6 flex items-center gap-2">
                <Clock size={16} className="text-blue-600" /> Your Recent Orders
              </h3>
              <div className="space-y-4">
                {userOrders.map((userOrder) => (
                  <button
                    key={userOrder.id}
                    onClick={() => {
                      setOrderId(userOrder.id);
                      setOrder(userOrder);
                    }}
                    className="w-full bg-card p-6 rounded-3xl border border-border shadow-sm hover:border-blue-200 hover:shadow-md transition-all flex items-center justify-between group text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                        {getStatusIcon(userOrder.status)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-foreground">Order #{String(userOrder.id).slice(-6).toUpperCase()}</div>
                        <div className="text-[10px] text-muted-foreground">{format(new Date(userOrder.createdAt), "MMM dd, yyyy")} • ${ (userOrder.totalAmount || 0).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        userOrder.status === 'delivered' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {userOrder.status}
                      </div>
                      <ChevronRight size={18} className="text-muted-foreground/50 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Help Section */}
          <div className="mt-20 text-center">
            <p className="text-sm text-muted-foreground">
              Need help with your order? <Link to="/contact" className="text-blue-600 font-bold hover:underline">Contact our support team</Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
