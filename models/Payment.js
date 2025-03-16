const mongoose = require("mongoose");
const { Schema } = mongoose;

const paymentSchema = new Schema({
  orderId: { type: String, required: true },
  paymentId: { type: String, required: true },
  amount: { type: Number, required: true },
  email: { type: String, required: true },
  status: { type: String, enum: ["success", "failed"], default: "success" },
}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);
