let teamChatNsp = null;

export const registerTeamChatNamespace = (nsp) => {
  teamChatNsp = nsp;
};

export const emitToUser = (userId, event, payload) => {
  if (!teamChatNsp) return;
  teamChatNsp.to(`user:${userId}`).emit(event, payload);
};

export const emitToTeam = (teamId, event, payload) => {
  if (!teamChatNsp) return;
  teamChatNsp.to(`team:${teamId}`).emit(event, payload);
};
