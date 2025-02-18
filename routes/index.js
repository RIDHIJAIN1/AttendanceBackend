const {Router} = require('express');
const EmployeeController = require('../controllers/EmployeeController');
const AuthController = require('../controllers/AuthController');
const AttendanceController = require('../controllers/AttendanceController');
const PayrollController = require('../controllers/PayrollController');
const { isAuthenticated } = require('../middlewares/Authenticated');
const {upload}  = require('../middlewares/upload');
const { route } = require('../app');
// const upload = require('../utils/multerConfig'); // Import the multer configuration

const router = Router();

// router.get('/', AuthController.index);
router.post('/signup', AuthController.signup);
router.post('/login', AuthController.login);
router.get('/auth/google', AuthController.googleAuth);
router.get('/auth/google/callback', AuthController.googleAuthCallback)



router.post('/employee',isAuthenticated, upload,  EmployeeController.createEmployee);
router.get('/employee',isAuthenticated,EmployeeController.getEmployees);
router.get('/employees/:id',isAuthenticated, EmployeeController.getEmployeeById);
router.put('/employee/:id',isAuthenticated,upload, EmployeeController.updateEmployee);
router.delete('/employee/:id',isAuthenticated, EmployeeController.deleteEmployee);
router.put('/employee/status/:id',isAuthenticated, EmployeeController.toggleEmployeeActiveStatus);


router.post('/attendance/:id',isAuthenticated, AttendanceController.recordAttendance);
router.get('/attendance/:employeeId',isAuthenticated, AttendanceController.fetchAttendanceById);
router.get('/attendance',isAuthenticated, AttendanceController.fetchAttendance);
router.get('/monthlyattendance', AttendanceController.fetchMonthlyAttendance);
router.put('/attendance/:employeeId',isAuthenticated, AttendanceController.updateAttendance);
router.delete('/attendance/:employeeId',isAuthenticated, AttendanceController.deleteAttendance);

router.post('/payroll/:employeeId/:month',isAuthenticated, PayrollController.createOrUpdatePayroll);
router.get('/payroll', PayrollController.getPayrolls);



module.exports = router;