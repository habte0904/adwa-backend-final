import { Router } from 'express';
import {
  getServiceCategories,
  createServiceCategory,
  updateServiceCategory,
  deleteServiceCategory
} from '../controllers/serviceCategory.controller.js';
import {authenticateToken} from "../middlewares/authMiddleware.js";
import {authorizePermissions} from "../middlewares/authorizePermissions.js"; 
const router = Router();

// GET all service categories
router.get('/svc-category-CRUD',  authenticateToken,authorizePermissions(["SVC_CATEGORY"]),getServiceCategories);

// CREATE a new service category
router.post('/svc-category-CRUD',  authenticateToken,authorizePermissions(["SVC_CATEGORY"]),createServiceCategory);

// UPDATE a service category
router.put('/service-categories/:id',  authenticateToken,authorizePermissions(["SVC_CATEGORY"]),updateServiceCategory);

// DELETE a service category
router.delete('/service-categories/:id',  authenticateToken,authorizePermissions(["SVC_CATEGORY"]),deleteServiceCategory);

export default router;

