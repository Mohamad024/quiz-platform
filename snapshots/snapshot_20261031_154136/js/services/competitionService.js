import { StorageManager } from '../storage/storageManager.js';
import { STORAGE_KEYS, ROOM_STATUS } from '../config/appConfig.js';
import { now, uuid } from '../utils/id.js';

export const CompetitionService = {
  getRooms() {
    return StorageManager.getData(STORAGE_KEYS.COMPETITION_ROOMS) || [];
  },
  getRoom(id) {
    return (this.getRooms() || []).find((r) => r.id === id);
  },
  getParticipants(roomId) {
    return (StorageManager.getData(STORAGE_KEYS.COMPETITION_PARTICIPANTS) || []).filter((p) => p.roomId === roomId);
  },
  getRoomQuestions(roomId) {
    return (StorageManager.getData(STORAGE_KEYS.COMPETITION_ROOM_QUESTIONS) || []).filter((rq) => rq.roomId === roomId).sort((a, b) => a.order - b.order);
  },

  async createRoom({ hostId, categoryId, questionCount = 5, timePerQuestion = 15 }) {
    const users = StorageManager.getData(STORAGE_KEYS.USERS) || [];
    const host = users.find((u) => u.id === hostId);
    if (!host) return { ok: false, error: 'NOT_FOUND' };

    const ageGroupId = host.ageGroupId;
    const allQ = (StorageManager.getData(STORAGE_KEYS.QUESTIONS) || []).filter((q) => q.status === 'approved' && (!categoryId || q.categoryId === categoryId) && q.ageGroupId === ageGroupId);
    if (allQ.length < questionCount) return { ok: false, error: 'NOT_ENOUGH_QUESTIONS' };
    const picked = allQ.sort(() => 0.5 - Math.random()).slice(0, questionCount);

    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    const room = {
      id: uuid(),
      code,
      hostId,
      categoryId,
      status: ROOM_STATUS.WAITING,
      currentQuestionIndex: 0,
      questionStartsAt: null,
      endsAt: null,
      createdAt: now(),
      questionCount,
      timePerQuestion,
    };

    const rooms = this.getRooms();
    rooms.push(room);
    const sr = StorageManager.saveData(STORAGE_KEYS.COMPETITION_ROOMS, rooms);
    if (!sr.ok) return sr;

    const participants = StorageManager.getData(STORAGE_KEYS.COMPETITION_PARTICIPANTS) || [];
    participants.push({ id: uuid(), roomId: room.id, userId: hostId, score: 0, answersCount: 0, correctCount: 0, joinedAt: now(), isHost: true });
    StorageManager.saveData(STORAGE_KEYS.COMPETITION_PARTICIPANTS, participants);

    const rq = StorageManager.getData(STORAGE_KEYS.COMPETITION_ROOM_QUESTIONS) || [];
    picked.forEach((q, i) => rq.push({ id: uuid(), roomId: room.id, questionId: q.id, order: i + 1 }));
    StorageManager.saveData(STORAGE_KEYS.COMPETITION_ROOM_QUESTIONS, rq);

    StorageManager.logAudit(hostId, 'CREATE_ROOM', 'competition_room', room.id, { code, questionCount });
    return { ok: true, room, questions: picked };
  },

  async joinRoom(roomId, userId) {
    const participants = StorageManager.getData(STORAGE_KEYS.COMPETITION_PARTICIPANTS) || [];
    if (participants.find((p) => p.roomId === roomId && p.userId === userId)) return { ok: false, error: 'ALREADY_JOINED' };
    const room = this.getRoom(roomId);
    if (!room) return { ok: false, error: 'ROOM_NOT_FOUND' };
    if (room.status !== ROOM_STATUS.WAITING) return { ok: false, error: 'ROOM_NOT_WAITING' };

    participants.push({ id: uuid(), roomId, userId, score: 0, answersCount: 0, correctCount: 0, joinedAt: now(), isHost: false });
    const sr = StorageManager.saveData(STORAGE_KEYS.COMPETITION_PARTICIPANTS, participants);
    if (!sr.ok) return sr;
    StorageManager.logAudit(userId, 'JOIN_ROOM', 'competition_room', roomId);
    return { ok: true };
  },

  async startRoom(roomId, userId) {
    const room = this.getRoom(roomId);
    if (!room) return { ok: false, error: 'ROOM_NOT_FOUND' };
    if (room.hostId !== userId) return { ok: false, error: 'NOT_HOST' };
    room.status = ROOM_STATUS.ACTIVE;
    room.currentQuestionIndex = 0;
    room.questionStartsAt = now();
    const rooms = this.getRooms();
    const idx = rooms.findIndex((r) => r.id === roomId);
    rooms[idx] = room;
    const sr = StorageManager.saveData(STORAGE_KEYS.COMPETITION_ROOMS, rooms);
    if (!sr.ok) return sr;
    StorageManager.logAudit(userId, 'START_ROOM', 'competition_room', roomId);
    return { ok: true, room };
  },

  async answer(roomId, userId, questionId, optionId, timeTaken) {
    const room = this.getRoom(roomId);
    if (!room) return { ok: false, error: 'ROOM_NOT_FOUND' };
    if (room.status !== ROOM_STATUS.ACTIVE) return { ok: false, error: 'ROOM_NOT_ACTIVE' };

    const participants = StorageManager.getData(STORAGE_KEYS.COMPETITION_PARTICIPANTS) || [];
    const pIdx = participants.findIndex((p) => p.roomId === roomId && p.userId === userId);
    if (pIdx === -1) return { ok: false, error: 'NOT_PARTICIPANT' };

    const allQ = StorageManager.getData(STORAGE_KEYS.QUESTIONS) || [];
    const q = allQ.find((x) => x.id === questionId);
    const correct = q && q.options.find((o) => o.id === optionId)?.isCorrect === true;

    participants[pIdx].answersCount += 1;
    if (correct) participants[pIdx].correctCount += 1;
    participants[pIdx].score += correct ? 10 : 0;
    StorageManager.saveData(STORAGE_KEYS.COMPETITION_PARTICIPANTS, participants);
    StorageManager.logAudit(userId, 'ANSWER', 'competition_room', roomId, { questionId, correct });
    return { ok: true, correct, score: participants[pIdx].score };
  },

  async nextQuestion(roomId, userId) {
    const room = this.getRoom(roomId);
    if (!room) return { ok: false, error: 'ROOM_NOT_FOUND' };
    if (room.hostId !== userId) return { ok: false, error: 'NOT_HOST' };
    if (room.currentQuestionIndex >= room.questionCount) {
      room.status = ROOM_STATUS.FINISHED;
      const rooms = this.getRooms();
      const idx = rooms.findIndex((r) => r.id === roomId);
      rooms[idx] = room;
      StorageManager.saveData(STORAGE_KEYS.COMPETITION_ROOMS, rooms);
      return { ok: true, finished: true, room };
    }
    room.currentQuestionIndex += 1;
    room.questionStartsAt = now();
    const rooms = this.getRooms();
    const idx = rooms.findIndex((r) => r.id === roomId);
    rooms[idx] = room;
    StorageManager.saveData(STORAGE_KEYS.COMPETITION_ROOMS, rooms);
    return { ok: true, finished: false, room };
  },

  getResults(roomId) {
    const participants = this.getParticipants(roomId);
    return participants
      .map((p) => {
        const u = (StorageManager.getData(STORAGE_KEYS.USERS) || []).find((x) => x.id === p.userId);
        return { ...p, username: u ? u.username : 'غير معروف' };
      })
      .sort((a, b) => b.score - a.score);
  },
};

if (typeof window !== 'undefined') window.CompetitionService = CompetitionService;
export default CompetitionService;
