import { useEffect, useState } from "react";

export default function CartItems() {

  const [cart, setCart] = useState([]);

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem("cart")) || [];
    setCart(savedCart);
  }, []);

  if (cart.length === 0) {
    return (
      <div className="flex-1 bg-white p-6 rounded shadow">
        Your cart is empty
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white p-6 rounded shadow">
      {cart.map((item, index) => (
        <div key={index} className="flex gap-4 border-b py-4">

          <img
            src={item.image}
            className="w-20 h-20 object-cover rounded"
          />

          <div className="flex-1">
            <h4 className="font-semibold">{item.name}</h4>
            <p>₹{item.price}</p>
          </div>

        </div>
      ))}
    </div>
  );
}