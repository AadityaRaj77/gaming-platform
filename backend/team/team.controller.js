import { prisma } from "../db/prisma.js";
import { emitToUser } from "../socketBus.js";

// CREATE TEAM 

export const createTeam = async (req, res) => {
  try {
    const { name, gameId, tagline, region, maxMembers } = req.body;

    if (!name || !gameId) {
      return res.status(400).json({ message: "name and gameId required" });
    }

    const existing = await prisma.team.findUnique({
      where: { name }
    });

    if (existing) {
      return res.status(400).json({ message: "Team name already exists" });
    }

    const team = await prisma.team.create({
      data: {
        name,
        gameId,
        tagline: tagline || null,
        region: region || null,
        maxMembers: maxMembers || 5,
        members: {
          create: {
            userId: req.user.userId,
            role: "LEADER"
          }
        }
      }
    });

    res.status(201).json({
      message: "Team created",
      teamId: team.id
    });

  } catch (err) {
    console.error("createTeam:", err);
    res.status(500).json({ message: "Failed to create team" });
  }
};


// JOIN TEAM

export const joinViaCode = async (req, res) => {
  try {
    const { teamId, message } = req.body;

    const team = await prisma.team.findUnique({
      where: { id: Number(teamId) },
      include: { members: true }
    });

    if (!team)
      return res.status(404).json({ message: "Team not found" });

    const alreadyMember = team.members.find(
      m => m.userId === req.user.userId
    );

    if (alreadyMember)
      return res.status(400).json({ message: "Already in team" });

    const existingReq = await prisma.teamJoinRequest.findUnique({
      where: {
        teamId_userId: {
          teamId: team.id,
          userId: req.user.userId
        }
      }
    });

    if (existingReq)
      return res.status(400).json({ message: "Request already sent" });

    const reqEntry = await prisma.teamJoinRequest.create({
      data: {
        teamId: team.id,
        userId: req.user.userId,
        message
      }
    });

    res.status(201).json({
      message: "Join request sent",
      reqEntry
    });

  } catch (err) {
    console.error("joinViaCode:", err);
    res.status(500).json({ message: "Join failed" });
  }
};


// TEAM DETAILS

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
        }
      }
    });

    if (!team)
      return res.status(404).json({ message: "Team not found" });

    const leader = team.members.find(m => m.role === "LEADER");

    res.json({
      ...team,
      leader
    });

  } catch (err) {
    console.error("getTeamDetails:", err);
    res.status(500).json({ message: "Failed to fetch team" });
  }
};


// LIST JOIN REQUESTS

export const listJoinRequests = async (req, res) => {

  const teamId = Number(req.params.teamId);

  const leader = await prisma.teamMember.findFirst({
    where: {
      teamId,
      userId: req.user.userId,
      role: "LEADER"
    }
  });

  if (!leader)
    return res.status(403).json({ message: "Leader only" });

  const requests = await prisma.teamJoinRequest.findMany({
    where: {
      teamId,
      status: "PENDING"
    },
    include: {
      user: {
        select: { id: true, username: true }
      }
    }
  });

  res.json(requests);
};


// ACCEPT JOIN

export const acceptJoin = async (req, res) => {
  try {

    const teamId = Number(req.params.teamId);
    const userId = Number(req.params.userId);

    const leader = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: req.user.userId,
        role: "LEADER"
      }
    });

    if (!leader)
      return res.status(403).json({ message: "Leader only" });

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true }
    });

    if (team.members.length >= team.maxMembers)
      return res.status(400).json({ message: "Team full" });

    await prisma.$transaction([
      prisma.teamJoinRequest.update({
        where: {
          teamId_userId: { teamId, userId }
        },
        data: { status: "ACCEPTED" }
      }),
      prisma.teamMember.create({
        data: {
          teamId,
          userId,
          role: "MEMBER"
        }
      })
    ]);

    emitToUser(userId, "joinAccepted", { teamId });

    res.json({ message: "User added to team" });

  } catch (err) {
    console.error("acceptJoin:", err);
    res.status(500).json({ message: "Accept failed" });
  }
};


// REJECT JOIN

export const rejectJoin = async (req, res) => {

  const teamId = Number(req.params.teamId);
  const userId = Number(req.params.userId);

  await prisma.teamJoinRequest.update({
    where: {
      teamId_userId: { teamId, userId }
    },
    data: { status: "REJECTED" }
  });

  res.json({ message: "Request rejected" });
};


// CHANGE ROLE

export const changeRole = async (req, res) => {
  try {

    const teamId = Number(req.params.teamId);
    const { userId, role } = req.body;

    const leader = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: req.user.userId,
        role: "LEADER"
      }
    });

    if (!leader)
      return res.status(403).json({ message: "Leader only" });

    const updated = await prisma.teamMember.update({
      where: {
        teamId_userId: {
          teamId,
          userId: Number(userId)
        }
      },
      data: { role }
    });

    res.json(updated);

  } catch (err) {
    console.error("changeRole:", err);
    res.status(500).json({ message: "Role update failed" });
  }
};


// KICK MEMBER

export const kickMember = async (req, res) => {
  try {

    const teamId = Number(req.params.teamId);
    const userId = Number(req.params.userId);

    const leader = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: req.user.userId,
        role: "LEADER"
      }
    });

    if (!leader)
      return res.status(403).json({ message: "Leader only" });

    await prisma.teamMember.delete({
      where: {
        teamId_userId: { teamId, userId }
      }
    });

    res.json({ message: "Member kicked" });

  } catch (err) {
    console.error("kickMember:", err);
    res.status(500).json({ message: "Kick failed" });
  }
};


// LEAVE TEAM

export const leaveTeam = async (req, res) => {
  try {

    const teamId = Number(req.params.teamId);
    const userId = req.user.userId;
    const { newLeaderId } = req.body || {};

    const members = await prisma.teamMember.findMany({
      where: { teamId }
    });

    const self = members.find(m => m.userId === userId);

    if (!self)
      return res.status(404).json({ message: "Not a member" });

    const isLeader = self.role === "LEADER";

    if (isLeader && members.length === 1) {

      await prisma.team.delete({
        where: { id: teamId }
      });

      return res.json({ message: "Team disbanded" });
    }

    if (isLeader && members.length > 1) {

      if (!newLeaderId)
        return res.status(400).json({
          message: "newLeaderId required"
        });

      await prisma.$transaction([
        prisma.teamMember.update({
          where: {
            teamId_userId: {
              teamId,
              userId: Number(newLeaderId)
            }
          },
          data: { role: "LEADER" }
        }),
        prisma.teamMember.delete({
          where: {
            teamId_userId: { teamId, userId }
          }
        })
      ]);

      return res.json({
        message: "Leader transferred and you left"
      });
    }

    await prisma.teamMember.delete({
      where: {
        teamId_userId: { teamId, userId }
      }
    });

    res.json({ message: "Left team successfully" });

  } catch (err) {
    console.error("leaveTeam:", err);
    res.status(500).json({ message: "Leave failed" });
  }
};
