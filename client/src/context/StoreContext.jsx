import { createContext, useState, useEffect, useContext } from "react";
import toast from "react-hot-toast";
import { AuthContext } from "./AuthContext";

export const StoreContext = createContext();

export const StoreProvider = ({ children }) => {
  const { user, token, openAuthModal, loading: authLoading } = useContext(AuthContext);

  // ✅ Load initial cart from localStorage safely
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem("cart");
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (err) {
      console.error("LocalStorage cart load error:", err);
      return [];
    }
  });

  const [wishlist, setWishlist] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(true);


  // ✅ Sync wishlist with MongoDB whenever token changes (Login, Logout, Refresh)
  useEffect(() => {
    if (authLoading) return; // wait for auth state restoration
    const fetchWishlist = async () => {
      setWishlistLoading(true);
      if (!token) {
        setWishlist([]);
        setWishlistLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/wishlist", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setWishlist(data);
        } else {
          setWishlist([]);
        }
      } catch (err) {
        console.error("Fetch wishlist error:", err);
        setWishlist([]);
      } finally {
        setWishlistLoading(false);
      }
    };
    fetchWishlist();
  }, [authLoading, token]);

  // ✅ Save cart on changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // ✅ Add to cart
  const addToCart = (product) => {
    const exists = cart.find((item) => item.id === product.id);
    const currentStock = product.countInStock !== undefined ? Number(product.countInStock) : 0;

    if (currentStock <= 0) {
      toast.error("Item is out of stock!", {
        style: { borderRadius: "10px", background: "#333", color: "#fff" },
      });
      return;
    }

    if (exists) {
      if (exists.quantity >= currentStock) {
        toast.error(`Only ${currentStock} units available in stock.`, {
          style: { borderRadius: "10px", background: "#333", color: "#fff" },
        });
        return;
      }
      toast.success(`Increased ${product.name} quantity!`, {
        icon: "🛒",
        style: { borderRadius: "10px", background: "#333", color: "#fff" },
      });
      setCart((prev) =>
        prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      toast.success(`${product.name} added to cart!`, {
        icon: "🛍️",
        style: { borderRadius: "10px", background: "#333", color: "#fff" },
      });
      setCart((prev) => [...prev, { ...product, quantity: 1 }]);
    }
  };

  // ✅ Remove from cart
  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
    toast.error("Item removed from cart", {
      style: { borderRadius: "10px", background: "#333", color: "#fff" },
    });
  };

  // ✅ Update quantity
  const updateQty = (id, type) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const currentStock = item.countInStock !== undefined ? Number(item.countInStock) : 0;
          if (type === "inc") {
            if (item.quantity >= currentStock) {
              toast.error(`Only ${currentStock} units available in stock.`, {
                style: { borderRadius: "10px", background: "#333", color: "#fff" },
              });
              return item;
            }
            return { ...item, quantity: item.quantity + 1 };
          } else {
            return { ...item, quantity: Math.max(1, item.quantity - 1) };
          }
        }
        return item;
      })
    );
  };

  // ✅ Toggle wishlist with instant optimistic state update + MongoDB sync
  const toggleWishlist = async (product) => {
    if (!user) {
      toast.error("Please log in to manage your wishlist", {
        icon: "🔐",
        style: { borderRadius: "10px", background: "#1e293b", color: "#fff" },
      });
      openAuthModal("login");
      return;
    }

    const targetId = String(product._id || product.id);
    const exists = wishlist.some(
      (item) =>
        String(item.id) === targetId ||
        String(item._id) === targetId ||
        (item.product && String(item.product) === targetId)
    );

    if (exists) {
        // Optimistic removal: update state & toast immediately
        setWishlist((prev) => {
          const updated = prev.filter(
            (item) =>
              String(item.id) !== targetId &&
              String(item._id) !== targetId &&
              (!item.product || String(item.product) !== targetId)
          );
          return updated;
        });
        toast("Removed from wishlist", {
          icon: "💔",
          style: { borderRadius: "10px", background: "#1e293b", color: "#fff" },
        });

        if (token) {
          try {
            const res = await fetch(`/api/wishlist/${targetId}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              const updated = await res.json();
              setWishlist(updated);
            }
          } catch (err) {
            console.error("Remove from wishlist API error:", err);
          }
        }
      } else {
        // Optimistic addition: update state & toast immediately
        const newItem = {
          id: targetId,
          _id: product._id || targetId,
          name: product.name,
          price: product.price,
          image: product.image,
          category: product.category,
          rating: product.rating || 0,
        };

        setWishlist((prev) => {
          const updated = [...prev, newItem];
          return updated;
        });
        toast.success("Added to wishlist!", {
          icon: "❤️",
          style: { borderRadius: "10px", background: "#1e293b", color: "#fff" },
        });

        if (token) {
          try {
            const res = await fetch(`/api/wishlist/${targetId}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                id: targetId,
                name: product.name,
                price: product.price,
                image: product.image,
                category: product.category,
                rating: product.rating || 0,
              }),
            });
            if (res.ok) {
              const updated = await res.json();
              setWishlist(updated);
            }
          } catch (err) {
            console.error("Add to wishlist API error:", err);
          }
        }
      }
  };

  // ✅ Clear cart
  const clearCart = () => {
    setCart([]);
    localStorage.removeItem("cart");
  };

  return (
    <StoreContext.Provider
      value={{
        cart,
        wishlist,
        wishlistLoading,
        addToCart,
        removeFromCart,
        updateQty,
        toggleWishlist,
        clearCart,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};