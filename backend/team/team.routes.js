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
  getTeamMembersAndRequests,
  acceptByRequestId,
  rejectByRequestId
} from "./team.controller.js";

const router = express.Router();

router.post("/create", authMiddleware, createTeam);
router.post("/join", authMiddleware, joinViaCode);

router.get("/:teamId", authMiddleware, getTeamDetails);
router.get("/:teamId/members", authMiddleware, getTeamMembersAndRequests);
router.get("/:teamId/requests", authMiddleware, listJoinRequests);

router.post("/requests/:reqId/accept", authMiddleware, acceptByRequestId);
router.post("/requests/:reqId/reject", authMiddleware, rejectByRequestId);

router.post("/:teamId/accept/:userId", authMiddleware, acceptJoin);
router.post("/:teamId/reject/:userId", authMiddleware, rejectJoin);

router.patch("/:teamId/role", authMiddleware, changeRole);
router.delete("/:teamId/kick/:userId", authMiddleware, kickMember);

export default router;
