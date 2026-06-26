import { Server as SocketIOServer, Socket } from 'socket.io';

let io: SocketIOServer;

export const initializeSocket = (socketIO: SocketIOServer) => {
  io = socketIO;
};

// Get io instance for use in controllers
export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

// Real-time events
export const SocketEvents = {
  normalizeUniversityTargets: (universityCodes: string | string[]) => {
    const list = Array.isArray(universityCodes) ? universityCodes : [universityCodes];
    return Array.from(new Set(list.filter(Boolean)));
  },

  // Flag submission
  emitFlagSubmitted: (universityCode: string | string[], data: {
    challengeId: string;
    challengeTitle: string;
    username: string;
    userId: string;
    points: number;
    isFirstBlood: boolean;
  }) => {
    SocketEvents.normalizeUniversityTargets(universityCode).forEach((code) => {
      io.to(`university:${code}`).emit('flagSubmitted', data);
    });
  },

  // Leaderboard update
  emitLeaderboardUpdate: (universityCode: string | string[], leaderboard: any[]) => {
    SocketEvents.normalizeUniversityTargets(universityCode).forEach((code) => {
      io.to(`university:${code}`).emit('leaderboardUpdate', leaderboard);
    });
  },

  // Competition event
  emitCompetitionUpdate: (universityCode: string | string[], data: {
    competitionId: string;
    type: 'started' | 'ended' | 'challenge_added';
    message: string;
  }) => {
    SocketEvents.normalizeUniversityTargets(universityCode).forEach((code) => {
      io.to(`university:${code}`).emit('competitionUpdate', data);
    });
  },

  // New announcement
  emitAnnouncement: (universityCode: string | string[], announcement: any) => {
    SocketEvents.normalizeUniversityTargets(universityCode).forEach((code) => {
      io.to(`university:${code}`).emit('announcement', announcement);
    });
  },

  // User achievement
  emitAchievement: (userId: string, achievement: {
    title: string;
    description: string;
    icon: string;
  }) => {
    io.to(`user:${userId}`).emit('achievement', achievement);
  },

  // Challenge published
  emitChallengePublished: (universityCode: string | string[], challenge: any) => {
    SocketEvents.normalizeUniversityTargets(universityCode).forEach((code) => {
      io.to(`university:${code}`).emit('challengePublished', challenge);
    });
  },

  // Competition live activity
  emitCompetitionActivity: (competitionId: string, activity: {
    type: 'solve' | 'first_blood' | 'leaderboard_change';
    data: any;
    timestamp: Date;
  }) => {
    io.to(`competition:${competitionId}`).emit('competitionActivity', activity);
  },

  // Join/leave competition room
  joinCompetition: (socket: Socket, competitionId: string) => {
    socket.join(`competition:${competitionId}`);
  },

  leaveCompetition: (socket: Socket, competitionId: string) => {
    socket.leave(`competition:${competitionId}`);
  }
};
