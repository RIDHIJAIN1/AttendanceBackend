const mongoose = require('mongoose');
const { Schema } = mongoose;
const mongoosePaginate = require('mongoose-paginate-v2');


const attendanceSchema = new Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee', // Reference to Employee model
      required: [true, 'Employee ID is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    isPresent:{
      type: Boolean,
      default: true,
    },
    checkIn: {
      type: String, // Change to String if only time is needed
      required: [true, 'Check-in time is required'],
      validate: {
        validator: (value) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(value), // HH:mm format validation
        message: "Invalid time format, should be HH:mm",
      },
    },
    checkOut: {
      type: String, // Change to String if only time is needed
      // required: [true, 'Check-out time is required'],
      // validate: {
      //   validator: (value) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(value), // HH:mm format validation
      //   message: "Invalid time format, should be HH:mm",
      // },
    },
    totalHours: {
      type: String,
      required: true,
      default: 0, // Automatically calculated
      // min: [0, 'Total hours cannot be negative'],
    },
    overtimeHours: {
      type: Number,
      required: false,
      default: 0, // Automatically calculated
      min: [0, 'Overtime hours cannot be negative'],
    },
    wages: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

attendanceSchema.plugin(mongoosePaginate); // Add the pagination plugin
const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
