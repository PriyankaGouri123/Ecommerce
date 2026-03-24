export default function Hero() {
  return (
    <section className="bg-gray-100 py-16">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">

        <div>
          <h1 className="text-5xl font-bold mb-6">
            Brand New <br /> Collection
          </h1>

          <p className="text-gray-600 mb-4 max-w-md">
            Discover premium fashion collections for men and women.
            Designed with quality and comfort in mind.
          </p>

          <div className="text-sm text-gray-500 mb-6">
            ✓ Top Brands &nbsp;&nbsp; ✓ High Quality &nbsp;&nbsp; ✓ Free Delivery
          </div>

          <button className="bg-red-500 text-white px-6 py-3 rounded">
            Explore New Arrivals
          </button>
        </div>

        <img
          src="https://images.unsplash.com/photo-1520975922203-b1c9f3e0b55f"
          className="w-[350px] rounded-lg"
        />

      </div>
    </section>
  );
}