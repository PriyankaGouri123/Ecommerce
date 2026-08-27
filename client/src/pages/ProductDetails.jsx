import { useParams, useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { useProducts } from "../hooks/useProducts";
import { StoreContext } from "../context/StoreContext";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";
import ProductCard from "../components/ProductCard";

export default function ProductDetails() {
  // ----- ROUTE & CONTEXT HOOKS -----
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, wishlist } = useContext(StoreContext);
  const { user, openAuthModal } = useContext(AuthContext);

  // ----- DATA HOOK -----
  const { products, loading, error } = useProducts();

  // ----- LOCAL STATE HOOKS -----
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState([]);

  // ----- DERIVED VALUES (non‑hook) -----
  const product = products.find((p) => p.id === parseInt(id));
  const targetProductId = product ? String(product._id || product.id) : null;
  const isWishlisted = wishlist.some((item) => {
    return (
      targetProductId &&
      (String(item.id) === targetProductId ||
        String(item._id) === targetProductId ||
        (item.product && String(item.product) === targetProductId))
    );
  });

  // ----- EFFECT: FETCH REVIEWS -----
  useEffect(() => {
    const fetchReviews = async () => {
      if (!targetProductId) return;
      try {
        const res = await fetch(`/api/reviews/product/${targetProductId}`);
        if (res.ok) {
          const data = await res.json();
          setReviews(data);
          if (data.length > 0) {
            const sum = data.reduce((acc, rev) => acc + rev.rating, 0);
            setAverageRating((sum / data.length).toFixed(1));
          }
        }
      } catch (err) {
        console.error("Failed to fetch reviews", err);
      } finally {
        setReviewsLoading(false);
      }
    };
    fetchReviews();
  }, [targetProductId]);

  // ----- EFFECT: RELATED PRODUCTS -----
  useEffect(() => {
    if (!product) return;
    const related = products
      .filter((p) => p.id !== product.id && p.category === product.category)
      .slice(0, 10);
    setRelatedProducts(related);
  }, [product, products]);

  // ----- EARLY RETURNS -----
  if (loading) {
    return <div className="text-center py-8">Loading product…</div>;
  }
  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }
  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Product Not Found</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2 mb-8">
          The product you're looking for doesn't exist or has been removed.
        </p>
        <button
          onClick={() => navigate("/")}
          className="bg-blue-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors"
        >
          Back to Home
        </button>
      </div>
    );
  }

  // ----- HANDLERS -----
  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: product.name, url });
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!", { icon: "🔗" });
    }
  };

  const handleBuyNow = () => {
    addToCart(product);
    if (!user) {
      toast.error("Please log in to complete your purchase", {
        icon: "🔐",
        duration: 4000,
      });
      openAuthModal("login");
    } else {
      navigate("/checkout");
    }
  };

  const stock = product.countInStock !== undefined ? Number(product.countInStock) : 0;

  // ----- UI -----
  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
          <div className="flex flex-col md:flex-row">
            {/* Image Section */}
            <div className="md:w-1/2 p-8 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <div className="relative group w-full aspect-square max-w-md">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover rounded-2xl shadow-lg transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            </div>

            {/* Content Section */}
            <div className="md:w-1/2 p-10 md:p-16 flex flex-col justify-center">
              <div className="flex justify-between items-start mb-4">
                <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-200 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {product.category}
                </span>
                <div className="flex gap-4">
                  <button
                    onClick={() => toggleWishlist(product)}
                    className={`p-3 rounded-full shadow-sm border transition-all ${
                      isWishlisted
                        ? "bg-red-50 border-red-200 text-red-500"
                        : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400 hover:text-red-500"
                    }`}
                  >
                    {isWishlisted ? "❤️" : "♡"}
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-3 rounded-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-blue-500 shadow-sm transition-all"
                  >
                    🔗
                  </button>
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-gray-100 mb-4 tracking-tight">
                {product.name}
              </h1>

              <div className="flex items-center gap-4 mb-8">
                <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">₹{product.price}</span>
                <span className="text-gray-400 line-through text-xl">₹{Math.floor(product.price * 1.4)}</span>
                <span className="text-green-600 font-bold bg-green-50 dark:bg-green-950/60 px-2 py-1 rounded text-sm">40% OFF</span>
              </div>

              {/* Rating */}
              {!reviewsLoading && reviews.length > 0 && (
                <div className="flex items-center gap-2 mb-6 -mt-4">
                  <div className="flex text-yellow-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star}>{star <= Math.round(averageRating) ? "★" : "☆"}</span>
                    ))}
                  </div>
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{averageRating}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">({reviews.length} reviews)</span>
                </div>
              )}

              <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed mb-10">
                Experience premium comfort and style with our latest collection. This {product.name} is crafted from high-quality materials to ensure durability and a perfect fit for any occasion.
              </p>

              {/* Stock & Actions */}
              <div className="mb-6">
                {stock <= 0 ? (
                  <span className="text-red-500 font-extrabold text-sm uppercase tracking-wide bg-red-50 dark:bg-red-950/40 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800">
                    Out of Stock
                  </span>
                ) : stock <= 5 ? (
                  <span className="text-orange-600 dark:text-orange-400 font-extrabold text-sm tracking-wide bg-orange-50 dark:bg-orange-950/40 px-3 py-1.5 rounded-lg border border-orange-200 dark:border-orange-800 animate-pulse">
                    🔥 Only {stock} left!
                  </span>
                ) : stock < 20 ? (
                  <span className="text-green-600 dark:text-green-400 font-semibold text-sm bg-green-50 dark:bg-green-950/40 px-3 py-1.5 rounded-lg border border-green-200 dark:border-green-800">
                    In Stock ({stock} available)
                  </span>
                ) : null}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => addToCart(product)}
                  disabled={stock <= 0}
                  className="flex-grow bg-blue-600 text-white py-5 rounded-2xl font-bold text-lg hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95"
                >
                  {stock <= 0 ? "Out of Stock" : "Add to Cart"}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={stock <= 0}
                  className="flex-grow bg-orange-500 text-white py-5 rounded-2xl font-bold text-lg hover:bg-orange-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                >
                  ⚡ BUY NOW
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RELATED PRODUCTS */}
        {relatedProducts.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {relatedProducts.map((item) => (
                <ProductCard key={item.id || item._id} product={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
