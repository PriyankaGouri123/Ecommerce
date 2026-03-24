import products from "../data/products";
import ProductCard from "../components/ProductCard";

export default function NewArrivals() {

  return (

    <section className="px-16 py-12">

      <h2 className="text-2xl font-bold mb-8">
        New Arrivals
      </h2>

      <div className="grid grid-cols-5 gap-6">

        {products.slice(10,20).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}

      </div>

    </section>

  );
}