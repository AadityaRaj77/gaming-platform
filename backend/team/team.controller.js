import { prisma } from "../db/prisma.js";
import { emitToUser } from "../socketBus.js";

const getTeamId = (value) => {
  const teamId = Number(value);
  return Number.isInteger(teamId) && teamId > 0 ? teamId : null;
};

const isValidRole = (role) => ["LEADER", "MEMBER", "MODERATOR"].includes(role);

const requireLeader = async (teamId, userId) => {
  return prisma.teamMember.findFirst({
    where: { teamId, userId, role: "LEADER" }
  });
};

export const createTeam = async (req, res) => {
  try {
    const { name, gameId, tagline, region, maxMembers } = req.body;
    const normalizedName = typeof name === "string" ? name.trim() : "";
    const parsedGameId = Number(gameId);
    const parsedMaxMembers = maxMembers === undefined ? 5 : Number(maxMembers);

    if (!normalizedName || !Number.isInteger(parsedGameId) || parsedGameId <= 0) {
      return res.status(400).json({ message: "Valid name and gameId are required" });
    }

    if (!Number.isInteger(parsedMaxMembers) || parsedMaxMembers < 1) {
      return res.status(400).json({ message: "maxMembers must be a positive integer" });
    }

    const existing = await prisma.team.findUnique({ where: { name: normalizedName } });
    if (existing) return res.status(400).json({ message: "Team name already exists" });

    const game = await prisma.game.findUnique({ where: { id: parsedGameId } });
    if (!game || !game.isActive) {
      return res.status(400).json({ message: "Invalid or inactive game" });
    }

    const team = await prisma.team.create({
      data: {
        name: normalizedName,
        gameId: parsedGameId,
        tagline: typeof tagline === "string" ? tagline.trim() || null : null,
        region: typeof region === "string" ? region.trim() || null : null,
        maxMembers: parsedMaxMembers,
        members: { create: { userId: req.user.userId, role: "LEADER" } }
      }
    });

    res.status(201).json({ message: "Team created", teamId: team.id });
  } catch (err) {
    console.error("createTeam:", err);
    res.status(500).json({ message: "Failed to create team" });
  }
};

export const joinViaCode = async (req, res) => {
  try {
    const teamId = getTeamId(req.body?.teamId);
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : null;

    if (!teamId) return res.status(400).json({ message: "Valid teamId is required" });

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true }
    });
    if (!team) return res.status(404).json({ message: "Team not found" });

    if (team.members.length >= team.maxMembers) {
      return res.status(400).json({ message: "Team is full" });
    }

    if (team.members.some(m => m.userId === req.user.userId)) {
      return res.status(400).json({ message: "Already in team" });
    }

    const existingReq = await prisma.teamJoinRequest.findUnique({
      where: { teamId_userId: { teamId, userId: req.user.userId } }
    });
    if (existingReq?.status === "PENDING") {
      return res.status(400).json({ message: "Request already sent" });
    }

    const reqEntry = existingReq
      ? await prisma.teamJoinRequest.update({
          where: { teamId_userId: { teamId, userId: req.user.userId } },
          data: { status: "PENDING", message }
        })
      : await prisma.teamJoinRequest.create({
          data: { teamId, userId: req.user.userId, message }
        });

    res.status(201).json({ message: "Join request sent", reqEntry });
  } catch (err) {
    console.error("joinViaCode:", err);
    res.status(500).json({ message: "Join failed" });
  }
};

export const getTeamDetails = async (req, res) => {
  try {
    const teamId = getTeamId(req.params.teamId);
    if (!teamId) return res.status(400).json({ message: "Invalid teamId" });

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: { include: { user: { select: { id: true, username: true } } } } }
    });
    if (!team) return res.status(404).json({ message: "Team not found" });

    const leader = team.members.find(m => m.role === "LEADER");
    res.json({ ...team, leader });
  } catch (err) {
    console.error("getTeamDetails:", err);
    res.status(500).json({ message: "Failed to fetch team" });
  }
};

export const listJoinRequests = async (req, res) => {
  try {
    const teamId = getTeamId(req.params.teamId);
    if (!teamId) return res.status(400).json({ message: "Invalid teamId" });

    if (!(await requireLeader(teamId, req.user.userId))) {
      return res.status(403).json({ message: "Leader only" });
    }

    const requests = await prisma.teamJoinRequest.findMany({
      where: { teamId, status: "PENDING" },
      include: { user: { select: { id: true, username: true } } }
    });
    res.json(requests);
  } catch (err) {
    console.error("listJoinRequests:", err);
    res.status(500).json({ message: "Failed to fetch join requests" });
  }
};

export const acceptJoin = async (req, res) => {
  try {
    const teamId = getTeamId(req.params.teamId);
    const userId = Number(req.params.userId);
    if (!teamId || !Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ message: "Invalid teamId or userId" });
    }

    if (!(await requireLeader(teamId, req.user.userId))) {
      return res.status(403).json({ message: "Leader only" });
    }

    const team = await prisma.team.findUnique({ where: { id: teamId }, include: { members: true } });
    if (!team) return res.status(404).json({ message: "Team not found" });
    if (team.members.length >= team.maxMembers) return res.status(400).json({ message: "Team full" });

    const request = await prisma.teamJoinRequest.findUnique({
      where: { teamId_userId: { teamId, userId } }
    });
    if (!request || request.status !== "PENDING") {
      return res.status(404).json({ message: "Pending join request not found" });
    }

    await prisma.$transaction([
      prisma.teamJoinRequest.update({
        where: { teamId_userId: { teamId, userId } },
        data: { status: "ACCEPTED" }
      }),
      prisma.teamMember.create({ data: { teamId, userId, role: "MEMBER" } })
    ]);

    emitToUser(userId, "joinAccepted", { teamId });
    res.json({ message: "User added to team" });
  } catch (err) {
    console.error("acceptJoin:", err);
    res.status(500).json({ message: "Accept failed" });
  }
};

export const rejectJoin = async (req, res) => {
  try {
    const teamId = getTeamId(req.params.teamId);
    const userId = Number(req.params.userId);
    if (!teamId || !Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ message: "Invalid teamId or userId" });
    }

    if (!(await requireLeader(teamId, req.user.userId))) {
      return res.status(403).json({ message: "Leader only" });
    }

    const request = await prisma.teamJoinRequest.findUnique({
      where: { teamId_userId: { teamId, userId } }
    });
    if (!request || request.status !== "PENDING") {
      return res.status(404).json({ message: "Pending join request not found" });
    }

    await prisma.teamJoinRequest.update({
      where: { teamId_userId: { teamId, userId } },
      data: { status: "REJECTED" }
    });
    res.json({ message: "Request rejected" });
  } catch (err) {
    console.error("rejectJoin:", err);
    res.status(500).json({ message: "Reject failed" });
  }
};

export const changeRole = async (req, res) => {
  try {
    const teamId = getTeamId(req.params.teamId);
    const userId = Number(req.body?.userId);
    const role = req.body?.role;
    if (!teamId || !Number.isInteger(userId) || userId <= 0 || !isValidRole(role)) {
      return res.status(400).json({ message: "Invalid teamId, userId or role" });
    }

    if (!(await requireLeader(teamId, req.user.userId))) {
      return res.status(403).json({ message: "Leader only" });
    }

    const member = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } }
    });
    if (!member) return res.status(404).json({ message: "Member not found" });

    if (userId === req.user.userId && role !== "LEADER") {
      return res.status(400).json({ message: "Leader cannot demote themselves" });
    }

    const updated = await prisma.teamMember.update({
      where: { teamId_userId: { teamId, userId } },
      data: { role }
    });
    res.json(updated);
  } catch (err) {
    console.error("changeRole:", err);
    res.status(500).json({ message: "Role update failed" });
  }
};

export const kickMember = async (req, res) => {
  try {
    const teamId = getTeamId(req.params.teamId);
    const userId = Number(req.params.userId);
    if (!teamId || !Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ message: "Invalid teamId or userId" });
    }

    if (!(await requireLeader(teamId, req.user.userId))) {
      return res.status(403).json({ message: "Leader only" });
    }

    const member = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } }
    });
    if (!member) return res.status(404).json({ message: "Member not found" });
    if (userId === req.user.userId) return res.status(400).json({ message: "Leader cannot kick themselves" });
    if (member.role === "LEADER") return res.status(400).json({ message: "Leader cannot be kicked" });

    await prisma.teamMember.delete({
      where: { teamId_userId: { teamId, userId } }
    });
    res.json({ message: "Member kicked" });
  } catch (err) {
    console.error("kickMember:", err);
    res.status(500).json({ message: "Kick failed" });
  }
};

export const leaveTeam = async (req, res) => {
  try {
    const teamId = getTeamId(req.params.teamId);
    if (!teamId) return res.status(400).json({ message: "Invalid teamId" });

    const userId = req.user.userId;
    const newLeaderId = Number(req.body?.newLeaderId);
    const members = await prisma.teamMember.findMany({ where: { teamId } });
    const self = members.find(m => m.userId === userId);

    if (!self) return res.status(404).json({ message: "Not a member" });

    if (self.role === "LEADER" && members.length === 1) {
      await prisma.team.delete({ where: { id: teamId } });
      return res.json({ message: "Team disbanded" });
    }

    if (self.role === "LEADER") {
      if (!Number.isInteger(newLeaderId) || newLeaderId <= 0 || newLeaderId === userId) {
        return res.status(400).json({ message: "Valid newLeaderId required" });
      }

      const newLeader = members.find(m => m.userId === newLeaderId);
      if (!newLeader) return res.status(400).json({ message: "New leader must be a team member" });

      await prisma.$transaction([
        prisma.teamMember.update({
          where: { teamId_userId: { teamId, userId: newLeaderId } },
          data: { role: "LEADER" }
        }),
        prisma.teamMember.delete({
          where: { teamId_userId: { teamId, userId } }
        })
      ]);
      return res.json({ message: "Leader transferred and you left" });
    }

    await prisma.teamMember.delete({ where: { teamId_userId: { teamId, userId } } });
    res.json({ message: "Left team successfully" });
  } catch (err) {
    console.error("leaveTeam:", err);
    res.status(500).json({ message: "Leave failed" });
  }
};
