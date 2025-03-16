const mongoose = require('mongoose');
const { Schema } = mongoose;

const OrderSchema = new Schema({
    orderId: { type: String, required: true, unique: true }, // Razorpay Order ID
    email: { type: String, required: true }, 
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    status: { type: String, enum: ["created", "paid", "failed"], default: "created" },
    paymentId: { type: String, default: null }, 
    razorpaySignature: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Order', OrderSchema);
