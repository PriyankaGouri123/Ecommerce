import { useContext } from "react";
import { StoreContext } from "../context/StoreContext";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

export default function ProductCard({ product }) {
  const { addToCart, toggleWishlist, wishlist } = useContext(StoreContext);

  const productId = String(product._id || product.id);
  const isWishlisted = wishlist.some(
    (item) =>
      String(item.id) === productId ||
      String(item._id) === productId ||
      (item.product && String(item.product) === productId)
  );

  const handleShare = () => {
    const url = `${window.location.origin}/product/${product.id}`;

    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: "Check out this product!",
        url,
      });
      toast.success("Opened share menu!");
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!", {
        icon: "🔗",
        style: { borderRadius: "10px", background: "#333", color: "#fff" },
      });
    }
  };

  const stock = product.countInStock !== undefined ? Number(product.countInStock) : 0;

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md p-4 rounded-xl group transition-all hover:shadow-xl flex flex-col justify-between">
      <div>
        {/* ✅ HARD FIXED IMAGE CONTAINER */}
        <Link to={`/product/${product.id}`} className="block overflow-hidden rounded-lg">
          <div style={{ width: "100%", height: "200px", overflow: "hidden" }}>
            <img
              src={product.image}
              alt={product.name}
              className="transition-transform duration-500 group-hover:scale-110"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block"
              }}
            />
          </div>
        </Link>

        <Link to={`/product/${product.id}`}>
          <h3 className="mt-3 font-semibold text-gray-800 dark:text-gray-200 hover:text-red-500 transition-colors line-clamp-1">{product.name}</h3>
        </Link>

        <div className="flex items-center justify-between mt-1 mb-2">
          <p className="text-red-500 font-bold text-lg">₹{product.price}</p>
          {stock <= 0 ? (
            <span className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded">
              Out of Stock
            </span>
          ) : stock <= 5 ? (
            <span className="text-xs font-bold text-orange-500 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded animate-pulse">
              🔥 Only {stock} left
            </span>
          ) : stock < 20 ? (
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              In Stock ({stock})
            </span>
          ) : null}
        </div>
      </div>

      <div>
        <button
          onClick={() => addToCart(product)}
          disabled={stock <= 0}
          className="bg-red-500 hover:bg-red-600 text-white font-semibold w-full py-2 rounded-lg transition disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed disabled:text-gray-500"
        >
          {stock <= 0 ? "Out of Stock" : "Add to Cart"}
        </button>

        <div className="flex justify-between mt-3 text-lg">
          <button
            onClick={() => toggleWishlist(product)}
            style={{ color: isWishlisted ? "red" : "gray" }}
          >
            {isWishlisted ? "❤️" : "♡"}
          </button>

          <button onClick={handleShare}>🔗</button>
        </div>
      </div>
    </div>
  );
}