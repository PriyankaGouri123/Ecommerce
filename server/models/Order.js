import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  id: { type: String },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  image: { type: String },
  price: { type: Number, required: true }
});

const trackingStepSchema = new mongoose.Schema({
  status: { type: String, required: true },
  date: { type: Date, default: Date.now },
  location: { type: String, default: "" },
  description: { type: String, default: "" }
});

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderItems: [orderItemSchema],
    shippingAddress: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      pincode: { type: String, required: true }
    },
    paymentMethod: { type: String, required: true, default: "COD" },
    paymentStatus: { type: String, required: true, default: "Pending" },
    totalAmount: { type: Number, required: true },
    couponCode: { type: String, default: "" },
    discountAmount: { type: Number, default: 0 },
    status: { type: String, required: true, default: "Order Placed" },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    paidAt: { type: Date },
    trackingHistory: [trackingStepSchema]
  },
  { timestamps: true }
);

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
export default Order;
