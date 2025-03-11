import { Routes, Route } from "react-router-dom";
// Main layers
import { MainLayout } from "@/layers/main-layout";
import { MainHomePage } from "@/pages/main/main-home";
import { MainPricing } from "@/pages/main/main-pricing";
import { MainNetwork } from "@/pages/main/main-network";
import { MainAbout } from "@/pages/main/main-about";
import { MainTrack } from "@/pages/main/main-track";
import { MainContact } from "@/pages/main/main-contact";
// Auth layers
import { AuthLayout } from "@/layers/auth-layout";
import { SignIn } from "@/pages/auth/sign-in";
import { SignUp } from "@/pages/auth/sign-up";
import Unauthorized from "@/pages/auth/Unauthorized";
// Seller layers
import { SellerLayout } from "@/layers/seller-layout";
import { SellerOnboarding } from "@/pages/seller/seller-onboarding";
import { SellerDashboard } from "@/pages/seller/seller-dashboard";
import { ProductsPage } from "@/pages/seller/products/products";
import { OrdersPage } from "@/pages/seller/orders/orders";
import { StoreSettingsPage } from "@/pages/seller/settings/store-settings";
import OrderPage from "@/pages/seller/orders/order-page";
// Driver layers
import  {DriverLayout}  from "@/layers/driver-layout";
import { DriverApplication } from "@/pages/driver/driver-application";
// Protected route
import { SellerGuard } from "./seller-guard";
import { GoogleCallback } from "@/pages/auth/google-callback";
import { RoleSelectionPage } from "@/pages/auth/RoleSelectionPage";
import { DriverAvailableRoutes } from "@/pages/driver/driver-available-routes";
import { ProtectedRoute } from "./protected-route";
import { DriverDashboard } from "@/pages/driver/driver-dashboard";
import { ActiveDelivery } from "@/pages/driver/driver-active-delivery";
import { DriverHistory } from "@/pages/driver/driver-history";
import DriverVehicle from "@/pages/driver/driver-vehicle";
import DriverSettings from "@/pages/driver/driver-settings";


export function AppRoutes() {
  return (
    <Routes>
      {/* Main Platform */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<MainHomePage />} />
        <Route path="pricing" element={<MainPricing />} />
        <Route path="about" element={<MainAbout />} />
        <Route path="network" element={<MainNetwork />} />
        <Route path="track" element={<MainTrack />} />
        <Route path="contact" element={<MainContact />} />
        <Route path="order/:orderId" element={<OrderPage />} />
       
      </Route>

      {/* Auth Platform */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="sign-in" element={<SignIn />} />
        <Route path="sign-up" element={<SignUp />} />
        <Route path="google/callback" element={<GoogleCallback />} />
      </Route>
      <Route path="role-selection" element={<RoleSelectionPage />} />

      {/* Seller Platform */}
      <Route path="/seller" element={<SellerLayout />}>
        <Route
          index
          element={
            <ProtectedRoute>
              <SellerGuard>
                <SellerDashboard />
              </SellerGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <SellerGuard>
                <SellerDashboard />
              </SellerGuard>
            </ProtectedRoute>
          }
        />
        <Route path="onboarding" element={
          <ProtectedRoute>
            <SellerGuard>
              <SellerOnboarding />
            </SellerGuard>
          </ProtectedRoute>
          } />
        <Route
          path="products"
          element={
            <ProtectedRoute>
              <SellerGuard>
                <ProductsPage />
              </SellerGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="orders"
          element={
            <ProtectedRoute>
              <SellerGuard>
                <OrdersPage />
              </SellerGuard>
            </ProtectedRoute>
          }
        />
        <Route path="settings" element={
          <ProtectedRoute>
              <SellerGuard>
                <StoreSettingsPage />
              </SellerGuard>
            </ProtectedRoute>} />
       
      </Route>

      {/* Unauthorized Route */}
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Warehouse Platform */}
      <Route path="warehouse">
        <Route index element={<div>Warehouse Dashboard</div>} />
        <Route path="inventory" element={<div>Inventory Management</div>} />
        <Route path="sections" element={<div>Sections Management</div>} />
      </Route>

      {/* Driver Platform */}
      <Route path="/driver" element={<DriverLayout />}>
      <Route
          index
          element={
            <ProtectedRoute>
                <DriverDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
                <DriverDashboard />
            </ProtectedRoute>
          }
        />
        <Route
            path="application"
            element={
              <ProtectedRoute>
                <DriverApplication />
              </ProtectedRoute>
            }
          />
          <Route
          path="active-delivery"
          element={
            <ProtectedRoute>
                <ActiveDelivery />
            </ProtectedRoute>
          }
          />
          <Route
          path="history"
          element={
            <ProtectedRoute>
                <DriverHistory />
            </ProtectedRoute>
          }
          />
          <Route
          path="vehicle"
          element={
            <ProtectedRoute>
                <DriverVehicle />
            </ProtectedRoute>
          }
          />
          <Route
          path="settings"
          element={
            <ProtectedRoute>
                <DriverSettings />
            </ProtectedRoute>
          }
          />
          <Route
          path="available-routes"
          element={
            <ProtectedRoute>
                <DriverAvailableRoutes />
            </ProtectedRoute>
          }
          />

        
        
      </Route>
    </Routes>
  );
}
