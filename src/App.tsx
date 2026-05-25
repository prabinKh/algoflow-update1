/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HelmetProvider, Helmet } from "react-helmet-async";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Index from "./frontend/Index";
import CategoryPage from "./frontend/CategoryPage";
import ProductDetailPage from "./frontend/ProductDetailPage";
import CheckoutPage from "./frontend/CheckoutPage";
import ComparePage from "./frontend/ComparePage";
import SearchPage from "./frontend/SearchPage";
import SignInPage from "./login/SignInPage";
import SignUpPage from "./login/SignUpPage";
import StoreLocationsPage from "./frontend/StoreLocationsPage";
import WishlistPage from "./frontend/WishlistPage";
import RequirementFinder from "./frontend/RequirementFinder";
import AdminDashboard from "./admin/Dashboard";
import AddProduct from "./admin/AddProduct";
import EditProduct from "./admin/EditProduct";
import CategoryFeatures from "./admin/CategoryFeatures";
import AdminOrders from "./admin/Orders";
import PendingOrders from "./admin/orders/PendingOrders";
import ShippedOrders from "./admin/orders/ShippedOrders";
import DeliveredOrders from "./admin/orders/DeliveredOrders";
import AdminCustomers from "./admin/Customers";
import AdminProducts from "./admin/Products";
import AdminActivity from "./admin/UserActivity";
import AdminPOS from "./admin/POS";
import AdminPOSHistory from "./admin/POSHistory";
import CustomerReports from "./admin/reports/CustomerReports";
import SalesReport from "./admin/reports/SalesReport";
import SalesProductReport from "./admin/reports/SalesProductReport";
import SalesCategoryReport from "./admin/reports/SalesCategoryReport";
import SalesBrandReport from "./admin/reports/SalesBrandReport";
import SalesDownloadableReport from "./admin/reports/SalesDownloadableReport";
import CountryOrderReport from "./admin/reports/CountryOrderReport";
import OrderStatusReport from "./admin/reports/OrderStatusReport";
import TopSalesReports from "./admin/reports/TopSalesReports";
import StockReport from "./admin/reports/StockReport";
import AdminUsers from "./admin/staff/Users";
import AdminRoles from "./admin/staff/Roles";
import AdminServiceTickets from "./admin/ServiceTickets";
import Repairs from "./admin/Repairs";
import AdminMessages from "./admin/Messages";
import HeroSettings from "./admin/HeroSettings";
import AdminLayout from "./admin/components/AdminLayout";
import OrderSuccessPage from "./frontend/OrderSuccessPage";
import TrackOrdersPage from "./frontend/TrackOrdersPage";
import ServiceCenterPage from "./frontend/ServiceCenterPage";
import HistoryPage from "./frontend/customer/History";
import NotFound from "./frontend/NotFound";
import { ChatWidget } from "@/components/ChatWidget";
import { Toaster } from "@/components/ui/sonner";
import { Toaster as ToastToaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { ScrollProgressBar } from "@/components/ScrollProgressBar";
import VendorDashboard from "./frontend/vendor/VendorDashboard";
import CreateCompany from "./frontend/company/CreateCompany";
import CompanyProfile from "./frontend/company/CompanyProfile";
import CompanyList from "./frontend/company/CompanyList";
import StoreFront from "./frontend/StoreFront";
import { StoreProvider } from "./frontend/context/StoreContext";
import { ScrollToTop } from "@/components/ScrollToTop";
import { ScrollToTopOnMount } from "@/components/ScrollToTopOnMount";
import { useEffect } from "react";
import { useAuth, AuthProvider } from "@/context/AuthContext";
import { useTracking } from "@/hooks/useTracking";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/components/ThemeProvider";
import { customerService } from "@/api/customerService";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const persister = createSyncStoragePersister({
  storage: window.localStorage,
});

function AppContent() {
  useTracking();
  const { user } = useAuth();
  
  useEffect(() => {
    const trackVisit = async () => {
      if (user) {
        try {
          // This will create the customer if they don't exist, or update their last visit
          await customerService.getById(user.id, user.email);
        } catch (error) {
          console.error("Error tracking user visit:", error);
        }
      }
    };
    trackVisit();
  }, [user]);

  return (
    <>
      <ScrollToTopOnMount />
      <Routes>
        <Route path="/" element={<Index />} />
      <Route path="/category/:slug" element={<CategoryPage />} />
      <Route path="/product/:slug" element={<ProductDetailPage />} />
      <Route path="/store/:company_slug/*" element={<StoreFront />} />
      <Route path="/companies" element={<CompanyList />} />
      <Route path="/companies/create" element={<CreateCompany />} />
      <Route path="/companies/:slug" element={<CompanyProfile />} />
      <Route path="/vendor/dashboard" element={<VendorDashboard />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/order-success" element={<OrderSuccessPage />} />
      <Route path="/compare" element={<ComparePage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/stores" element={<StoreLocationsPage />} />
      <Route path="/wishlist" element={<WishlistPage />} />
      <Route path="/requirement-finder" element={<RequirementFinder />} />
      <Route path="/track-orders" element={<TrackOrdersPage />} />
      <Route path="/service-center" element={<ServiceCenterPage />} />
      <Route path="/customer/history" element={<HistoryPage />} />
      
      {/* Admin Routes */}
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/orders/pending" element={<PendingOrders />} />
        <Route path="/admin/orders/shipped" element={<ShippedOrders />} />
        <Route path="/admin/orders/delivered" element={<DeliveredOrders />} />
        <Route path="/admin/products" element={<AdminProducts />} />
        <Route path="/admin/products/add" element={<AddProduct />} />
        <Route path="/admin/products/edit/:id" element={<EditProduct />} />
        <Route path="/admin/customers" element={<AdminCustomers />} />
        <Route path="/admin/service-tickets" element={<AdminServiceTickets />} />
        <Route path="/admin/repairs" element={<Repairs />} />
        <Route path="/admin/messages" element={<AdminMessages />} />
        <Route path="/admin/hero-settings" element={<HeroSettings />} />
        <Route path="/admin/activity" element={<AdminActivity />} />
        <Route path="/admin/category-features" element={<CategoryFeatures />} />
        <Route path="/admin/pos" element={<AdminPOS />} />
        <Route path="/admin/pos/history" element={<AdminPOSHistory />} />
        
        {/* Report Routes */}
        <Route path="/admin/reports/customers" element={<CustomerReports />} />
        <Route path="/admin/reports/orders/sales" element={<SalesReport />} />
        <Route path="/admin/reports/orders/products" element={<SalesProductReport />} />
        <Route path="/admin/reports/orders/categories" element={<SalesCategoryReport />} />
        <Route path="/admin/reports/orders/brands" element={<SalesBrandReport />} />
        <Route path="/admin/reports/orders/downloads" element={<SalesDownloadableReport />} />
        <Route path="/admin/reports/orders/countries" element={<CountryOrderReport />} />
        <Route path="/admin/reports/orders/status" element={<OrderStatusReport />} />
        <Route path="/admin/reports/top-sales" element={<TopSalesReports />} />
        <Route path="/admin/reports/stock" element={<StockReport />} />
        
        {/* Staff Routes */}
        <Route path="/admin/staff/users" element={<AdminUsers />} />
        <Route path="/admin/staff/roles" element={<AdminRoles />} />
      </Route>
      
      <Route path="/admin/add-product" element={<Navigate to="/admin/products/add" replace />} />
      
      <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <ThemeProvider defaultTheme="system" storageKey="fixitall-theme">
        <AuthProvider>
          <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{ persister }}
          >
            <TooltipProvider>
              <Toaster />
              <ToastToaster />
              <ScrollProgressBar />
              <ScrollToTop />
              <Router>
                <Helmet>
                  <title>FixItAll | Professional Electronics Repair & Store</title>
                  <meta name="description" content="Expert repair services for laptops, mobiles, and more. Shop the latest electronics with professional support." />
                  <meta property="og:title" content="FixItAll | Professional Electronics Repair & Store" />
                  <meta property="og:description" content="Expert repair services for laptops, mobiles, and more. Shop the latest electronics with professional support." />
                  <meta property="og:type" content="website" />
                  <meta name="twitter:card" content="summary_large_image" />
                </Helmet>
                <ChatWidget />
                <ErrorBoundary>
                  <StoreProvider>
                    <AppContent />
                  </StoreProvider>
                </ErrorBoundary>
              </Router>
            </TooltipProvider>
          </PersistQueryClientProvider>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}
