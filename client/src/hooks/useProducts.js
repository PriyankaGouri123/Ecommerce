import { useState, useEffect } from 'react';

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`/api/products`);
        const contentType = response.headers.get('content-type') || '';
        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.status}`);
        }
        if (!contentType.includes('application/json')) {
          const text = await response.text();
          throw new Error(`Unexpected response format: ${text.slice(0, 100)}`);
        }
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return { products, loading, error };
};
