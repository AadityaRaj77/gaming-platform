import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  createTournament,
  getTournamentById,
  getMyOrganizedTournaments,
  disbandTournament,
  exitTournament,
  addRoom,
  saveRegistrationForm,
  publishTournament,
  unpublishTournament,
  registerForTournament,
  listPublicTournaments,
  getTournamentForRegistration
} from "./tournament.controller.js";

const router = express.Router();

router.post("/create", authMiddleware, createTournament);
router.get("/:id", authMiddleware, getTournamentById);
router.get("/", authMiddleware, getMyOrganizedTournaments);
router.post("/:id/exit", authMiddleware, exitTournament);
router.delete("/:id/disband", authMiddleware, disbandTournament);
router.post("/:id/rooms", authMiddleware, addRoom);
router.put("/:id/form", authMiddleware, saveRegistrationForm);
router.post("/:id/publish", authMiddleware, publishTournament);
router.post("/:id/unpublish", authMiddleware, unpublishTournament);
router.get("/list", listPublicTournaments);
router.get("/:id", async (req, res) => {
  res.status(501).json({ message: "use existing getTournament" });
});
router.get("/:id/register/:slug", getTournamentForRegistration);
router.post("/:id/register", registerForTournament);

export default router;
