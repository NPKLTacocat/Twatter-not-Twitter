import express from "express";
import { protectedRoute } from "../middleware/protectedRoute.js";
import {
  getAllNotifications,
  deleteNotifications,
} from "../controllers/notifications.controller.js";

const router = express.Router();

router.get("/", protectedRoute, getAllNotifications);
router.delete("/", protectedRoute, deleteNotifications);

export default router;
