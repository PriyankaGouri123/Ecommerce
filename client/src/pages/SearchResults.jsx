import { useParams } from "react-router-dom";
import products from "../data/products"; // adjust path if needed

export default function SearchResults() {
  const { query } = useParams();

  const filteredProducts = products.filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">

      <h2 className="text-2xl font-bold mb-4">
        Results for: <span className="text-red-500">{query}</span>
      </h2>

      {filteredProducts.length === 0 ? (
        <p className="text-gray-500">No products found</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((item) => (
            <div key={item.id} className="border p-4 rounded shadow hover:shadow-lg">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-48 object-cover rounded"
              />
              <h3 className="mt-2 font-semibold">{item.name}</h3>
              <p className="text-gray-600">₹{item.price}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}