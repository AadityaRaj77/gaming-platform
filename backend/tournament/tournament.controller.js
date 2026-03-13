import { prisma } from "../db/prisma.js";
import crypto from "crypto";

// CREATE TOURNAMENT

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
      organizers
    } = req.body;

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
          create: games.map(g => ({
            gameId: g
          }))
        },

        requirements: {
          create: requirements.map(text => ({
            text
          }))
        },

        organizers: {
          create: [{ userId }]
        }
      }
    });

    if (organizers?.length) {

      const users = await prisma.user.findMany({
        where: { username: { in: organizers } }
      });

      await prisma.tournamentOrganizer.createMany({
        data: users.map(u => ({
          userId: u.id,
          tournamentId: tournament.id
        }))
      });

    }

    res.json({
      message: "Tournament created",
      tournamentId: tournament.id
    });

  } catch (err) {
    console.error("createTournament:", err);
    res.status(500).json({ message: "Failed to create tournament" });
  }
};


// GET TOURNAMENT

export const getTournamentById = async (req, res) => {
  try {

    const id = Number(req.params.id);

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        games: true,
        requirements: true,
        organizers: {
          include: {
            user: { select: { id: true, username: true } }
          }
        }
      }
    });

    if (!tournament)
      return res.status(404).json({ message: "Tournament not found" });

    res.json(tournament);

  } catch (err) {
    console.error("getTournamentById:", err);
    res.status(500).json({ message: "Failed to fetch tournament" });
  }
};


// MY ORGANIZED TOURNAMENTS 

export const getMyOrganizedTournaments = async (req, res) => {
  try {

    const userId = req.user.userId;

    const rows = await prisma.tournamentOrganizer.findMany({
      where: { userId },
      include: {
        tournament: true
      }
    });

    res.json(rows.map(r => r.tournament));

  } catch (err) {
    console.error("getMyOrganizedTournaments:", err);
    res.status(500).json({ message: "Failed to fetch tournaments" });
  }
};


// EXIT TOURNAMENT 

export const exitTournament = async (req, res) => {
  try {

    const userId = req.user.userId;
    const tournamentId = Number(req.params.id);

    await prisma.tournamentOrganizer.deleteMany({
      where: {
        tournamentId,
        userId
      }
    });

    res.json({ message: "Left tournament" });

  } catch (err) {
    console.error("exitTournament:", err);
    res.status(500).json({ message: "Exit failed" });
  }
};


// DISBAND TOURNAMENT

export const disbandTournament = async (req, res) => {
  try {

    const id = Number(req.params.id);
    const userId = req.user.userId;

    const tournament = await prisma.tournament.findUnique({
      where: { id }
    });

    if (!tournament)
      return res.status(404).json({ message: "Tournament not found" });

    if (tournament.createdBy !== userId)
      return res.status(403).json({ message: "Only creator can disband" });

    await prisma.tournament.delete({
      where: { id }
    });

    res.json({ message: "Tournament deleted" });

  } catch (err) {
    console.error("disbandTournament:", err);
    res.status(500).json({ message: "Delete failed" });
  }
};


// SAVE REGISTRATION FORM 

export const saveRegistrationForm = async (req, res) => {
  try {

    const tournamentId = Number(req.params.id);
    const userId = req.user.userId;
    const { fields } = req.body;

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    });

    if (!tournament)
      return res.status(404).json({ message: "Tournament not found" });

    if (tournament.createdBy !== userId)
      return res.status(403).json({ message: "Only creator can edit form" });

    await prisma.tournamentFormField.deleteMany({
      where: { tournamentId }
    });

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
    res.status(500).json({ message: "Form save failed" });
  }
};


// PUBLISH TOURNAMENT

export const publishTournament = async (req, res) => {
  try {

    const id = Number(req.params.id);
    const userId = req.user.userId;

    const t = await prisma.tournament.findUnique({
      where: { id },
      include: { formFields: true }
    });

    if (!t)
      return res.status(404).json({ message: "Tournament not found" });

    if (t.createdBy !== userId)
      return res.status(403).json({ message: "Only creator can publish" });

    if (t.formFields.length === 0)
      return res.status(400).json({ message: "Create registration form first" });

    const slug = crypto.randomBytes(3).toString("hex");

    await prisma.tournament.update({
      where: { id },
      data: {
        shareSlug: slug,
        status: "PUBLISHED"
      }
    });

    res.json({
      message: "Tournament published",
      shareSlug: slug
    });

  } catch (err) {
    console.error("publishTournament:", err);
    res.status(500).json({ message: "Publish failed" });
  }
};


// UNPUBLISH TOURNAMENT

export const unpublishTournament = async (req, res) => {
  try {

    const id = Number(req.params.id);
    const userId = req.user.userId;

    const t = await prisma.tournament.findUnique({
      where: { id }
    });

    if (!t)
      return res.status(404).json({ message: "Tournament not found" });

    if (t.createdBy !== userId)
      return res.status(403).json({ message: "Only creator can unpublish" });

    await prisma.tournament.update({
      where: { id },
      data: {
        shareSlug: null,
        status: "DRAFT"
      }
    });

    res.json({ message: "Tournament unpublished" });

  } catch (err) {
    console.error("unpublishTournament:", err);
    res.status(500).json({ message: "Unpublish failed" });
  }
};


// PUBLIC TOURNAMENT LIST

export const listPublicTournaments = async (req, res) => {
  try {

    const rows = await prisma.tournament.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
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


// GET REGISTRATION PAGE

export const getTournamentForRegistration = async (req, res) => {
  try {

    const id = Number(req.params.id);
    const slug = req.params.slug;

    const t = await prisma.tournament.findUnique({
      where: { id },
      include: { formFields: true }
    });

    if (!t || t.status !== "PUBLISHED" || t.shareSlug !== slug)
      return res.status(404).json({ message: "Registration not available" });

    res.json(t);

  } catch (err) {
    console.error("getTournamentForRegistration:", err);
    res.status(500).json({ message: "Failed" });
  }
};


// REGISTER FOR TOURNAMENT

export const registerForTournament = async (req, res) => {
  try {

    const tournamentId = Number(req.params.id);
    const userId = req.user.userId;
    const { gameId, responses, paymentInfo } = req.body;

    const t = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { formFields: true }
    });

    if (!t || t.status !== "PUBLISHED")
      return res.status(400).json({
        message: "Tournament not accepting registrations"
      });

    for (const f of t.formFields) {

      if (
        f.required &&
        (responses[f.label] === undefined ||
          responses[f.label] === "")
      ) {
        return res.status(400).json({
          message: `${f.label} is required`
        });
      }

    }

    await prisma.tournamentRegistration.create({
      data: {
        tournamentId,
        userId,
        gameId,
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
