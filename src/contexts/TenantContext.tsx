import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';

interface Company {
  id: string;
  name: string;
  slug: string;
  business_type?: string;
  logo: string | null;
  theme_color: string;
  phone: string | null;
  address: string | null;
  email: string;
}

interface TenantContextType {
  company: Company | null;
  loading: boolean;
  error: string | null;
  setCompanyBySlug: (slug: string) => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyTheme = (color: string) => {
    document.documentElement.style.setProperty('--primary-theme-color', color);
  };

  useEffect(() => {
    const initTenant = async () => {
      const hostname = window.location.hostname;
      let detectedSlug = '';

      // 1. If hostname looks like an IP address (e.g. 127.0.0.1)
      if (/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname)) {
        detectedSlug = hostname;
      }
      
      // 2. If hostname is a subdomain of localhost (e.g. apple.localhost)
      const parts = hostname.split('.');
      if (!detectedSlug && parts.length > 1 && parts[parts.length - 1] === 'localhost') {
        const subdomain = parts[0];
        if (subdomain !== 'www' && subdomain !== 'localhost') {
           detectedSlug = subdomain;
        }
      }

      if (detectedSlug) {
        await setCompanyBySlug(detectedSlug);
      } else {
        // 3. Fallback: Fetch the first active company if nothing detected
        try {
          const response = await axiosInstance.get('/account/companies/');
          if (response.data.results && response.data.results.length > 0) {
            const firstCompany = response.data.results[0];
            setCompany(firstCompany);
            applyTheme(firstCompany.theme_color || '#3b82f6');
            localStorage.setItem('current_company_slug', firstCompany.slug);
          }
        } catch (err) {
          console.error('Failed to fetch fallback company', err);
        }
      }
    };
    initTenant();
  }, []);

  const setCompanyBySlug = async (slug: string) => {
    if (company?.slug === slug) return;
    
    setLoading(true);
    setError(null);
    try {
      // Store slug for axios interceptor
      localStorage.setItem('current_company_slug', slug);
      
      const response = await axiosInstance.get(`/account/companies/${slug}/`);
      const data = response.data;
      setCompany(data);
      applyTheme(data.theme_color || '#3b82f6');
    } catch (err: any) {
      console.error('Failed to fetch company info', err);
      setError('Company not found or inactive');
      setCompany(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TenantContext.Provider value={{ company, loading, error, setCompanyBySlug }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
