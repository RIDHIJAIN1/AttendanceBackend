const Employee = require("../models/Employee");

const createEmployee = async (req, res) => {
  try {
    const employeeData = req.body; // Get the employee data from the body
    const file = req.files.identityCard ? req.files.identityCard[0] : null; // Access the uploaded file

    // Validate required fields
    const { name, designation, join_date } = employeeData;
    if (!name || !designation || !join_date) {
      throw new Error('Name, designation, and join date are required');
    }

    const existingEmployee = await Employee.findOne({ name });
    if (existingEmployee) {
      throw new Error('An employee with this name already exists');
    }

    // Validate the uploaded file
    if(file){
    if ( !file.mimetype.startsWith('image/')) {
      throw new Error('Invalid or missing identity card image');
    }
    employeeData.identityCard = file.path; // Use the file path
  }
    // Add file path to employeeData
   

    // Create and save the employee
    const employee = new Employee(employeeData);
    const savedEmployee = await employee.save();
    return res.status(201).json(savedEmployee); // Return the saved employee
  } catch (error) {
    console.error('Error creating employee:', error.message);
    return res.status(400).json({ error: error.message });
  }
};

const getEmployees = async (req, res) => {
  try {
    // Get query parameters
    const { search } = req.query;

      // Build the query
      const query = {isDeleted : false};
      if (search) {
          // Assuming you're searching by name or designation
          query.$or = [
              { name: { $regex: search, $options: 'i' } }, // Case-insensitive search
              { designation: { $regex: search, $options: 'i' } }
          ];
      }

    // Fetch all employees matching the query
    const employees = await Employee.find(query).exec();

    // Get the total count of employees
    const totalEmployees = employees.length;

    // Send response
    res.status(200).json({
      totalEmployees,
      employees
    });
  } catch (error) {
    console.error('Error fetching employees:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};




const getEmployeeById = async (req, res) => {
  const { id } = req.params;
  try {
      // Fetch the employee by ID
      const employee = await Employee.findOne({_id:id , isDeleted:false});
      
      console.log(id);
      console.log(employee);

      // Check if employee exists
      if (!employee) {
          return res.status(404).json({ error: 'Employee not found' });
      }

      // Send the employee data as a response
      return res.status(200).json(employee);
  } catch (error) {
      console.error('Error fetching employee:', error.message);
      return res.status(500).json({ error: 'Internal server error' });
  }
};

// const updateEmployee = async (req, res) => {
//   const { id } = req.params; // Employee ID from URL
//   const updates = req.body; // Fields to update
//   const file = req.files.identityCard ? req.files.identityCard[0] : null;

//   try {

//     if (file) {
//       if (!file.mimetype.startsWith("image/")) {
//         return res.status(400).json({ error: "Invalid file type for identity card" });
//       }
//       updates.identityCard = file.path; // Set file path in the updates
//     }
//     // Check if employee exists and update dynamically
//     const updatedEmployee = await Employee.findByIdAndUpdate(
//       id,
//       { $set: updates }, // Update only provided fields
//       { new: true, runValidators: true } // Return updated doc & validate fields
//     );

//     if (!updatedEmployee) {
//       return res.status(404).json({ error: 'Employee not found' });
//     }

//     return res.status(200).json(updatedEmployee); // Return updated data
//   } catch (error) {
//     console.error('Error updating employee:', error.message);
//     if (error.kind === 'ObjectId') {
//       return res.status(400).json({ error: 'Invalid employee ID' });
//     }
//     return res.status(500).json({ error: 'Internal server error' });
//   }
// };
const updateEmployee = async (req, res) => {
  const { id } = req.params; // Employee ID from URL
  const updates = req.body; // Fields to update
  const file = req.files.identityCard ? req.files.identityCard[0] : null;

  try {

    if (file) {
      if (!file.mimetype.startsWith("image/")) {
        return res.status(400).json({ error: "Invalid file type for identity card" });
      }
      updates.identityCard = file.path; // Set file path in the updates
    }
    // Check if employee exists and update dynamically
    const updatedEmployee = await Employee.findByIdAndUpdate(
      id,
      { $set: updates }, // Update only provided fields
      { new: true, runValidators: true } // Return updated doc & validate fields
    );

    if (!updatedEmployee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    return res.status(200).json(updatedEmployee); // Return updated data
  } catch (error) {
    console.error('Error updating employee:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Invalid employee ID' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
};




  const deleteEmployee = async (req,res) => {
    const {id} = req.params
    try {
      const deletedEmployee = await Employee.findByIdAndUpdate(id,
        {isDeleted : true , deletedAt: new Date()},
        {new : true}
      );
      if (!deletedEmployee) {
        throw new Error('Employee not found');
      }
      return res.status(200).json(deletedEmployee);
    } catch (error) {
      console.error('Error deleting employee:', error.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };

  const toggleEmployeeActiveStatus = async (req,res) => {
    const {id} = req.params;
    try {
      const employee = await Employee.findById(id);
      if (!employee) {
        throw new Error('Employee not found');
      }
      employee.isActive = !employee.isActive;
      const updatedEmployee = await employee.save();
      return res.status(200).json(updatedEmployee);
    } catch (error) {
      console.error('Error toggling status :', error.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };

  module.exports = {
    createEmployee,
    getEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee,
    toggleEmployeeActiveStatus,
  };
  
  
  