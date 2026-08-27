export default function Hero() {
  return (
    <section className="bg-gray-100 dark:bg-gray-800 py-16">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">

        <div>
          <h1 className="text-5xl font-bold mb-6">
            Brand New <br /> Collection
          </h1>

          <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">
            Discover premium fashion collections for men and women.
            Designed with quality and comfort in mind.
          </p>

          <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            ✓ Top Brands &nbsp;&nbsp; ✓ High Quality &nbsp;&nbsp; ✓ Free Delivery
          </div>

          <button 
            onClick={() => document.getElementById('new-arrivals')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-red-500 text-white px-6 py-3 rounded hover:bg-red-600 transition-colors"
          >
            Explore New Arrivals
          </button>
        </div>

        <img alt="banner"
          src="/photos/vastraa banner.png"
          className="w-[650px] rounded-lg"
        />

      </div>
    </section>
  );
}