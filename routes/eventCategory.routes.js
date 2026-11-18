import express from 'express';
import {
  getCategoriesEvtMngmt,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/eventCategory.controller.js';

import {authenticateToken} from "../middlewares/authMiddleware.js";
import {authorizePermissions} from "../middlewares/authorizePermissions.js"; 
const router = express.Router();



// Get all categories for manage events
router.get('/manage-events/event-category', authenticateToken,authorizePermissions(["EVT_CRUD","EVT_CATEGORY"]),getCategoriesEvtMngmt);
// Create new category
// Get all categories
router.get('/event-category', authenticateToken,authorizePermissions(["EVT_CRUD","EVT_CATEGORY"]),getAllCategories);
// Create new category
router.post('/event-category', authenticateToken,authorizePermissions(["EVT_CATEGORY"]),createCategory);
// Update category
router.put('/event-category/:id', authenticateToken,authorizePermissions(["EVT_CATEGORY"]),updateCategory);
// Delete category
router.delete('/event-category/:id', authenticateToken,authorizePermissions(["EVT_CATEGORY"]),deleteCategory);

export default router;

