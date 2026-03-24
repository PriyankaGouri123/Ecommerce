import { useContext } from "react";
import { StoreContext } from "../context/StoreContext";

export default function ProductCard({ product }) {
  const { addToCart, toggleWishlist, wishlist } =
    useContext(StoreContext);

  const isWishlisted = wishlist.some((item) => item.id === product.id);

  const handleShare = () => {
    const url = `${window.location.origin}/product/${product.id}`;

    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: "Check out this product!",
        url,
      });
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copied!");
    }
  };

  return (
    <div className="bg-white shadow-md p-4 rounded-xl">

      {/* ✅ HARD FIXED IMAGE CONTAINER */}
      <div style={{ width: "100%", height: "200px", overflow: "hidden" }}>
        <img
          src={product.image}
          alt={product.name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",   // 🔥 MAIN FIX
            display: "block"
          }}
        />
      </div>

      <h3 className="mt-3 font-semibold">{product.name}</h3>
      <p className="text-red-500 font-bold">₹{product.price}</p>

      <button
        onClick={() => addToCart(product)}
        className="bg-red-500 text-white w-full mt-2 py-2 rounded"
      >
        Add to Cart
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
  );
}