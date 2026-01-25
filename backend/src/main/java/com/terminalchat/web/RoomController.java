package com.terminalchat.web;

import com.terminalchat.domain.dto.SessionCodeResponse;
import com.terminalchat.domain.entity.Room;
import com.terminalchat.domain.entity.Session;
import com.terminalchat.security.JwtTokenProvider;  // 🔥 ADD THIS
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
    private final JwtTokenProvider jwtTokenProvider;  

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
            return ResponseEntity.status(500).body(e.getMessage());
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

            if (mySessionId == null || mySessionId.isBlank()) {
                return ResponseEntity.badRequest().body("Run my-address first in this window");
            }

            Optional<Session> mateOpt = sessionService.getSessionByCode(mateCode);
            if (mateOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("Mate session not found");
            }

            Session mate = mateOpt.get();

            // Case 1: Mate already connected → join their room
            if ("ACTIVE".equals(mate.getStatus()) && mate.getRoomId() != null) {
                sessionService.associateSessionWithRoom(mySessionId, mate.getRoomId());
                
                Map<String, Object> response = new HashMap<>();
                response.put("roomId", mate.getRoomId());
                response.put("status", "JOINED_EXISTING");
                
                log.info("User {} joined existing room {} with mate {}", userId, mate.getRoomId(), mate.getUserId());
                return ResponseEntity.ok(response);
            }

            // Case 2: First connector → create room
            Room room = roomService.createRoom(sessionType, userId, mate.getUserId());

            sessionService.associateSessionWithRoom(mySessionId, room.getId());
            sessionService.associateSessionWithRoom(mate.getId(), room.getId());

            Map<String, Object> response = new HashMap<>();
            response.put("roomId", room.getId());
            response.put("status", "CREATED");

            log.info("Room {} created between {} and {}", room.getId(), userId, mate.getUserId());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Failed to connect with mate", e);
            return ResponseEntity.status(500).body("Internal error");
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
            String jwt = token.substring(7);
            return jwtTokenProvider.getUserIdFromToken(jwt); 
        }
        return null;
    }
}