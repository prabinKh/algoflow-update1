import { useRef } from "react";
import { useGSAPReveal } from "@/hooks/useGSAP";
import { Header } from "@/frontend/components/Header";
import { Footer } from "@/frontend/components/Footer";
import { MobileBottomNav } from "@/frontend/components/MobileBottomNav";
import { MapPin, Phone, Clock } from "lucide-react";

const storeLocations = [
  { name: "Jawalakhel", address: "Norkhang Complex | Next to Standard Chartered Bank", phone: "9801200105", hours: "Sun-Fri: 10AM-7:30PM" },
  { name: "Maitighar", address: "D&D Complex | Opposite To St. Xaviers College", phone: "9801200104", hours: "Sun-Fri: 10AM-7:30PM" },
  { name: "New Road", address: "Sasa Complex | Opposite To NMB Bank", phone: "9801200106", hours: "Sun-Fri: 10AM-7:30PM" },
  { name: "Putalisadak", address: "IT Plaza | Opposite To Kathmandu Plaza", phone: "9801200108", hours: "Sun-Fri: 10AM-7:30PM" },
  { name: "Pokhara", address: "Courtyard at Nadipur", phone: "9801200103", hours: "Sun-Fri: 10AM-7:30PM" },
  { name: "Lazimpat", address: "Opposite of Trisara", phone: "9801200102", hours: "Sun-Fri: 10AM-7:30PM" },
];

const StoreLocationsPage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  useGSAPReveal(containerRef, ".gsap-reveal", { opacity: 0, y: 30, duration: 0.8, stagger: 0.1 });

  return (
    <div className="min-h-screen bg-background pb-16 lg:pb-0" ref={containerRef}>
      <Header />
      <main className="neo-container py-12">
        <h1 className="text-2xl font-display font-bold mb-8 gsap-reveal">Our Store Locations</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {storeLocations.map(loc => (
            <div key={loc.name} className="p-6 bg-card border border-border rounded-lg space-y-3 gsap-reveal">
              <h2 className="font-display font-semibold text-lg">{loc.name}</h2>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="mt-0.5 shrink-0" />
                  <span>{loc.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={14} />
                  <span className="font-mono">{loc.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} />
                  <span>{loc.hours}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default StoreLocationsPage;
