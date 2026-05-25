import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { brandService, type Brand } from "@/api/brandService";
import { Skeleton } from "@/components/ui/skeleton";

export const BrandStrip = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    brandService.getAll().then(data => {
      setBrands(data);
      setLoading(false);
    });
  }, []);

  return (
    <section className="py-10 sm:py-16 border-t border-border/50">
      <div className="flex items-center gap-4 mb-8 sm:mb-12">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground/60 whitespace-nowrap">Authorized Partners</p>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
      </div>
      
      <div className="flex items-center justify-center gap-8 sm:gap-12 md:gap-20 flex-wrap px-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-20 rounded" />
            ))
          : brands.filter(b => b.is_active !== false).map(brand => (
              <Link
                key={brand.name}
                to={`/category/all?brand=${brand.name}`}
                className="group relative"
              >
                <div className="text-xl sm:text-2xl md:text-3xl font-display font-black text-muted-foreground/20 group-hover:text-primary/40 transition-all duration-500 cursor-pointer tracking-tighter grayscale group-hover:grayscale-0">
                  {brand.name}
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary/30 group-hover:w-full transition-all duration-500 rounded-full" />
              </Link>
            ))
        }
      </div>
    </section>
  );
};
