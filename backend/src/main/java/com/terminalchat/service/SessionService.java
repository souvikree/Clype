package com.terminalchat.service;

import com.terminalchat.domain.dto.SessionCodeResponse;
import com.terminalchat.domain.entity.Session;
import com.terminalchat.domain.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SessionService {

    private final SessionRepository sessionRepository;
    private static final long SESSION_EXPIRY_MINUTES = 60;
    private static final String SESSION_CODE_LENGTH = "6";

    public SessionCodeResponse createSession(String userId, String sessionType) {
        String sessionCode = generateSessionCode();
        
        Session session = Session.builder()
                .userId(userId)
                .sessionCode(sessionCode)
                .sessionType(sessionType)
                .status("WAITING")
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusMinutes(SESSION_EXPIRY_MINUTES))
                .build();

        Session savedSession = sessionRepository.save(session);
        log.info("Session created: {} (code: {})", savedSession.getId(), sessionCode);

        return SessionCodeResponse.builder()
                .sessionCode(sessionCode)
                .sessionId(savedSession.getId())
                .sessionType(sessionType)
                .build();
    }

    public Optional<Session> getSessionByCode(String sessionCode) {
        return sessionRepository.findBySessionCode(sessionCode);
    }

    public Optional<Session> getSessionById(String sessionId) {
        return sessionRepository.findById(sessionId);
    }

    public void updateSessionStatus(String sessionId, String status) {
        Optional<Session> optionalSession = sessionRepository.findById(sessionId);
        if (optionalSession.isPresent()) {
            Session session = optionalSession.get();
            session.setStatus(status);
            if (status.equals("COMPLETED")) {
                session.setCompletedAt(LocalDateTime.now());
            }
            sessionRepository.save(session);
            log.info("Session {} status updated to: {}", sessionId, status);
        }
    }

    public void associateSessionWithRoom(String sessionId, String roomId) {
        Optional<Session> optionalSession = sessionRepository.findById(sessionId);
        if (optionalSession.isPresent()) {
            Session session = optionalSession.get();
            session.setRoomId(roomId);
            session.setStatus("ACTIVE");
            sessionRepository.save(session);
            log.info("Session {} associated with room {}", sessionId, roomId);
        }
    }

    private String generateSessionCode() {
        return UUID.randomUUID().toString()
                .substring(0, 6)
                .toUpperCase()
                .replaceAll("[^A-Z0-9]", "");
    }
}
