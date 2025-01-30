const Payroll = require("../models/Payroll");
const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");
const mongoose = require("mongoose");

const createOrUpdatePayroll = async (req, res) => {
  const { employeeId, month } = req.params;
  const { currentMonthPayment } = req.body;

  if (!month) {
    return res.status(400).json({ message: "Month is required" });
  }
  try {
    const startOfMonth = new Date(`${month}-01`);
    const endOfMonth = new Date(`${month}-01`);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    // Step 1: Aggregate total hours and overtime for the given employee and month
    const attendanceData = await Attendance.aggregate([
      {
        $match: {
          employeeId: new mongoose.Types.ObjectId(employeeId, Object),
          date: { $gte: startOfMonth, $lt: endOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          totalHours: { $sum: "$totalHours" }, // Sum totalHours for the month
    
          wages: { $sum: "$wages" },
        },
      },
    ]);

    // If no attendance records are found, set totalHours and overtimeHours to 0
    const totalHours =
      attendanceData.length > 0 ? attendanceData[0].totalHours : 0;
   
    const wages = attendanceData.length > 0 ? attendanceData[0].wages : 0;
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      throw new Error("Employee not found");
    }
    const hourlyRate = employee.hourly_rate || 0; // Default to 0 if not set

    // Step 3: Calculate totalPay (regular pay + overtime pay)
    let totalAmt = totalHours * hourlyRate; // Regular pay for regular hours
    let wagesPaid = wages;
    let currentMonthTotal = totalAmt + wagesPaid ;

    let remainingAmt =
      totalAmt - (wagesPaid + currentMonthPayment);

    let payroll = await Payroll.findOne({ employeeId, month });

    if (!payroll) {
      // Create new payroll record if it doesn't exist
      payroll = new Payroll({
        employeeId,
        month,
        totalHours, // Set the totalHours from the attendance aggregation
        hourlyRate,
        totalAmt, // Set the totalPay (calculated from totalHours + overtime)
        wagesPaid,   
        currentMonthTotal,
        currentMonthPayment,
        remainingAmt,
        isPaid: true, // Assuming payroll isn't paid yet
      });
    } else {
      payroll.totalHours = totalHours;
    
      payroll.hourlyRate = hourlyRate;
      payroll.totalAmt = totalAmt;
      payroll.wagesPaid = wagesPaid;
      payroll.currentMonthTotal = currentMonthTotal;
      payroll.currentMonthPayment = currentMonthPayment;
      payroll.remainingAmt = remainingAmt;
    }
    await payroll.save();
    res.status(200).json({
      message: "Payroll created/updated successfully",
      payroll, // Optionally, return the saved payroll document
    });
  } catch (error) {
    console.error("Error creating/updating payroll:", error);
    res.status(500).json({
      message: "Error creating/updating payroll",
      error: error.message,
    });
  }
};

const getPayrolls = async (req, res) => {
  try {
    const { month } = req.query;

    if (!month) {
      return res.status(400).json({ message: "Month is required" });
    }

    const startOfMonth = new Date(`${month}-01`);
    const endOfMonth = new Date(`${month}-01`);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    // Aggregate data from Attendance table
    const attendanceData = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: startOfMonth, $lt: endOfMonth },
        },
      },
      {
        $group: {
          _id: "$employeeId", // Group by employeeId
          totalHours: { $sum: "$totalHours" },   
          wagesPaid: { $sum: "$wages" },
        },
      },
    ]);

    // Join Employee details
    const payrollData = await Promise.all(
      attendanceData.map(async (attendance) => {

        const [employee, payrollRecord] = await Promise.all([
           Employee.findById(attendance._id),
           Payroll.findOne({
            employeeId:attendance._id,
            month
           })
          ])
        if (!employee) {
          return null; // Skip if employee not found
        }

        const hourlyRate = employee.hourly_rate || 0;
        const totalAmt = attendance.totalHours * hourlyRate;
        const currentMonthTotal = totalAmt + attendance.wagesPaid;
        const currentMonthPayment =payrollRecord?.currentMonthPayment|| 0; // Default value if needed
        const remainingAmt =
          totalAmt - (attendance.wagesPaid + currentMonthPayment);

        return {
          employeeId: attendance._id,
          name: employee.name,
          totalHours: attendance.totalHours,
          hourlyRate,
          totalAmt,
          wagesPaid: attendance.wagesPaid,
          currentMonthTotal,
          currentMonthPayment,
          isPaid: payrollRecord?.isPaid || false, // Fetched from Payroll
          remainingAmt,
        };
      })
    );

    // Filter out null values (if any employee was not found)
    const filteredPayrollData = payrollData.filter((data) => data !== null);

    res.status(200).json({
      message: "Payroll data retrieved successfully",
      payroll: filteredPayrollData,
    });
  } catch (error) {
    console.error("Error retrieving payroll data:", error);
    res.status(500).json({
      message: "Error retrieving payroll data",
      error: error.message,
    });
  }
};


// const getPayrolls = async (req, res) => {
//   try {
//     const { month, year, search, page = 1, limit = 10 } = req.query;

//     const query = {};

//     if (month) {
//       query.month = month;
//     }

//     // Search criteria
//     if (search) {
//       query.$or = [
//         { employeeName: { $regex: search, $options: "i" } }, // Searching in `employeeName`
//         { employeeId: { $regex: search, $options: "i" } }, // Searching in `employeeId`
//       ];
//     }

//     // Pagination
//     const skip = (parseInt(page) - 1) * parseInt(limit);

//    const employeeData = await Employee.find()

//     // Fetch data
//     const totalRecords = await Payroll.countDocuments(query);
//     const payrolls = await Payroll.find(query)
//       .sort({ createdAt: -1 }) // Sort by latest
//       .skip(skip)
//       .limit(parseInt(limit))
//       .populate("employeeId", "name") // Assuming `employeeId` is a reference
//       .lean();

//     // Send response
//     res.status(200).json({
//       totalRecords,
//       currentPage: parseInt(page),
//       totalPages: Math.ceil(totalRecords / parseInt(limit)),
//       payrolls,
//     });
//   } catch (error) {
//     console.error("Error fetching payroll records:", error);
//     res
//       .status(500)
//       .json({
//         message: "Error fetching payroll records",
//         error: error.message,
//       });
//   }
// };

// const getPayrollByEmployee = async (employeeId) => {
//   try {
//     const payrolls = await Payroll.find({ employeeId }).sort({ month: -1 });
//     return payrolls;
//   } catch (error) {
//     throw new Error('Error fetching payroll records for employee: ' + error.message);
//   }
// };
// const calculateMonthlyPayroll = async (month) => {
//   try {
//     const payrollSummary = await Payroll.aggregate([
//       { $match: { month } },
//       {
//         $group: {
//           _id: null,
//           totalHours: { $sum: '$totalHours' },
//           totalOvertime: { $sum: '$overtimeHours' },
//           totalPay: { $sum: '$totalPay' },
//           totalAdvanceDeduction: { $sum: '$advanceDeduction' },
//           totalNetPay: { $sum: '$netPay' },
//         },
//       },
//     ]);
//     return payrollSummary[0] || {};
//   } catch (error) {
//     throw new Error('Error calculating monthly payroll: ' + error.message);
//   }
// };
// const markAsPaid = async (payrollId) => {
//   try {
//     const payroll = await Payroll.findByIdAndUpdate(payrollId, { isPaid: true }, { new: true });
//     if (!payroll) throw new Error('Payroll record not found');
//     return payroll;
//   } catch (error) {
//     throw new Error('Error marking payroll as paid: ' + error.message);
//   }
// };
// const generatePayrollSlip = async (employeeId, month) => {
//   try {
//     const payroll = await Payroll.findOne({ employeeId, month }).populate('employeeId', 'name designation hourly_rate');
//     if (!payroll) throw new Error('Payroll record not found for the specified employee and month');

//     return {
//       employee: payroll.employeeId.name,
//       designation: payroll.employeeId.designation,
//       hourlyRate: payroll.employeeId.hourly_rate,
//       totalHours: payroll.totalHours,
//       overtimeHours: payroll.overtimeHours,
//       totalPay: payroll.totalPay,
//       advanceDeduction: payroll.advanceDeduction,
//       netPay: payroll.netPay,
//       isPaid: payroll.isPaid,
//       month: payroll.month,
//     };
//   } catch (error) {
//     throw new Error('Error generating payroll slip: ' + error.message);
//   }
// };
// const getUnpaidPayrolls = async () => {
//   try {
//     const unpaidPayrolls = await Payroll.find({ isPaid: false }).populate('employeeId', 'name designation');
//     return unpaidPayrolls;
//   } catch (error) {
//     throw new Error('Error fetching unpaid payrolls: ' + error.message);
//   }
// };
// const generateAnnualReport = async (year) => {
//   try {
//     const annualReport = await Payroll.aggregate([
//       { $match: { month: { $regex: `^${year}` } } },
//       {
//         $group: {
//           _id: '$employeeId',
//           totalHours: { $sum: '$totalHours' },
//           totalOvertime: { $sum: '$overtimeHours' },
//           totalPay: { $sum: '$totalPay' },
//           totalAdvanceDeduction: { $sum: '$advanceDeduction' },
//           totalNetPay: { $sum: '$netPay' },
//         },
//       },
//       {
//         $lookup: {
//           from: 'employees',
//           localField: '_id',
//           foreignField: '_id',
//           as: 'employeeDetails',
//         },
//       },
//       { $unwind: '$employeeDetails' },
//       {
//         $project: {
//           employeeName: '$employeeDetails.name',
//           designation: '$employeeDetails.designation',
//           totalHours: 1,
//           totalOvertime: 1,
//           totalPay: 1,
//           totalAdvanceDeduction: 1,
//           totalNetPay: 1,
//         },
//       },
//     ]);
//     return annualReport;
//   } catch (error) {
//     throw new Error('Error generating annual payroll report: ' + error.message);
//   }
// };

module.exports = {
  createOrUpdatePayroll,
  getPayrolls,
  // createPayroll,
  // generateAnnualReport,
  // generatePayrollSlip,
  // getPayrollByMonth,
  // getUnpaidPayrolls,
  // markAsPaid,
  // updatePayroll,
  // deletePayroll,
  // getPayrollByEmployee,
  // calculateMonthlyPayroll
};
