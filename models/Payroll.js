const mongoose = require('mongoose');
const { Schema } = mongoose;

const payrollSchema = new Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    month: {
      type: String, // Format: "YYYY-MM"
      required: true,
    },
    totalHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    overtimeHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    hourlyRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmt: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    wagesPaid:{
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    advanceDeduction: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    remainingAmt:{
      type: Number,
      required: true,
      default: 0,
    
    },
    currentMonthTotal: {
      type: Number,
      required: true,
      default: 0,
    
    },
    currentMonthPayment:{
      type: Number,
      required: true,
      default: 0,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Pre-save middleware to calculate netPay
// payrollSchema.pre('save', function (next) {
//   // Net Pay = Total Pay - Advance Deduction
//   this.netPay = Math.max(0, this.totalPay - this.advanceDeduction);
//   next();
// });

const Payroll = mongoose.model('Payroll', payrollSchema);
module.exports = Payroll;
