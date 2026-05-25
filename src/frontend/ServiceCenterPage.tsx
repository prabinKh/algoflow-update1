import React, { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "motion/react";
import { 
  Laptop, Smartphone, Apple, Server, Monitor, Tv, Speaker, Tablet, Gamepad2, Home, 
  Wrench, ChevronRight, ChevronLeft, Upload, CheckCircle2, MessageSquare, 
  Smartphone as IphoneIcon, Cpu, Battery, Wind, Settings, Monitor as ScreenIcon, Keyboard,
  Camera, Mic, Video, X, Send, MapPin, CreditCard, ShieldCheck, QrCode, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { repairService } from "@/api/repairService";
import { CachedImage } from "@/components/ui/cached-image";
import { Header } from "@/frontend/components/Header";
import { Footer } from "@/frontend/components/Footer";
import { MobileBottomNav } from "@/frontend/components/MobileBottomNav";

// --- Types ---
type Category = {
  id: string;
  name: string;
  icon: React.ElementType;
  components: string[];
};

type ServiceType = "home" | "shop" | "pickup";
type ContactChannel = "whatsapp" | "instagram" | "facebook" | "chat";

interface BookingData {
  category: string;
  brand: string;
  model: string;
  serialNumber?: string;
  component: string;
  description: string;
  media: File[];
  serviceType: ServiceType;
  address?: string;
  currentLocation?: string;
  whatsappNumber?: string;
  contactChannel: ContactChannel;
}

// --- Constants ---
const CATEGORIES: Category[] = [
  { id: "laptop", name: "Laptop", icon: Laptop, components: ["Keyboard", "Screen/Display", "Logic Board", "Graphics/GPU", "Battery", "Fan/Cooling", "Ports", "Software/OS"] },
  { id: "mobile", name: "Mobile", icon: Smartphone, components: ["Screen", "Battery", "Charging Port", "Camera", "Speaker", "Motherboard", "Buttons", "Software"] },
  { id: "mac", name: "Mac", icon: Apple, components: ["Logic Board", "Screen", "Keyboard", "Trackpad", "Battery", "Ports", "Storage", "OS"] },
  { id: "iphone", name: "iPhone", icon: IphoneIcon, components: ["Screen", "Battery", "FaceID/TouchID", "Camera", "Charging Port", "Back Glass", "Speaker", "iOS"] },
  { id: "server", name: "Server", icon: Server, components: ["Power Supply", "Motherboard", "CPU", "RAM", "Storage/RAID", "Networking", "Cooling"] },
  { id: "monitor", name: "Monitor", icon: Monitor, components: ["Panel", "Power Board", "Main Board", "Backlight", "Ports", "Buttons"] },
  { id: "tv", name: "TV", icon: Tv, components: ["Display Panel", "Main Board", "Power Board", "T-Con Board", "Backlight", "Speakers", "Ports"] },
  { id: "speaker", name: "Speaker", icon: Speaker, components: ["Driver", "Amplifier", "Bluetooth/Connectivity", "Battery", "Charging Port", "Buttons"] },
  { id: "tablet", name: "Tablet", icon: Tablet, components: ["Screen", "Battery", "Charging Port", "Camera", "Motherboard", "Buttons"] },
  { id: "console", name: "Console", icon: Gamepad2, components: ["HDMI Port", "Disc Drive", "Hard Drive", "Power Supply", "Fan/Cooling", "Motherboard", "Controller"] },
  { id: "smarthome", name: "Smart Home", icon: Home, components: ["Connectivity", "Power Supply", "Sensors", "Firmware", "Physical Damage"] },
];

const BRANDS: Record<string, string[]> = {
  laptop: ["Dell", "HP", "Lenovo", "Asus", "Acer", "MSI", "Razer"],
  mobile: ["Samsung", "Google", "Xiaomi", "OnePlus", "Oppo", "Vivo"],
  mac: ["MacBook Air", "MacBook Pro", "iMac", "Mac mini", "Mac Studio"],
  iphone: ["iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15", "iPhone 14", "iPhone 13", "iPhone 12"],
  // ... other brands
};

// --- Components ---

const ServiceCenterPage: React.FC = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(0); // 0: Landing, 1-4: Wizard
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [bookingData, setBookingData] = useState<Partial<BookingData>>({
    media: [],
  });
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const handleCategoryClick = (cat: Category) => {
    setSelectedCategory(cat);
    setBookingData({ ...bookingData, category: cat.name });
    setStep(1);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const validFiles = files.filter(file => {
        const isValidType = ["video/mp4", "image/jpeg", "image/png", "audio/mpeg"].includes(file.type);
        const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB
        return isValidType && isValidSize;
      });

      if (validFiles.length !== files.length) {
        toast.error("Some files were rejected. Max size 50MB, formats: mp4, jpg, png, mp3.");
      }

      setBookingData({ ...bookingData, media: [...(bookingData.media || []), ...validFiles] });
      
      // AI Visual Diagnostics Simulation
      if (validFiles.some(f => f.type.startsWith("image/"))) {
        setAiAnalysis("Analyzing image... Detected potential screen damage. Estimated repair: $150 - $250.");
      }
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please sign in to book a repair.");
      return;
    }

    setIsSubmitting(true);
    try {
      const generatedTicketId = `FIX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      await repairService.create({
        category: bookingData.category || "",
        brand: bookingData.brand || "",
        model: bookingData.model || "",
        serialNumber: bookingData.serialNumber || "",
        component: bookingData.component || "",
        description: bookingData.description || "",
        serviceType: bookingData.serviceType || "shop",
        address: bookingData.address || "",
        currentLocation: bookingData.currentLocation || "",
        whatsappNumber: bookingData.whatsappNumber || "",
        contactChannel: bookingData.contactChannel || "chat",
        userId: user.id,
        userEmail: user.email || "",
        userName: user.name || user.email?.split('@')[0] || "Anonymous",
        status: "Received",
        ticketId: generatedTicketId,
      });

      setTicketId(generatedTicketId);
      toast.success("Repair request submitted successfully!");

      // Open the selected platform after successful submission
      const message = `Hello, I've just submitted a repair request for my ${bookingData.brand} ${bookingData.model} (${bookingData.category}). Ticket ID: ${generatedTicketId}. Problem: ${bookingData.description}`;
      const encodedMessage = encodeURIComponent(message);

      if (bookingData.contactChannel === "whatsapp") {
        window.open(`https://wa.me/1234567890?text=${encodedMessage}`, "_blank");
      } else if (bookingData.contactChannel === "instagram") {
        window.open(`https://instagram.com/fixitall_repairs`, "_blank");
      } else if (bookingData.contactChannel === "facebook") {
        window.open(`https://m.me/fixitall_repairs`, "_blank");
      } else if (bookingData.contactChannel === "chat") {
        console.log("ServiceCenterPage: Dispatching open-chat event after submission");
        const chatPayload = {
          category: bookingData.category,
          brand: bookingData.brand,
          model: bookingData.model,
          component: bookingData.component,
          description: bookingData.description,
          serviceType: bookingData.serviceType === "home" ? "Home Repair" :
                      bookingData.serviceType === "shop" ? "Shop Visit" : "Pickup & Delivery",
          ticketId: generatedTicketId
        };
        window.dispatchEvent(new CustomEvent("open-chat", { detail: chatPayload }));
        if (typeof window.openChat === 'function') {
          window.openChat(chatPayload);
        }
      }

      nextStep();
    } catch (error) {
      console.error("Failed to submit repair ticket:", error);
      toast.error("Failed to submit repair request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Step 1: Device Identification</h2>
              <p className="text-muted-foreground">Tell us about your {bookingData.category}.</p>
            </div>
            
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Brand</Label>
                <Select onValueChange={(v) => setBookingData({ ...bookingData, brand: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {(BRANDS[selectedCategory?.id || ""] || ["Other"]).map(b => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Model</Label>
                <Input 
                  placeholder="Enter Model Name" 
                  onChange={(e) => setBookingData({ ...bookingData, model: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Serial Number (Optional)</Label>
                <Input 
                  placeholder="S/N" 
                  onChange={(e) => setBookingData({ ...bookingData, serialNumber: e.target.value })}
                />
              </div>
            </div>
            
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(0)}>Back</Button>
              <Button onClick={nextStep} disabled={!bookingData.brand || !bookingData.model}>Next</Button>
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Step 2: Problem Diagnosis</h2>
              <p className="text-muted-foreground">What's wrong with your device?</p>
            </div>
            
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Component</Label>
                <Select onValueChange={(v) => setBookingData({ ...bookingData, component: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Component" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCategory?.components.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  placeholder="Describe the issue in detail..." 
                  onChange={(e) => setBookingData({ ...bookingData, description: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Upload Media (Photos/Videos/Audio)</Label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-accent cursor-pointer relative">
                  <Input 
                    type="file" 
                    multiple 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={handleFileChange}
                  />
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">Click or drag to upload (Max 50MB)</p>
                </div>
                {bookingData.media && bookingData.media.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {bookingData.media.map((f, i) => (
                      <Badge key={i} variant="secondary">{f.name}</Badge>
                    ))}
                  </div>
                )}
                {aiAnalysis && (
                  <div className="mt-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Cpu className="h-4 w-4" /> AI Diagnostics Suggestion:
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">{aiAnalysis}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={prevStep}>Back</Button>
              <Button onClick={nextStep} disabled={!bookingData.component || !bookingData.description}>Next</Button>
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Step 3: Service Type</h2>
              <p className="text-muted-foreground">How would you like to get it repaired?</p>
            </div>
            
            <div className="grid gap-4">
              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-all ${bookingData.serviceType === "home" ? "border-primary bg-primary/5" : "hover:bg-accent"}`}
                onClick={() => setBookingData({ ...bookingData, serviceType: "home" })}
              >
                <div className="flex items-center gap-4">
                  <Home className="h-6 w-6" />
                  <div>
                    <p className="font-bold">Home Repair</p>
                    <p className="text-sm text-muted-foreground">Technician visits your location</p>
                  </div>
                </div>
              </div>
              
              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-all ${bookingData.serviceType === "shop" ? "border-primary bg-primary/5" : "hover:bg-accent"}`}
                onClick={() => setBookingData({ ...bookingData, serviceType: "shop" })}
              >
                <div className="flex items-center gap-4">
                  <ScreenIcon className="h-6 w-6" />
                  <div>
                    <p className="font-bold">Shop Visit</p>
                    <p className="text-sm text-muted-foreground">Visit our nearest service center</p>
                  </div>
                </div>
              </div>
              
              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-all ${bookingData.serviceType === "pickup" ? "border-primary bg-primary/5" : "hover:bg-accent"}`}
                onClick={() => setBookingData({ ...bookingData, serviceType: "pickup" })}
              >
                <div className="flex items-center gap-4">
                  <Wrench className="h-6 w-6" />
                  <div>
                    <p className="font-bold">Pickup & Delivery</p>
                    <p className="text-sm text-muted-foreground">We collect and return your device</p>
                  </div>
                </div>
              </div>

              {bookingData.serviceType === "home" && (
                <div className="space-y-2 mt-4">
                  <Label>Your Address</Label>
                  <Input 
                    placeholder="Enter full address for technician" 
                    onChange={(e) => setBookingData({ ...bookingData, address: e.target.value })}
                  />
                </div>
              )}
            </div>
            
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={prevStep}>Back</Button>
              <Button onClick={nextStep} disabled={!bookingData.serviceType}>Next</Button>
            </div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Step 4: Contact Preference</h2>
              <p className="text-muted-foreground">How should we reach you?</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant={bookingData.contactChannel === "whatsapp" ? "default" : "outline"}
                className="h-24 flex-col gap-2"
                onClick={() => setBookingData({ ...bookingData, contactChannel: "whatsapp" })}
              >
                <MessageSquare className="h-6 w-6" />
                WhatsApp
              </Button>
              <Button 
                variant={bookingData.contactChannel === "instagram" ? "default" : "outline"}
                className="h-24 flex-col gap-2"
                onClick={() => setBookingData({ ...bookingData, contactChannel: "instagram" })}
              >
                <Camera className="h-6 w-6" />
                Instagram
              </Button>
              <Button 
                variant={bookingData.contactChannel === "facebook" ? "default" : "outline"}
                className="h-24 flex-col gap-2"
                onClick={() => setBookingData({ ...bookingData, contactChannel: "facebook" })}
              >
                <Video className="h-6 w-6" />
                Messenger
              </Button>
              <Button 
                variant={bookingData.contactChannel === "chat" ? "default" : "outline"}
                className="h-24 flex-col gap-2"
                onClick={() => setBookingData({ ...bookingData, contactChannel: "chat" })}
              >
                <Mic className="h-6 w-6" />
                Live Chat
              </Button>
            </div>

            <div className="space-y-4 mt-6 p-4 bg-accent/30 rounded-xl border border-border/50">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" /> Current Location
                </Label>
                <Input 
                  placeholder="Enter your current city/area" 
                  value={bookingData.currentLocation || ""}
                  onChange={(e) => setBookingData({ ...bookingData, currentLocation: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" /> Real WhatsApp Number
                </Label>
                <Input 
                  placeholder="+1 234 567 890" 
                  type="tel"
                  value={bookingData.whatsappNumber || ""}
                  onChange={(e) => setBookingData({ ...bookingData, whatsappNumber: e.target.value })}
                />
              </div>
            </div>
            
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={prevStep}>Back</Button>
              <Button 
                onClick={handleSubmit} 
                disabled={!bookingData.contactChannel || !bookingData.currentLocation || !bookingData.whatsappNumber || isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Repair Request"}
              </Button>
            </div>
          </motion.div>
        );
      case 5:
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="text-center space-y-6 py-12"
          >
            <div className="flex justify-center">
              <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold">Request Received!</h2>
              <p className="text-muted-foreground">Your repair ticket has been generated.</p>
            </div>
            
            <div className="bg-accent p-6 rounded-xl border border-border inline-block">
              <p className="text-sm uppercase tracking-widest text-muted-foreground mb-1">Ticket ID</p>
              <p className="text-3xl font-mono font-bold">{ticketId}</p>
            </div>
            
            <div className="flex flex-col gap-4 max-w-xs mx-auto">
              <Button onClick={() => window.location.href = "/"}>Return to Home</Button>
              <Button variant="outline" onClick={() => setStep(0)}>New Repair</Button>
            </div>
            
            <p className="text-sm text-muted-foreground">
              A technician will contact you via {bookingData.contactChannel} shortly.
            </p>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16 lg:pb-0">
      <Helmet>
        <title>Professional Electronics Repair | FixItAll Service Center</title>
        <meta name="description" content="Expert repair services for laptops, smartphones, tablets, and more. Professional diagnosis, genuine parts, and fast turnaround at FixItAll Service Center." />
        <meta name="keywords" content="laptop repair, mobile repair, smartphone repair, tablet repair, screen replacement, battery replacement, FixItAll service center, electronics repair" />
        <link rel="canonical" href={window.location.href} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:title" content="Professional Electronics Repair | FixItAll Service Center" />
        <meta property="og:description" content="Expert repair services for laptops, smartphones, tablets, and more. Professional diagnosis and fast turnaround." />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="website" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Professional Electronics Repair | FixItAll Service Center" />
        <meta name="twitter:description" content="Expert repair services for laptops, smartphones, tablets, and more." />

        {/* Structured Data (JSON-LD) */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "serviceType": "Electronics Repair",
            "provider": {
              "@type": "LocalBusiness",
              "name": "FixItAll Service Center",
              "image": "https://picsum.photos/seed/repair/800/600",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "123 Tech Lane",
                "addressLocality": "Silicon Valley",
                "addressRegion": "CA",
                "postalCode": "94025",
                "addressCountry": "US"
              },
              "telephone": "+1-555-0123",
              "priceRange": "$$"
            },
            "areaServed": {
              "@type": "Country",
              "name": "US"
            },
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "Repair Services",
              "itemListElement": CATEGORIES.map(cat => ({
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": `${cat.name} Repair`,
                  "description": `Professional repair services for ${cat.name} including ${cat.components.join(", ")}.`
                }
              }))
            }
          })}
        </script>
      </Helmet>
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        {step === 0 ? (
          <div className="space-y-12">
            <div className="text-center space-y-4">
              <Badge variant="outline" className="px-4 py-1 text-sm font-medium border-primary/20 text-primary">
                FixItAll Intelligence Engine
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                Professional Repair <span className="text-primary">Services</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Select your device category below to start your professional diagnosis and repair journey.
              </p>
              <div className="flex justify-center pt-4">
                <Button size="lg" className="rounded-full px-8" onClick={() => setStep(1)}>
                  <Wrench className="mr-2 h-5 w-5" /> Repair Now
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {CATEGORIES.map((cat) => (
                <motion.div
                  key={cat.id}
                  whileHover={{ y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCategoryClick(cat)}
                  className="group cursor-pointer"
                >
                  <Card className="h-full border-border/50 hover:border-primary/50 transition-colors bg-card/50 backdrop-blur-sm">
                    <CardHeader className="items-center text-center pb-2">
                      <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <cat.icon className="h-8 w-8" />
                      </div>
                      <CardTitle className="mt-4">{cat.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center text-sm text-muted-foreground">
                      {cat.components.slice(0, 3).join(", ")}...
                    </CardContent>
                    <CardFooter className="justify-center pt-0">
                      <ChevronRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <div className="flex justify-between text-sm mb-2">
                <span>Step {step} of 4</span>
                <span>{Math.round((step / 4) * 100)}% Complete</span>
              </div>
              <Progress value={(step / 4) * 100} className="h-2" />
            </div>
            
            <Card className="shadow-xl border-border/50">
              <CardContent className="pt-6">
                <AnimatePresence mode="wait">
                  {renderStep()}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default ServiceCenterPage;
