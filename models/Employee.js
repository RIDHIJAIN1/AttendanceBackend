const mongoose = require('mongoose');
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');

const { Schema } = mongoose;

// Define the Employee Schema
const employeeSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name cannot be empty'],
      minlength: [1, 'Name length must be between 1 and 255 characters'],
      maxlength: [255, 'Name length must be between 1 and 255 characters'],
    },
    designation: {
      type: String,
      required: [true, 'Designation cannot be empty'],
      minlength: [1, 'Designation length must be between 1 and 255 characters'],
      maxlength: [255, 'Designation length must be between 1 and 255 characters'],
    },
    contact: {
      type: String, // Use String to support phone numbers with "+" or special characters
      required: false,
      validate: {
        validator: function(value) {
          // Allow empty strings
          return value === '' || (value.length >= 1 && value.length <=15);
        },
        message: 'Address length must be between 1 and 15 characters',
      },
 
      validate: {
        validator: function(value) {
          // Allow empty strings
          return value === '' || (value.length >= 1 && value.length <=15);
        },
        message: 'Address length must be between 1 and 15 characters',
      },
 
    },
    hourly_rate: {
      type: Number,
      required: false,
      min: [0, 'Hourly rate cannot be negative'],
    },
   
   
    address: {
      type: String,
      required: false,
      validate: {
        validator: function(value) {
          // Allow empty strings
          return value === '' || (value.length >= 1 && value.length <= 255);
        },
        message: 'Address length must be between 1 and 255 characters',
      },
 
      validate: {
        validator: function(value) {
          // Allow empty strings
          return value === '' || (value.length >= 1 && value.length <= 255);
        },
        message: 'Address length must be between 1 and 255 characters',
      },
 
    },
    identityCard: {
      type: String, // URL or file path to the image
      required: false,
    },
    join_date: {
      type: Date,
      required: [true, 'Join date cannot be empty'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted:{
      type: Boolean,
      default: false,
    },
    deletedAt:{
      type:Date,
    },
    firm:{
      type:String,
      required: [true, 'Firm is required'],
      enum: ['Ashoka Paper Converts','Shree Nakoda Manufacturers', 'Ridhi Enterprises'] // Enum 
    }
  },
  { timestamps: true }
);

// Add pagination plugin
employeeSchema.plugin(aggregatePaginate);

// Export the Employee model
const Employee = mongoose.model('Employee', employeeSchema);
module.exports = Employee;
