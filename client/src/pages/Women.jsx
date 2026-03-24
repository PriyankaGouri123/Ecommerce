import { useContext } from "react";
import { StoreContext } from "../context/StoreContext";

export default function Women() {
  const { addToCart, toggleWishlist } = useContext(StoreContext);

  const products = [
    {
      id: 101,
      name: "Cozy Sweater",
      price: 1799,
      image: "/photos/women cozy sweater.png",
    },
    {
      id: 102,
      name: "Winter Jacket",
      price: 2999,
      image: "/photos/womenjacket.webp",
    },
    {
      id: 103,
      name: "Casual Dress",
      price: 1599,
      image: "/photos/womancasualdress.avif",
    },
    {
      id: 104,
      name: "Long Coat",
      price: 3499,
      image: "/photos/womanlongcoat.avif",
    },
  ];

  return (
    <div>
      {/* Banner */}
      <div className="relative">
        <img
          src="/photos/banner1vastraa.png"
          className="w-full h-[700px] object-cover"
        />
      </div>

      {/* Products */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-4 gap-6  ">
          {products.map((item) => (
            <div key={item.id} className="bg-white shadow-md p-4 rounded-lg">
              <img src={item.image} className="h-48 w-full object-cover" />

              <h3>{item.name}</h3>
              <p>₹{item.price}</p>

              {/* ✅ FIXED BUTTON */}
              <button
                onClick={() => addToCart(item)}
                className="bg-red-500 text-white w-full mt-2 py-2 rounded"
              >
                Add to Cart
              </button>

              <div className="flex justify-between mt-3">
                <button onClick={() => toggleWishlist(item)}>♡</button>
                <span>🔗</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}