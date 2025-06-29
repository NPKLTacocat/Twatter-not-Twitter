import express from "express";
import {
  getUserProfile,
  followUnfollowUser,
  updateUser,
  getSuggestedUser,
} from "../controllers/users.controller.js";
import { protectedRoute } from "../middleware/protectedRoute.js";

const router = express.Router();

router.get("/profile/:username", protectedRoute, getUserProfile);
router.get("/suggested", protectedRoute, getSuggestedUser);
router.post("/follow/:id", protectedRoute, followUnfollowUser);
router.post("/update", protectedRoute, updateUser);

export default router;
