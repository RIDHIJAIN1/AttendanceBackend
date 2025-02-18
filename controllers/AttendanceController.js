const Attendance = require("../models/Attendance");
const Employee = require("../models/Attendance");
// const recordAttendance = async (attendanceData) => {
//     try {
//       const attendance = new Attendance(attendanceData);
//       const savedAttendance = await attendance.save();
//       return savedAttendance;
//     } catch (error) {
//       throw new Error(error.message);
//     }
//   };
const recordAttendance = async (req, res) => {
  const { id } = req.params; // Extracting the employee ID from request parameters

  const attendanceData = req.body; // Extracting attendance data from request body

  try {
    // Ensure checkIn and checkOut are provided
    if (!attendanceData.checkIn || !attendanceData.checkOut) {
      return res
        .status(400)
        .json({ error: "Check-in and Check-out times are required" });
    }

    // Calculate totalHours and overtimeHours
    const checkIn = new Date(attendanceData.checkIn);
    const checkOut = new Date(attendanceData.checkOut);
    const duration = (checkOut - checkIn) / (1000 * 60 * 60); // Convert milliseconds to hours
    attendanceData.totalHours = Math.max(0, duration); // Ensure non-negative
    attendanceData.overtimeHours = Math.max(0, duration - 8); // Assuming 8 hours is standard work time

    // Add the employee ID to the attendance data
    attendanceData.employeeId = id; // Assuming your Attendance model has an employeeId field

    // Save the attendance record
    const attendance = new Attendance(attendanceData);
    const savedAttendance = await attendance.save();

    // Return the saved attendance record
    return res.status(201).json(savedAttendance);
  } catch (error) {
    console.error("Error recording attendance:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const fetchAttendance = async (req, res) => {
  const { employeeId, date, page = 1, limit = 10 } = req.query;

  try {
    const filters = {};

    // Filter by employee ID
    if (employeeId) {
      filters.employeeId = employeeId;
    }

    // Filter by specific date
    if (date) {
      const selectedDate = new Date(date);

      // Convert the selected date to start and end of the UTC day
      const startOfDayUTC = new Date(Date.UTC(
        selectedDate.getUTCFullYear(),
        selectedDate.getUTCMonth(),
        selectedDate.getUTCDate(),
        0, 0, 0
      ));

      const endOfDayUTC = new Date(Date.UTC(
        selectedDate.getUTCFullYear(),
        selectedDate.getUTCMonth(),
        selectedDate.getUTCDate(),
        23, 59, 59, 999
      ));

      filters.date = { $gte: startOfDayUTC, $lte: endOfDayUTC };
    }

 
 

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      populate: "employeeId", // Populate employee details
    };

    const result = await Attendance.paginate(filters, options);

    // Check if attendance records exist
    if (result.docs.length === 0) {
      return res.status(404).json({ message: "No attendance records found." });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching attendance:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};


const fetchMonthlyAttendance = async (req, res) => {
  const { employeeId, month: monthStr, year: yearStr } = req.query;


  try {
    // Parse month and year as integers
    const month = parseInt(monthStr, 10);
    const year = parseInt(yearStr, 10);

    const filters = {};

    // Validate and apply filters
    if (employeeId) {
      filters.employeeId = employeeId;
    }

    if (!isNaN(month) && !isNaN(year)) {
      const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
      const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

      filters.date = { $gte: startOfMonth, $lte: endOfMonth };
    } else {
      console.warn("Invalid month or year provided");
    }


    // Fetch attendance records from the database
    const attendanceRecords = await Attendance.find(filters).populate("employeeId");

    // Combine attendance and wages by employee
    const attendanceByEmployee = {};
    attendanceRecords.forEach((record) => {
      const employeeId = record.employeeId._id.toString();

      // If the employee is not yet in the attendanceByEmployee object, initialize
      if (!attendanceByEmployee[employeeId]) {
        attendanceByEmployee[employeeId] = {
          employeeId,
          name: record.employeeId.name,
          dailyRecords: {},
        };
      }

      // Add daily attendance and wages
      const dateKey = record.date.toISOString().split("T")[0]; // Format date as YYYY-MM-DD
      attendanceByEmployee[employeeId].dailyRecords[dateKey] = {
        isPresent: record.isPresent,
        wages: record.wages || 0,
      };
    });

    // Convert the result into an array
    const combinedResult = Object.values(attendanceByEmployee);

    return res.status(200).json({ attendance: combinedResult });
  } catch (error) {
    console.error("Error fetching monthly attendance:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};



const fetchAttendanceById = async (req, res) => {

  const { employeeId } = req.params; // Extracting the ID from request parameters
;
  try {
    // Fetch attendance record by ID and populate employee details
    const attendance = await Attendance.find({ employeeId }).populate(
      "employeeId"
    );
    // Check if attendance record exists
    if (!attendance || attendance.length === 0) {
      return res
        .status(404)
        .json({ error: "No attendance records found for this employee" });
    }

    // Return the found attendance record
    return res.status(200).json(attendance);
  } catch (error) {
    console.error("Error fetching attendance record:", error.message);
    return res.status(500).json({ error: "Internal server error" }); // Return an error response
  }
};

const updateAttendance = async (req, res) => {
  const { employeeId } = req.params; // Assuming employeeId is passed as a route parameter
  const updateData = req.body; // Fields to update (e.g., checkIn, checkOut)

  try {
    // Validate employeeId and updateData
    if (!employeeId || !updateData) {
      return res.status(400).json({
        success: false,
        message: "Employee ID and update data are required",
      });
    }

    const attendanceDate = new Date(updateData.date); // Force IST timezone
    if (isNaN(attendanceDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format",
      });
    }

    // Convert the date to Indian Standard Time (IST)
    attendanceDate.setHours(attendanceDate.getHours() + 5);
    attendanceDate.setMinutes(attendanceDate.getMinutes() + 30);

    // Normalize the date to the start and end of the day in IST
    const startOfDay = new Date(attendanceDate);
    startOfDay.setUTCHours(0, 0, 0, 0); // Start of the day in IST
    const endOfDay = new Date(attendanceDate);
    endOfDay.setUTCHours(23, 59, 59, 999); // End of the day in IST

    // Attempt to find an existing attendance record for the specific employee and date
    const existingAttendance = await Attendance.findOne({
      employeeId,
      date: { $gte: startOfDay, $lt: endOfDay },
    });

    if (existingAttendance) {
      // If no checkout time is provided, keep the existing one, else update it
      const checkIn = updateData.checkIn || existingAttendance.checkIn;
      const checkOut = updateData.checkOut || existingAttendance.checkOut; // If checkOut is blank, keep the existing value

      let totalHours = existingAttendance.totalHours;
      let overtimeHours = existingAttendance.overtimeHours;

      // If checkOut is provided, calculate total and overtime hours
      if (checkOut) {
        const checkInTime = new Date(checkIn);
        const checkOutTime = new Date(checkOut);

        const duration = (checkOutTime - checkInTime) / (1000 * 60 * 60); // Convert milliseconds to hours
        totalHours = Math.max(0, duration); // Ensure non-negative
        overtimeHours = Math.max(0, totalHours - 8); // Assuming 8 hours is standard work time
      }

      // Update the existing attendance record
      const updatedAttendance = await Attendance.findOneAndUpdate(
        { employeeId, _id: existingAttendance._id },
        {
          $set: {
            checkIn,
            checkOut,
            totalHours,
            overtimeHours,
            wages: updateData.wages || existingAttendance.wages,
          },
        },
        { new: true, runValidators: true }
      );

      // Success response with the updated attendance
      return res.status(200).json({ success: true, data: updatedAttendance });
    } else {
      // If no record was found, create a new attendance record
      const checkIn = new Date(`1970-01-01T${updateData.checkIn}:00Z`).toISOString(); // Use a dummy date for time
      const checkOut = updateData.checkOut || null; // Allow blank checkOut (null)

      let totalHours = 0;
      let overtimeHours = 0;

      // Only calculate hours if checkOut is provided
      if (checkOut) {
        const checkInTime = new Date(checkIn);
        const checkOutTime = new Date(checkOut);

        const duration = (checkOutTime - checkInTime) / (1000 * 60 * 60); // Convert milliseconds to hours
        totalHours = Math.max(0, duration); // Ensure non-negative
        overtimeHours = Math.max(0, totalHours - 8); // Assuming 8 hours is standard work time
      }

      // Create a new attendance record
      const attendanceData = {
        employeeId,
        date: attendanceDate, // Use the parsed date
        checkIn: updateData.checkIn,
        checkOut,
        totalHours,
        overtimeHours,
        wages: updateData.wages || 0, // Assuming wages can be passed in updateData
      };

      const newAttendance = new Attendance(attendanceData);
      const savedAttendance = await newAttendance.save();
      return res.status(201).json({ success: true, data: savedAttendance });
    }
  } catch (error) {
    // Error handling
    console.error("Error updating attendance:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};


const deleteAttendance = async (req, res) => {
  const { employeeId } = req.params; // Extracting the ID from request parameters

  try {
  
    const deletedAttendance = await Attendance.findOneAndDelete(employeeId);
    if (!deletedAttendance) {
      throw new Error("Attendance record not found");
    }
    return res
      .status(200)
      .json({
        message: "Attendance record deleted successfully",
        deletedAttendance,
      });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  recordAttendance,
  deleteAttendance,
  updateAttendance,
  fetchAttendance,
  fetchMonthlyAttendance,
  fetchAttendanceById,
};
