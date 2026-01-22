package com.terminalchat.service;

import com.terminalchat.domain.entity.Room;
import com.terminalchat.domain.entity.Session;
import com.terminalchat.domain.repository.SessionRepository;
import com.terminalchat.domain.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PairingService {

    private final SessionRepository sessionRepository;
    private final RoomRepository roomRepository;
    private final RoomService roomService;
    private final SessionService sessionService;

    @Transactional
    public Room pairSessions(String initiatorSessionId, String mateSessionCode) {
        // Get initiator's session
        Optional<Session> initiatorSessionOpt = sessionRepository.findById(initiatorSessionId);
        if (initiatorSessionOpt.isEmpty()) {
            throw new RuntimeException("Initiator session not found");
        }

        Session initiatorSession = initiatorSessionOpt.get();

        // Get mate's session by code
        Optional<Session> mateSessionOpt = sessionRepository.findBySessionCode(mateSessionCode);
        if (mateSessionOpt.isEmpty()) {
            throw new RuntimeException("Mate session not found or expired");
        }

        Session mateSession = mateSessionOpt.get();

        // Validate session types match
        if (!initiatorSession.getSessionType().equals(mateSession.getSessionType())) {
            throw new RuntimeException("Session types must match");
        }

        // Validate both are in WAITING state
        if (!initiatorSession.getStatus().equals("WAITING") || !mateSession.getStatus().equals("WAITING")) {
            throw new RuntimeException("Sessions must be in WAITING state");
        }

        // Create room
        Room room = roomService.createRoom(
                initiatorSession.getSessionType(),
                initiatorSession.getUserId(),
                mateSession.getUserId()
        );

        // Associate sessions with room
        sessionService.associateSessionWithRoom(initiatorSession.getId(), room.getId());
        sessionService.associateSessionWithRoom(mateSession.getId(), room.getId());

        log.info("Sessions paired: {} <-> {} in room {}", 
                initiatorSession.getId(), mateSession.getId(), room.getId());

        return room;
    }

    public boolean validatePairingConsent(String userId, String roomId) {
        Optional<Room> room = roomRepository.findById(roomId);
        if (room.isEmpty()) {
            return false;
        }

        return room.get().getParticipantIds().contains(userId);
    }

    @Transactional
    public void closePairing(String roomId, String userId) {
        Optional<Room> room = roomRepository.findById(roomId);
        if (room.isEmpty()) {
            return;
        }

        Room roomEntity = room.get();
        if (!roomEntity.getParticipantIds().contains(userId)) {
            throw new RuntimeException("User not authorized to close this room");
        }

        roomService.closeRoom(roomId);
        log.info("Room {} closed by user {}", roomId, userId);
    }

    public void cleanupExpiredSessions() {
        LocalDateTime now = LocalDateTime.now();
        
        // Find and update expired sessions
        sessionRepository.findByStatus("WAITING").stream()
                .filter(session -> session.getExpiresAt().isBefore(now))
                .forEach(session -> {
                    sessionService.updateSessionStatus(session.getId(), "EXPIRED");
                    log.info("Session {} expired and cleaned up", session.getId());
                });
    }

    public void cleanupExpiredRooms() {
        LocalDateTime now = LocalDateTime.now();
        
        // Find and update expired rooms
        roomRepository.findByStatus("ACTIVE").stream()
                .filter(room -> room.getExpiresAt().isBefore(now))
                .forEach(room -> {
                    roomService.markRoomExpired(room.getId());
                    log.info("Room {} expired and cleaned up", room.getId());
                });
    }
}
