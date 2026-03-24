import { useContext, useState } from "react";
import { StoreContext } from "../context/StoreContext";
import { useNavigate } from "react-router-dom";

export default function Checkout() {
  const { cart } = useContext(StoreContext);
  const navigate = useNavigate();

  const [address, setAddress] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("cod");

  // Total calculation
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const delivery = subtotal > 999 ? 0 : 99;
  const total = subtotal + delivery;

  const handlePlaceOrder = () => {
    if (
      !address.name ||
      !address.phone ||
      !address.address ||
      !address.city ||
      !address.pincode
    ) {
      alert("Please fill all details");
      return;
    }

    alert(`Order placed successfully using ${paymentMethod.toUpperCase()} 🎉`);
    navigate("/");
  };

  if (cart.length === 0) {
    return <h2 className="p-6 text-center">Your cart is empty 🛒</h2>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 grid md:grid-cols-2 gap-8">

      {/* LEFT: Address + Payment */}
      <div className="space-y-6">

        {/* Address */}
        <div className="border p-5 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Delivery Address</h2>

          <input
            type="text"
            placeholder="Full Name"
            className="w-full border p-2 mb-3"
            onChange={(e) => setAddress({ ...address, name: e.target.value })}
          />

          <input
            type="text"
            placeholder="Phone Number"
            className="w-full border p-2 mb-3"
            onChange={(e) => setAddress({ ...address, phone: e.target.value })}
          />

          <textarea
            placeholder="Address"
            className="w-full border p-2 mb-3"
            onChange={(e) => setAddress({ ...address, address: e.target.value })}
          />

          <div className="flex gap-3">
            <input
              type="text"
              placeholder="City"
              className="w-1/2 border p-2"
              onChange={(e) => setAddress({ ...address, city: e.target.value })}
            />

            <input
              type="text"
              placeholder="Pincode"
              className="w-1/2 border p-2"
              onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
            />
          </div>
        </div>

        {/* Payment */}
        <div className="border p-5 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Payment Method</h2>

          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={paymentMethod === "cod"}
                onChange={() => setPaymentMethod("cod")}
              />
              Cash on Delivery
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={paymentMethod === "upi"}
                onChange={() => setPaymentMethod("upi")}
              />
              UPI Payment
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={paymentMethod === "card"}
                onChange={() => setPaymentMethod("card")}
              />
              Debit/Credit Card
            </label>
          </div>
        </div>
      </div>

      {/* RIGHT: Order Summary */}
      <div className="border p-5 rounded-lg shadow h-fit">

        <h2 className="text-xl font-bold mb-4">Order Summary</h2>

        {/* Items */}
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {cart.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.name} x {item.quantity}
              </span>
              <span>₹{item.price * item.quantity}</span>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div className="border-t mt-4 pt-4 space-y-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₹{subtotal}</span>
          </div>

          <div className="flex justify-between">
            <span>Delivery</span>
            <span>{delivery === 0 ? "Free" : `₹${delivery}`}</span>
          </div>

          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>₹{total}</span>
          </div>
        </div>

        {/* Button */}
        <button
          onClick={handlePlaceOrder}
          className="w-full bg-red-500 text-white py-3 mt-5 rounded-lg text-lg font-semibold"
        >
          Place Order
        </button>

        <button
          onClick={() => navigate("/cart")}
          className="w-full mt-3 border py-2 rounded"
        >
          Back to Cart
        </button>
      </div>
    </div>
  );
}