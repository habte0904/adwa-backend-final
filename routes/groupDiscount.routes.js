import { Router } from 'express'
import {
  listGroupDiscounts,
  getOneGroupDiscount,
  createGroupDiscountCtrl,
  updateGroupDiscountCtrl,
  deleteGroupDiscountCtrl,
} from '../controllers/groupDiscount.controller.js'
import {authenticateToken} from "../middlewares/authMiddleware.js";
import {authorizePermissions} from "../middlewares/authorizePermissions.js"; 
// Optionally add auth / permission middlewares here
// import { authenticate } from '../middlewares/authMiddleware.js'

const router = Router()

router.get('/', listGroupDiscounts)
router.get('/:id', getOneGroupDiscount)
router.post('/', authenticateToken,authorizePermissions(["DISCOUNT"]), createGroupDiscountCtrl)
router.put('/:id', authenticateToken,authorizePermissions(["DISCOUNT"]), updateGroupDiscountCtrl)
router.delete('/:id', authenticateToken,authorizePermissions(["DISCOUNT"]), deleteGroupDiscountCtrl)

export default router