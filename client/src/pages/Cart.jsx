import { useContext } from "react";
import { StoreContext } from "../context/StoreContext";
import { useNavigate } from "react-router-dom";

function Cart() {
  const { cart, removeFromCart, updateQty } = useContext(StoreContext);
  const navigate = useNavigate();

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  if (cart.length === 0) {
    return (
      <div className="p-5 text-center">
        <h2 className="text-xl font-semibold mb-4">Cart is empty 🛒</h2>
        <button
          onClick={() => navigate("/")}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>

      {cart.map((item) => (
        <div
          key={item.id}
          className="flex gap-4 mb-4 border p-4 rounded-lg shadow-sm"
        >
          <img
            src={item.image}
            alt={item.name}
            className="w-24 h-24 object-cover rounded"
          />

          <div className="flex flex-col justify-between w-full">
            <div>
              <h3 className="font-semibold text-lg">{item.name}</h3>
              <p className="text-red-500">₹{item.price}</p>
            </div>

            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => updateQty(item.id, "dec")}
                className="px-2 py-1 bg-gray-200 rounded"
              >
                -
              </button>

              <span>{item.quantity}</span>

              <button
                onClick={() => updateQty(item.id, "inc")}
                className="px-2 py-1 bg-gray-200 rounded"
              >
                +
              </button>
            </div>

            <button
              onClick={() => removeFromCart(item.id)}
              className="text-red-500 text-sm mt-2"
            >
              Remove
            </button>
          </div>
        </div>
      ))}

      {/* ✅ Total + Actions */}
      <div className="mt-6 border-t pt-4 flex flex-col md:flex-row justify-between items-center gap-4">

        <h2 className="text-xl font-bold">
          Total: ₹{total}
        </h2>

        <div className="flex gap-4">
          {/* Continue Shopping */}
          <button
            onClick={() => navigate("/")}
            className="bg-gray-200 px-4 py-2 rounded"
          >
            Continue Shopping
          </button>

          {/* Buy Now */}
          <button
            onClick={() => navigate("/checkout")}
            className="bg-red-500 text-white px-6 py-2 rounded"
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}

export default Cart;