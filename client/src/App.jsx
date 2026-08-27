import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import AuthModal from "./components/AuthModal";
import MainLayout from "./components/MainLayout";
import AdminRoute from "./components/admin/AdminRoute";
import AdminLayout from "./components/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import ProductList from "./pages/admin/ProductList";
import OrderList from "./pages/admin/OrderList";
import Inventory from "./pages/admin/Inventory";
import Users from "./pages/admin/Users";
import Reviews from "./pages/admin/Reviews";
import Coupons from "./pages/admin/Coupons";

import SearchResults from "./pages/SearchResults";
import Home from "./pages/Home";
import Men from "./pages/Men";
import Women from "./pages/Women";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Checkout from "./pages/Checkout";
import ProductDetails from "./pages/ProductDetails";
import Profile from "./pages/Profile";
import Orders from "./pages/Orders";
import Tracking from "./pages/Tracking";
import About from "./pages/About";

function App() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:text-gray-100 transition-colors">
      <Toaster position="top-right" reverseOrder={false} />
      <AuthModal />

      <Routes>
        {/* Main Storefront Routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/men" element={<Men />} />
          <Route path="/women" element={<Women />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/about" element={<About />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:orderId/tracking" element={<Tracking />} />
          <Route path="/tracking/:orderId" element={<Tracking />} />
          <Route path="/search/:query" element={<SearchResults />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/search" element={<Home />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="*" element={<h1 className="text-center py-20 text-2xl font-bold">Page Not Found</h1>} />
        </Route>

        {/* Admin Dashboard Routes */}
        <Route path="/admin" element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<ProductList />} />
            <Route path="orders" element={<OrderList />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="users" element={<Users />} />
            <Route path="reviews" element={<Reviews />} />
            <Route path="coupons" element={<Coupons />} />
            {/* Future Admin Routes will go here */}
          </Route>
        </Route>
      </Routes>
    </div>
  );
}

export default App;