import { Link } from "react-router-dom";
import { Mail, Clock, MapPin, Phone } from "lucide-react";
import { useRef } from "react";
import { useGSAPReveal } from "@/hooks/useGSAP";
import { useStore } from "@/frontend/context/StoreContext";

export const Footer = () => {
  const { company } = useStore();
  const footerRef = useRef<HTMLElement>(null);
  
  useGSAPReveal(footerRef, ".gsap-reveal", { opacity: 0, y: 30, duration: 0.8, stagger: 0.1 });

  const storeLocations = [
    { name: "Jawalakhel", address: "Norkhang Complex | Next to Standard Chartered Bank", phone: "9801200105" },
    { name: "Maitighar", address: "D&D Complex | Opposite To St. Xaviers College", phone: "9801200104" },
    { name: "New Road", address: "Sasa Complex | Opposite To NMB Bank", phone: "9801200106" },
    { name: "Putalisadak", address: "IT Plaza | Opposite To Kathmandu Plaza", phone: "9801200108" },
    { name: "Pokhara", address: "Courtyard at Nadipur", phone: "9801200103" },
    { name: "Lazimpat", address: "Opposite of Trisara", phone: "9801200102" },
  ];

  return (
    <footer ref={footerRef} className="bg-card border-t border-border text-muted-foreground mt-16 sm:mt-24">
      <div className="neo-container py-10 sm:py-16">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1 gsap-reveal">
            <div className="text-3xl sm:text-4xl font-display font-bold tracking-tighter text-foreground mb-4">{company ? company.name : 'algoflow-e'}</div>
            <div className="space-y-3 text-sm sm:text-base">
              <div className="flex items-center gap-2">
                <Mail size={14} className="shrink-0" />
                <span>{company?.email || 'contact@algoflow-e.com'}</span>
              </div>
              {company?.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={14} className="shrink-0" />
                  <span>{company.phone}</span>
                </div>
              )}
              {company?.address ? (
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="shrink-0" />
                  <span>{company.address}</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="shrink-0" />
                    <span>Sun - Fri: 10AM - 7:30PM</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="shrink-0" />
                    <span>Saturday: 11AM - 6PM</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Information */}
          <div className="gsap-reveal">
            <h3 className="text-sm sm:text-base font-semibold uppercase tracking-wider text-foreground mb-3 sm:mb-4">Information</h3>
            <ul className="space-y-3 text-sm sm:text-base">
              <li><Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
              <li><Link to="/about" className="hover:text-foreground transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-foreground transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Policies */}
          <div className="gsap-reveal">
            <h3 className="text-sm sm:text-base font-semibold uppercase tracking-wider text-foreground mb-3 sm:mb-4">Policies</h3>
            <ul className="space-y-3 text-sm sm:text-base">
              <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link to="/return-policy" className="hover:text-foreground transition-colors">Return Policy</Link></li>
              <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms & Conditions</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="gsap-reveal">
            <h3 className="text-sm sm:text-base font-semibold uppercase tracking-wider text-foreground mb-3 sm:mb-4">Customer Service</h3>
            <ul className="space-y-3 text-sm sm:text-base">
              <li><Link to="/store-locations" className="hover:text-foreground transition-colors">Store Locations</Link></li>
              <li><Link to="/service-center" className="hover:text-foreground transition-colors">Service Center</Link></li>
              <li><Link to="/track-orders" className="hover:text-foreground transition-colors">Track Orders</Link></li>
            </ul>
          </div>
        </div>

        {/* Store Locations - only show if no specific company context */}
        {!company && (
          <div className="mt-10 sm:mt-16 pt-6 sm:pt-8 border-t border-border gsap-reveal">
            <h3 className="text-sm sm:text-base font-semibold uppercase tracking-wider text-foreground mb-4 sm:mb-6 text-center">Our Store Locations</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
              {storeLocations.map(loc => (
                <div key={loc.name} className="text-xs sm:text-sm space-y-1.5 bg-muted/50 rounded-xl p-4">
                  <p className="font-semibold text-foreground">{loc.name}</p>
                  <p className="text-muted-foreground leading-relaxed">{loc.address}</p>
                  <p className="flex items-center gap-1.5 text-muted-foreground mt-2">
                    <Phone size={12} /> {loc.phone}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 sm:mt-12 pt-4 sm:pt-6 border-t border-border text-center text-xs sm:text-sm text-muted-foreground/60 gsap-reveal">
          © {new Date().getFullYear()} {company ? company.name : 'algoflow-e'} – All Rights Reserved
        </div>
      </div>
    </footer>
  );
};
