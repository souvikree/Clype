package com.terminalchat.web;

import com.terminalchat.domain.dto.AuthResponse;
import com.terminalchat.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/google-login")
    public ResponseEntity<AuthResponse> googleLogin(@RequestBody Map<String, String> request) {
        try {
            String googleId = request.get("googleId");
            String email = request.get("email");
            String displayName = request.get("displayName");
            String profilePicture = request.get("profilePicture");

            AuthResponse response = authService.handleGoogleLogin(googleId, email, displayName, profilePicture);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Google login failed", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/update-display-name")
    public ResponseEntity<?> updateDisplayName(
            @RequestHeader("Authorization") String token,
            @RequestBody Map<String, String> request) {
        try {
            String userId = extractUserIdFromToken(token);
            String newDisplayName = request.get("displayName");

            if (userId == null || newDisplayName == null || newDisplayName.isBlank()) {
                return ResponseEntity.badRequest().body("Invalid input");
            }

            var user = authService.updateDisplayName(userId, newDisplayName);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            log.error("Failed to update display name", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestHeader("Authorization") String token) {
        try {
            String userId = extractUserIdFromToken(token);
            if (userId == null) {
                return ResponseEntity.badRequest().body("Invalid token");
            }

            var user = authService.getUserById(userId);
            if (user.isPresent()) {
                return ResponseEntity.ok(user.get());
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Failed to get current user", e);
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
