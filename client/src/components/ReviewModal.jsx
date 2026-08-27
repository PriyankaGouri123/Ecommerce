import { useState, useContext, useRef, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";

const MAX_PHOTOS = 5;
const RATING_LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

export default function ReviewModal({
  isOpen,
  onClose,
  product,
  orderId,
  existingReview, // pass this when editing
  onReviewSuccess,
}) {
  const { token } = useContext(AuthContext);
  const isEditMode = !!existingReview;

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState([]); // array of { dataUrl, name }
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Pre-fill when editing
  useEffect(() => {
    if (isOpen) {
      if (existingReview) {
        setRating(existingReview.rating || 0);
        setComment(existingReview.comment || "");
        setPhotos(
          (existingReview.photos || []).map((url) => ({ dataUrl: url, name: "uploaded" }))
        );
      } else {
        setRating(0);
        setComment("");
        setPhotos([]);
      }
    }
  }, [isOpen, existingReview]);

  if (!isOpen) return null;

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    if (photos.length + files.length > MAX_PHOTOS) {
      toast.error(`You can upload a maximum of ${MAX_PHOTOS} photos.`);
      return;
    }

    files.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image.`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds the 5MB limit.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotos((prev) => [...prev, { dataUrl: ev.target.result, name: file.name }]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input so same file can be re-selected after removal
    e.target.value = "";
  };

  const removePhoto = (idx) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a rating.");
      return;
    }

    setLoading(true);
    try {
      const photoDataUrls = photos.map((p) => p.dataUrl);

      let res;
      if (isEditMode) {
        // PUT to update
        res = await fetch(`/api/reviews/${existingReview._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ rating, comment, photos: photoDataUrls }),
        });
      } else {
        // POST to create
        res = await fetch("/api/reviews", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            product: product._id || product.id,
            order: orderId,
            rating,
            comment,
            photos: photoDataUrls,
          }),
        });
      }

      const data = await res.json();
      if (res.ok) {
        toast.success(isEditMode ? "Review updated successfully!" : "Review submitted successfully!");
        if (onReviewSuccess) onReviewSuccess(data);
        onClose();
      } else {
        toast.error(data.message || "Failed to submit review.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while submitting.");
    } finally {
      setLoading(false);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {isEditMode ? "Edit Your Review" : "Write a Review"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-200 transition-all"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col overflow-y-auto">
          <div className="px-6 py-5 space-y-6">
            {/* Product Info */}
            <div className="flex items-center gap-4">
              {product?.image ? (
                <img src={product.image} alt={product.name} className="w-16 h-16 rounded-xl object-cover shadow-sm border border-gray-100 dark:border-gray-700" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-2xl">🛍️</div>
              )}
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Reviewing</p>
                <h3 className="font-bold text-gray-900 dark:text-white text-base leading-snug">{product?.name || "Product"}</h3>
              </div>
            </div>

            {/* Star Rating */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Your Rating <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className={`text-4xl transition-all duration-150 focus:outline-none hover:scale-110 ${
                      star <= displayRating ? "text-yellow-400 drop-shadow-sm" : "text-gray-200 dark:text-gray-600"
                    }`}
                  >
                    ★
                  </button>
                ))}
                {displayRating > 0 && (
                  <span className="ml-2 text-sm font-semibold text-yellow-500">
                    {RATING_LABELS[displayRating]}
                  </span>
                )}
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Your Review <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What did you like or dislike about this product? Share your experience to help others."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/60 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none h-28 text-sm transition-all"
              />
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Add Photos <span className="text-gray-400 font-normal">(Optional, up to {MAX_PHOTOS})</span>
              </label>

              <div className="flex flex-wrap gap-3">
                {/* Existing photo previews */}
                {photos.map((photo, idx) => (
                  <div key={idx} className="relative group w-20 h-20 rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-600 shadow-sm flex-shrink-0">
                    <img src={photo.dataUrl} alt={`upload-${idx}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xl transition-opacity rounded-xl"
                      title="Remove photo"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {/* Upload trigger button */}
                {photos.length < MAX_PHOTOS && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-blue-400 hover:text-blue-500 dark:hover:border-blue-400 dark:hover:text-blue-400 transition-all flex-shrink-0"
                  >
                    <span className="text-2xl leading-none">📷</span>
                    <span className="text-xs font-medium">Add Photo</span>
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotoChange}
              />

              {photos.length > 0 && (
                <p className="text-xs text-gray-400 mt-2">
                  {photos.length}/{MAX_PHOTOS} photos added. Hover a photo to remove it.
                </p>
              )}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold rounded-xl transition text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition disabled:opacity-60 disabled:cursor-not-allowed text-sm shadow-md shadow-blue-500/20"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                  {isEditMode ? "Updating..." : "Submitting..."}
                </span>
              ) : (
                isEditMode ? "Update Review" : "Submit Review"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
