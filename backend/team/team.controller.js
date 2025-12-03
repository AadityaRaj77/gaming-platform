import bcrypt from "bcrypt";
import crypto from "crypto";
import { prisma } from "../config/db.js";

const generateTeamCode = () => crypto.randomBytes(4).toString("hex").toUpperCase();

// CREATE TEAM (leader auto-added)
export const createTeam = async (req, res) => {
  try {
    const { name, game, tagline, region, password, maxMembers } = req.body;

    if (!name || !game || !password) {
      return res.status(400).json({ message: "name, game, password required" });
    }

    const existing = await prisma.team.findUnique({ where: { name } });
    if (existing) {
      return res.status(400).json({ message: "Team name already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const teamCode = generateTeamCode();

    // STEP 1: Create team ONLY
    const team = await prisma.team.create({
      data: {
        name,
        game,
        tagline,
        region,
        teamCode,
        passwordHash,
        leaderId: req.user.userId,
        maxMembers: maxMembers || 5
      }
    });

    // STEP 2: FORCE leader into TeamMember table
    await prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId: req.user.userId,
        role: "LEADER"
      }
    });

    res.status(201).json({
      message: "Team created",
      teamId: team.id,
      teamCode
    });
  } catch (err) {
    console.error("createTeam:", err);
    res.status(500).json({ message: "Failed to create team", error: err.message });
  }
};



// JOIN VIA CODE + PASSWORD (creates PENDING request)
export const joinViaCode = async (req, res) => {
  try {
    const { teamCode, password, message } = req.body;

    const team = await prisma.team.findUnique({
      where: { teamCode },
      include: { members: true }
    });

    if (!team) return res.status(404).json({ message: "Invalid team code" });

    const ok = await bcrypt.compare(password, team.passwordHash);
    if (!ok) return res.status(401).json({ message: "Wrong team password" });

    const alreadyMember = team.members.find(m => m.userId === req.user.userId);
    if (alreadyMember) return res.status(400).json({ message: "Already in team" });

    const existingReq = await prisma.teamJoinRequest.findUnique({
      where: { teamId_userId: { teamId: team.id, userId: req.user.userId } }
    });

    if (existingReq) return res.status(400).json({ message: "Request already sent" });

    const reqEntry = await prisma.teamJoinRequest.create({
      data: {
        teamId: team.id,
        userId: req.user.userId,
        message
      }
    });

    res.status(201).json({ message: "Join request sent", reqEntry });
  } catch (err) {
    console.error("joinViaCode:", err);
    res.status(500).json({ message: "Join failed" });
  }
};

// TEAM DETAILS WITH LEADER + MEMBERS
export const getTeamDetails = async (req, res) => {
  try {
    const teamId = Number(req.params.teamId);

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, username: true }
            }
          }
        },
        leader: {
          select: { id: true, username: true }
        }
      }
    });

    if (!team) return res.status(404).json({ message: "Team not found" });

    res.json(team);
  } catch (err) {
    console.error("getTeamDetails:", err);
    res.status(500).json({ message: "Failed to fetch team" });
  }
};



// LIST JOIN REQUESTS (leader only)
export const listJoinRequests = async (req, res) => {
  try {
    const teamId = Number(req.params.teamId);

    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (team.leaderId !== req.user.userId)
      return res.status(403).json({ message: "Leader only" });

    const requests = await prisma.teamJoinRequest.findMany({
      where: { teamId, status: "PENDING" },
      include: { user: { select: { id: true, username: true } } }
    });

    res.json(requests);
  } catch (err) {
    console.error("listJoinRequests:", err);
    res.status(500).json({ message: "Failed to list requests" });
  }
};

// ACCEPT JOIN (leader only)
export const acceptJoin = async (req, res) => {
  try {
    const { teamId, userId } = req.params;

    const team = await prisma.team.findUnique({
      where: { id: Number(teamId) },
      include: { members: true }
    });

    if (team.leaderId !== req.user.userId)
      return res.status(403).json({ message: "Leader only" });

    if (team.members.length >= team.maxMembers)
      return res.status(400).json({ message: "Team full" });

    await prisma.$transaction([
      prisma.teamJoinRequest.update({
        where: { teamId_userId: { teamId: Number(teamId), userId: Number(userId) } },
        data: { status: "ACCEPTED" }
      }),
      prisma.teamMember.create({
        data: {
          teamId: Number(teamId),
          userId: Number(userId),
          role: "MEMBER"
        }
      })
    ]);

    res.json({ message: "User added to team" });
  } catch (err) {
    console.error("acceptJoin:", err);
    res.status(500).json({ message: "Accept failed" });
  }
};

// REJECT JOIN
export const rejectJoin = async (req, res) => {
  const { teamId, userId } = req.params;
  await prisma.teamJoinRequest.update({
    where: { teamId_userId: { teamId: Number(teamId), userId: Number(userId) } },
    data: { status: "REJECTED" }
  });

  res.json({ message: "Request rejected" });
};

// CHANGE ROLE (leader only)
export const changeRole = async (req, res) => {
  const { teamId } = req.params;
  const { userId, role } = req.body;

  const team = await prisma.team.findUnique({ where: { id: Number(teamId) } });
  if (team.leaderId !== req.user.userId)
    return res.status(403).json({ message: "Leader only" });

  const updated = await prisma.teamMember.update({
    where: { teamId_userId: { teamId: Number(teamId), userId: Number(userId) } },
    data: { role }
  });

  res.json(updated);
};

// KICK MEMBER (leader only)
export const kickMember = async (req, res) => {
  const { teamId, userId } = req.params;

  const team = await prisma.team.findUnique({ where: { id: Number(teamId) } });
  if (team.leaderId !== req.user.userId)
    return res.status(403).json({ message: "Leader only" });

  await prisma.teamMember.delete({
    where: { teamId_userId: { teamId: Number(teamId), userId: Number(userId) } }
  });

  res.json({ message: "Member kicked" });
};

// USED BY TeamMembers.jsx
export const getTeamMembersAndRequests = async (req, res) => {
  try {
    const teamId = Number(req.params.teamId);

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: { user: { select: { id: true, username: true } } }
        },
        joinRequests: {
          where: { status: "PENDING" },
          include: { user: { select: { id: true, username: true } } }
        }
      }
    });

    if (!team) return res.status(404).json({ message: "Team not found" });

    res.json({
      members: team.members,
      requests: team.joinRequests,
      isLeader: team.leaderId === req.user.userId
    });
  } catch (err) {
    console.error("getTeamMembersAndRequests:", err);
    res.status(500).json({ message: "Failed to load team members" });
  }
};


//  Wrapper for frontend compatibility
export const acceptByRequestId = async (req, res) => {
  const reqId = Number(req.params.reqId);

  const reqEntry = await prisma.teamJoinRequest.findUnique({
    where: { id: reqId }
  });

  if (!reqEntry) return res.status(404).json({ message: "Request not found" });

  req.params.teamId = reqEntry.teamId;
  req.params.userId = reqEntry.userId;

  return acceptJoin(req, res);
};

// Reject wrapper
export const rejectByRequestId = async (req, res) => {
  const reqId = Number(req.params.reqId);

  const reqEntry = await prisma.teamJoinRequest.findUnique({
    where: { id: reqId }
  });

  if (!reqEntry) return res.status(404).json({ message: "Request not found" });

  req.params.teamId = reqEntry.teamId;
  req.params.userId = reqEntry.userId;

  return rejectJoin(req, res);
};


