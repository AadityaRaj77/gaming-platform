import { prisma } from "../db/prisma.js";
import crypto from "crypto";

export const createTournament = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      name,
      tagline,
      venueType,
      location,
      startDate,
      endDate,
      feeType,
      feeAmount,
      games,
      requirements,
      bannerUrl,
      organizers,
    } = req.body;

    // Create tournament
    const tournament = await prisma.tournament.create({
      data: {
        name,
        tagline,
        venueType,
        location: venueType === "OFFLINE" ? location : null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        createdBy: userId,
        feeType,
        feeAmount: feeType === "PAID" ? Number(feeAmount) : null,
        bannerUrl,
        status: "DRAFT",

        games: {
          create: games.map((g) => ({ game: g })),
        },

        requirements: {
          create: requirements.map((text) => ({
            text,
          })),
        },

        organizers: {
          create: [{ userId }] // creator always an organizer
        },
      },
    });

    // add other organizers by username
    if (organizers?.length) {
      const users = await prisma.user.findMany({
        where: { username: { in: organizers } }
      });

      await prisma.tournamentOrganizer.createMany({
        data: users.map((u) => ({
          userId: u.id,
          tournamentId: tournament.id,
        })),
      });
    }

    res.json({ message: "Tournament created", tournamentId: tournament.id });
  } catch (err) {
    console.error("createTournament error:", err);
    res.status(500).json({ message: "Failed to create tournament" });
  }
};



export const getTournamentById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const userId = req.user.userId;

    const data = await prisma.tournament.findUnique({
      where: { id },
      include: {
        organizers: {
          include: { user: true },
        },
        games: true,
        requirements: true,
      },
    });

    if (!data) return res.status(404).json({ message: "Tournament not found" });

    const isOrganizer = data.organizers.some((o) => o.userId === userId);

    res.json({ ...data, isOrganizer });
  } catch (err) {
    console.error("getTournamentById", err);
    res.status(500).json({ message: "Failed to fetch tournament" });
  }
};


export const getMyOrganizedTournaments = async (req, res) => {
  try {
    const userId = req.user.userId;

    const tournaments = await prisma.tournamentOrganizer.findMany({
      where: { userId },
      include: { tournament: true },
    });

    res.json(tournaments.map((t) => t.tournament));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch tournaments" });
  }
};



export const disbandTournament = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const userId = req.user.userId;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
    });

    if (!tournament) return res.status(404).json({ message: "Not found" });
    if (tournament.createdBy !== userId)
      return res.status(403).json({ message: "Only creator can disband" });

    await prisma.tournament.delete({ where: { id } });

    res.json({ message: "Tournament disbanded" });
  } catch (err) {
    console.error("disband:", err);
    res.status(500).json({ message: "Failed to disband" });
  }
};



export const exitTournament = async (req, res) => {
  try {
    const userId = req.user.userId;
    const id = Number(req.params.id);

    await prisma.tournamentOrganizer.deleteMany({
      where: { userId, tournamentId: id },
    });

    res.json({ message: "Left tournament" });
  } catch (err) {
    console.error("exitTournament:", err);
    res.status(500).json({ message: "Failed to exit" });
  }
};



export const addRoom = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name } = req.body;

    const room = await prisma.tournamentRoom.create({
      data: {
        name,
        tournamentId: id,
      },
    });

    res.json({ message: "Room created", room });
  } catch (err) {
    console.error("addRoom:", err);
    res.status(500).json({ message: "Room create failed" });
  }
};

/**
 * Helper: only the creator can edit/publish in this MVP.
 * If you want organizers to be allowed, change logic to check tournament.organizers
 */

// PUT /api/tournaments/:id/form
export const saveRegistrationForm = async (req, res) => {
  try {
    const tournamentId = Number(req.params.id);
    const userId = req.user.userId;
    const { fields } = req.body;
    // fields = [{ label, fieldType, required, allowMultiple, defaultValue, paymentMeta }]

    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) return res.status(404).json({ message: "Tournament not found" });
    if (tournament.createdBy !== userId)
      return res.status(403).json({ message: "Only creator can edit form" });

    // clear old form
    await prisma.tournamentFormField.deleteMany({
      where: { tournamentId }
    });

    // insert new form
    await prisma.tournamentFormField.createMany({
      data: fields.map(f => ({
        tournamentId,
        label: f.label,
        fieldType: f.fieldType,
        required: f.required ?? true,
        allowMultiple: f.allowMultiple ?? false,
        defaultValue: f.defaultValue ?? null,
        paymentMeta: f.paymentMeta ?? null
      }))
    });

    res.json({ message: "Form saved" });
  } catch (err) {
    console.error("saveRegistrationForm:", err);
    res.status(500).json({ message: "Failed to save form" });
  }
};

// POST /api/tournaments/:id/publish
export const publishTournament = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const userId = req.user.userId;

    const t = await prisma.tournament.findUnique({
      where: { id },
      include: { formFields: true }
    });

    if (!t) return res.status(404).json({ message: "Tournament not found" });
    if (t.createdBy !== userId)
      return res.status(403).json({ message: "Only creator can publish" });

    if (t.formFields.length === 0)
      return res.status(400).json({ message: "Create registration form first" });

    const slug = crypto.randomBytes(3).toString("hex");

    await prisma.tournament.update({
      where: { id },
      data: {
        isHosted: true,
        shareSlug: slug,
        status: "LIVE"
      }
    });

    res.json({ message: "Tournament hosted", shareSlug: slug });
  } catch (err) {
    console.error("publishTournament:", err);
    res.status(500).json({ message: "Publish failed" });
  }
};

// POST /api/tournaments/:id/unpublish
export const unpublishTournament = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const userId = req.user.userId;

    const t = await prisma.tournament.findUnique({ where: { id } });
    if (!t) return res.status(404).json({ message: "Tournament not found" });
    if (t.createdBy !== userId)
      return res.status(403).json({ message: "Only creator can unpublish" });

    await prisma.tournament.update({
      where: { id },
      data: {
        isHosted: false,
        shareSlug: null,
        status: "DRAFT"
      }
    });

    res.json({ message: "Tournament unlisted" });
  } catch (err) {
    console.error("unpublishTournament:", err);
    res.status(500).json({ message: "Unpublish failed" });
  }
};

// GET /api/tournaments/list
export const listPublicTournaments = async (req, res) => {
  try {
    const rows = await prisma.tournament.findMany({
      where: { isHosted: true },
      orderBy: { updatedAt: "desc" },
      include: {
        games: true,
        requirements: true
      }
    });
    res.json(rows);
  } catch (err) {
    console.error("listPublicTournaments:", err);
    res.status(500).json({ message: "List failed" });
  }
};

// GET /api/tournaments/:id/register/:slug
export const getTournamentForRegistration = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const slug = req.params.slug;

    const t = await prisma.tournament.findUnique({ where: { id } });
    if (!t || !t.isHosted || t.shareSlug !== slug) return res.status(404).json({ message: "Registration not available" });

    res.json({
      id: t.id,
      name: t.name,
      tagline: t.tagline,
      bannerUrl: t.bannerUrl,
      registrationForm: t.registrationForm,
      feeType: t.feeType,
      feeAmount: t.feeAmount
    });
  } catch (err) {
    console.error("getTournamentForRegistration:", err);
    res.status(500).json({ message: "Failed" });
  }
};

// POST /api/tournaments/:id/register
export const registerForTournament = async (req, res) => {
  try {
    const tournamentId = Number(req.params.id);
    const userId = req.user.userId;
    const { responses, paymentInfo } = req.body;

    const t = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { formFields: true }
    });

    if (!t || !t.isHosted)
      return res.status(400).json({ message: "Tournament not accepting registrations" });

    for (const f of t.formFields) {
      if (f.required && (responses[f.label] === undefined || responses[f.label] === "")) {
        return res.status(400).json({ message: `${f.label} is required` });
      }
    }

    await prisma.tournamentRegistration.create({
      data: {
        tournamentId,
        userId,
        responses,
        paymentInfo: paymentInfo ?? null
      }
    });

    res.json({ message: "Registered successfully" });
  } catch (err) {
    console.error("registerForTournament:", err);
    res.status(500).json({ message: "Registration failed" });
  }
};