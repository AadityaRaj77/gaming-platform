import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";

import {
  createTeam,
  joinViaCode,
  getTeamDetails,
  listJoinRequests,
  acceptJoin,
  rejectJoin,
  changeRole,
  kickMember,
  leaveTeam
} from "./team.controller.js";

const router = express.Router();

router.post("/create", authMiddleware, createTeam);
router.post("/join", authMiddleware, joinViaCode);

router.get("/:teamId", authMiddleware, getTeamDetails);

router.get("/:teamId/requests", authMiddleware, listJoinRequests);
router.post("/:teamId/accept/:userId", authMiddleware, acceptJoin);
router.post("/:teamId/reject/:userId", authMiddleware, rejectJoin);

router.patch("/:teamId/role", authMiddleware, changeRole);
router.delete("/:teamId/kick/:userId", authMiddleware, kickMember);

router.post("/:teamId/leave", authMiddleware, leaveTeam);

export default router;
