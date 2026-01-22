package com.terminalchat.web;

import com.terminalchat.domain.dto.SessionCodeResponse;
import com.terminalchat.domain.entity.Room;
import com.terminalchat.domain.entity.Session;
import com.terminalchat.service.RoomService;
import com.terminalchat.service.SessionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/rooms")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class RoomController {

    private final RoomService roomService;
    private final SessionService sessionService;

    @PostMapping("/my-address/{sessionType}")
    public ResponseEntity<?> generateMyAddress(
            @RequestHeader("Authorization") String token,
            @PathVariable String sessionType) {
        try {
            String userId = extractUserIdFromToken(token);
            if (userId == null) {
                return ResponseEntity.badRequest().body("Invalid token");
            }

            SessionCodeResponse response = sessionService.createSession(userId, sessionType);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to generate address", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/connect/{mateCode}")
    public ResponseEntity<?> connectWithMate(
            @RequestHeader("Authorization") String token,
            @PathVariable String mateCode,
            @RequestBody Map<String, String> request) {
        try {
            String userId = extractUserIdFromToken(token);
            if (userId == null) {
                return ResponseEntity.badRequest().body("Invalid token");
            }

            String sessionType = request.get("sessionType");
            String mySessionId = request.get("mySessionId");

            // Find mate's session by code
            Optional<Session> mateSession = sessionService.getSessionByCode(mateCode);
            if (mateSession.isEmpty()) {
                return ResponseEntity.badRequest().body("Mate session not found");
            }

            Session mate = mateSession.get();

            // Create room
            Room room = roomService.createRoom(sessionType, userId, mate.getUserId());

            // Associate sessions with room
            sessionService.associateSessionWithRoom(mySessionId, room.getId());
            sessionService.associateSessionWithRoom(mate.getId(), room.getId());

            Map<String, Object> response = new HashMap<>();
            response.put("roomId", room.getId());
            response.put("status", "CONNECTED");
            response.put("mateUserId", mate.getUserId());

            log.info("Room created between {} and {}", userId, mate.getUserId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to connect with mate", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{roomId}")
    public ResponseEntity<?> getRoom(
            @RequestHeader("Authorization") String token,
            @PathVariable String roomId) {
        try {
            String userId = extractUserIdFromToken(token);
            if (userId == null) {
                return ResponseEntity.badRequest().body("Invalid token");
            }

            Optional<Room> room = roomService.getRoomById(roomId);
            if (room.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            if (!roomService.validateRoomParticipants(roomId, userId)) {
                return ResponseEntity.status(403).body("Not authorized");
            }

            return ResponseEntity.ok(room.get());
        } catch (Exception e) {
            log.error("Failed to get room", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{roomId}/close")
    public ResponseEntity<?> closeRoom(
            @RequestHeader("Authorization") String token,
            @PathVariable String roomId) {
        try {
            String userId = extractUserIdFromToken(token);
            if (userId == null) {
                return ResponseEntity.badRequest().body("Invalid token");
            }

            if (!roomService.validateRoomParticipants(roomId, userId)) {
                return ResponseEntity.status(403).body("Not authorized");
            }

            roomService.closeRoom(roomId);
            log.info("Room {} closed by {}", roomId, userId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Failed to close room", e);
            return ResponseEntity.badRequest().build();
        }
    }

    private String extractUserIdFromToken(String token) {
        if (token != null && token.startsWith("Bearer ")) {
            return token.substring(7);
        }
        return null;
    }
}
