import { useContext } from "react";
import { StoreContext } from "../context/StoreContext";

export default function Men() {
  const { addToCart, toggleWishlist } = useContext(StoreContext);

  const products = [
    {
      id: 201,
      name: "Warm Hoodie",
      price: 1499,
      image: "/photos/mencasual.jpg",
    },
    {
      id: 202,
      name: "Denim Jacket",
      price: 2799,
      image: "/photos/denim-jackets.jpg",
    },
    {
      id: 203,
      name: "Casual Shirt",
      price: 1199,
      image: "/photos/shirtman.webp",
    },
  ];

  return (
    <div>
      {/* Banner */}
      <div className="relative">
        <img src="/photos/bannermanvastra.png" className="w-full h-[600px]" />
      </div>

      {/* Products */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-4 gap-6">
          {products.map((item) => (
            <div key={item.id} className="bg-white p-4 shadow-md rounded">
              <img src={item.image} className="h-48 w-full object-cover" />

              <h3>{item.name}</h3>
              <p>₹{item.price}</p>

              {/* ✅ FIXED */}
              <button
                onClick={() => addToCart(item)}
                className="bg-red-500 text-white w-full mt-2 py-2 rounded"
              >
                Add to Cart
              </button>

              <div className="flex justify-between mt-2">
                <button onClick={() => toggleWishlist(item)}>
                  ♡ Wishlist
                </button>
                <span>🔗</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}