import { useNavigate } from "react-router-dom";

export default function CartSummary() {

  const navigate = useNavigate();

  return (
    <div className="w-80 bg-white p-6 rounded shadow">

      <h3 className="text-xl font-bold mb-4">Summary</h3>

      <button
        onClick={() => navigate("/")}
        className="border px-4 py-2 rounded  bg-red-500"
      >
        Continue Shopping
      </button>

    </div>
  );
}