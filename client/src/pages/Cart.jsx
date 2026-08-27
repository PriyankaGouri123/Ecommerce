import { useContext } from "react";
import { StoreContext } from "../context/StoreContext";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

function Cart() {
  const { cart, removeFromCart, updateQty } = useContext(StoreContext);
  const { user, openAuthModal } = useContext(AuthContext);
  const navigate = useNavigate();

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleBuyNow = () => {
    // Check if any cart item requested quantity exceeds available stock
    const invalidItem = cart.find((item) => {
      const stock = item.countInStock !== undefined ? Number(item.countInStock) : 0;
      return stock <= 0 || item.quantity > stock;
    });

    if (invalidItem) {
      const stock = invalidItem.countInStock !== undefined ? Number(invalidItem.countInStock) : 0;
      if (stock <= 0) {
        toast.error(`"${invalidItem.name}" is out of stock. Please remove it from cart.`);
      } else {
        toast.error(`Cannot proceed. Requested quantity (${invalidItem.quantity}) for "${invalidItem.name}" exceeds available stock (${stock}).`);
      }
      return;
    }

    if (!user) {
      toast.error("Please log in to proceed with your purchase", {
        icon: "🔐",
        duration: 4000,
      });
      openAuthModal("login");
      return;
    }
    navigate("/checkout");
  };

  if (cart.length === 0) {
    return (
      <div className="p-10 text-center max-w-lg mx-auto">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">Your Cart is Empty</h2>
        <p className="text-gray-500 mb-6">Explore our latest styles and add your favorite items!</p>
        <button
          onClick={() => navigate("/")}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-lg shadow transition"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
        🛒 Your Shopping Cart ({cart.length})
      </h1>

      <div className="space-y-4">
        {cart.map((item) => {
          const stock = item.countInStock !== undefined ? Number(item.countInStock) : 0;
          const isOverStock = item.quantity > stock;
          const isOutOfStock = stock <= 0;

          return (
            <div
              key={item.id}
              className={`flex gap-4 border p-4 rounded-xl shadow-sm bg-white dark:bg-gray-800 ${
                isOverStock || isOutOfStock
                  ? "border-red-300 dark:border-red-700 bg-red-50/20"
                  : "border-gray-200 dark:border-gray-700"
              }`}
            >
              <img
                src={item.image}
                alt={item.name}
                className="w-24 h-24 object-cover rounded-lg border border-gray-100 dark:border-gray-700"
              />

              <div className="flex flex-col justify-between w-full">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{item.name}</h3>
                    {isOutOfStock ? (
                      <span className="text-xs font-bold text-red-500 bg-red-100 dark:bg-red-950/60 px-2 py-0.5 rounded">
                        Out of Stock
                      </span>
                    ) : stock <= 5 ? (
                      <span className="text-xs font-bold text-orange-500 bg-orange-100 dark:bg-orange-950/60 px-2 py-0.5 rounded">
                        Only {stock} left
                      </span>
                    ) : stock < 20 ? (
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        Stock: {stock}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-blue-600 font-bold text-base">₹{item.price}</p>
                  {isOverStock && !isOutOfStock && (
                    <p className="text-xs text-red-500 font-bold mt-1">
                      ⚠️ Requested quantity ({item.quantity}) exceeds available stock ({stock}). Please reduce quantity.
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateQty(item.id, "dec")}
                      className="w-8 h-8 flex items-center justify-center font-bold bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-white hover:bg-gray-200"
                    >
                      -
                    </button>

                    <span className="font-bold text-gray-900 dark:text-white px-2">{item.quantity}</span>

                    <button
                      onClick={() => updateQty(item.id, "inc")}
                      disabled={item.quantity >= stock}
                      className="w-8 h-8 flex items-center justify-center font-bold bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-white hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 hover:text-red-700 font-bold text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total & Action Bar */}
      <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <span className="text-xs text-gray-500 uppercase tracking-wider block">Total Amount</span>
          <h2 className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">
            ₹{total}
          </h2>
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <button
            onClick={() => navigate("/")}
            className="flex-1 md:flex-none bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-200 transition"
          >
            Continue Shopping
          </button>

          <button
            onClick={handleBuyNow}
            className="flex-1 md:flex-none bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:shadow-xl transition transform active:scale-95 flex items-center justify-center gap-2"
          >
            <span>BUY NOW</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Cart;