import { useContext } from "react";
import { StoreContext } from "../context/StoreContext";

function Wishlist() {
  const { wishlist, toggleWishlist, addToCart } =
    useContext(StoreContext);

  if (wishlist.length === 0)
    return <h2 className="p-5">Wishlist is empty ❤️</h2>;

  return (
    <div className="p-5 grid grid-cols-2 gap-4">
      {wishlist.map((item) => (
        <div key={item.id} className="border p-4">
          <img src={item.image} className="h-40 w-full" />
          <h3>{item.name}</h3>
          <p>₹{item.price}</p>

          <button onClick={() => addToCart(item)}>
            Add to Cart
          </button>

          <button onClick={() => toggleWishlist(item)}>
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}

export default Wishlist;