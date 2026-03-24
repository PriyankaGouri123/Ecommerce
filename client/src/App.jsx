import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import SearchResults from "./pages/SearchResults";

import Home from "./pages/Home";
import Men from "./pages/Men";
import Women from "./pages/Women";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Checkout from "./pages/Checkout"; // ✅ IMPORT

import About from "./pages/About";

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/men" element={<Men />} />
          <Route path="/women" element={<Women />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/about" element={<About />} />
          <Route path="/search/:query" element={<SearchResults />} />

          {/* Optional improvements */}
          <Route path="/search" element={<Home />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="*" element={<h1>Page Not Found</h1>} />
        </Routes>
      </div>

      <Footer />
    </div>
  );
}

export default App;