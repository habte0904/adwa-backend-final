import express from 'express';
import * as userController from '../controllers/user.controller.js';

const router = express.Router();

// EMPLOYEE routes
router.get('/users/employees', userController.getAllEmployees);
router.get('/users/employee/:id', userController.getEmployeeById);
router.put('/users/employee/:id', userController.updateEmployee);
router.delete('/users/employee/:id', userController.deleteEmployee);

router.post('/users/employee/register', userController.requestEmployeeRegistration);
router.post('/users/employee/verify', userController.verifyEmployeeRegistration);

// VISITOR routes
router.get('/users/visitors', userController.getAllVisitors);
router.get('/users/visitor/:id', userController.getVisitorById);
router.put('/users/visitor/:id', userController.updateVisitor);
router.delete('/users/visitor/:id', userController.deleteVisitor);
router.post('/users/visitor/verify', userController.verifyVisitorRegistration);
router.post('/users/visitor/request', userController.requestVisitorRegistration);

export default router;
