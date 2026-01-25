package com.terminalchat.scheduler;

import com.terminalchat.service.PairingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class SessionCleanupScheduler {

    private final PairingService pairingService;

    @Scheduled(fixedRate = 300000) 
    public void cleanupExpiredSessions() {
        try {
            log.info("Running session cleanup task...");
            pairingService.cleanupExpiredSessions();
            log.info("Session cleanup completed");
        } catch (Exception e) {
            log.error("Error during session cleanup", e);
        }
    }

    @Scheduled(fixedRate = 300000)
    public void cleanupExpiredRooms() {
        try {
            log.info("Running room cleanup task...");
            pairingService.cleanupExpiredRooms();
            log.info("Room cleanup completed");
        } catch (Exception e) {
            log.error("Error during room cleanup", e);
        }
    }
}
