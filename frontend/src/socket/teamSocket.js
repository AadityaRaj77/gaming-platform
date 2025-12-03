import { io } from "socket.io-client";

let socket;

export const connectTeamSocket = (token) => {
  socket = io("http://localhost:4000/team-chat", {
    auth: {
      token
    }
  });
  return socket;
};

export const getTeamSocket = () => socket;
