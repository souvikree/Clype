package com.terminalchat.web;

import com.terminalchat.domain.dto.AuthResponse;
import com.terminalchat.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

// import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${google.client.id}")
    private String googleClientId;

    @Value("${google.client.secret}")
    private String googleClientSecret;

    @Value("${google.redirect.uri.desktop}")
    private String desktopRedirectUri;

    // ============================================================================
    // WEB OAUTH (YOUR EXISTING CODE - DON'T TOUCH)
    // ============================================================================

    @PostMapping("/google-login")
    public ResponseEntity<AuthResponse> googleLogin(@RequestBody Map<String, String> request) {
        try {
            String googleId = request.get("googleId");
            String email = request.get("email");
            String displayName = request.get("displayName");
            String profilePicture = request.get("profilePicture");

            log.info("Web OAuth login attempt for email: {}", email);

            AuthResponse response = authService.handleGoogleLogin(googleId, email, displayName, profilePicture);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Google login failed", e);
            return ResponseEntity.badRequest().build();
        }
    }

    // ============================================================================
    // DESKTOP OAUTH - FIXED VERSION
    // ============================================================================

    /**
     * Desktop OAuth callback endpoint
     * Google redirects here: http://localhost:8080/api/auth/google/desktop?code=xxx
     * 
     * CRITICAL: Returns HTML with JavaScript to trigger deep link.
     * HTTP Location redirects DON'T work for custom protocols (clype://)!
     */
    @GetMapping("/google/desktop")
    public ResponseEntity<String> handleDesktopOAuthCallback(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String error,
            @RequestParam(required = false) String state) {

        if (error != null) {
            log.error("OAuth error from Google: {}", error);
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(generateErrorHtml("OAuth authorization failed: " + error));
        }

        if (code == null || code.isBlank()) {
            log.error("OAuth callback: missing authorization code");
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(generateErrorHtml("Missing authorization code"));
        }

        try {
            log.info("Desktop OAuth callback received, exchanging code for token...");

            // Step 1: Exchange authorization code for access token
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            String formData = "code=" + code +
                    "&client_id=" + googleClientId +
                    "&client_secret=" + googleClientSecret +
                    "&redirect_uri=" + desktopRedirectUri +
                    "&grant_type=authorization_code";

            HttpEntity<String> entity = new HttpEntity<>(formData, headers);

            log.debug("Requesting access token from Google...");
            ResponseEntity<String> tokenResponse = restTemplate.exchange(
                    "https://oauth2.googleapis.com/token",
                    HttpMethod.POST,
                    entity,
                    String.class);

            if (!tokenResponse.getStatusCode().is2xxSuccessful()) {
                log.error("Failed to exchange code for token: {}", tokenResponse.getStatusCode());
                return ResponseEntity.ok()
                        .contentType(MediaType.TEXT_HTML)
                        .body(generateErrorHtml("Failed to exchange authorization code"));
            }

            JsonNode tokenJson = objectMapper.readTree(tokenResponse.getBody());
            String accessToken = tokenJson.get("access_token").asText();

            log.info("Successfully obtained access token");

            // Step 2: Get user info from Google
            HttpHeaders userHeaders = new HttpHeaders();
            userHeaders.setBearerAuth(accessToken);
            HttpEntity<Void> userEntity = new HttpEntity<>(userHeaders);

            log.debug("Fetching user info from Google...");
            ResponseEntity<String> userResponse = restTemplate.exchange(
                    "https://www.googleapis.com/oauth2/v2/userinfo",
                    HttpMethod.GET,
                    userEntity,
                    String.class);

            if (!userResponse.getStatusCode().is2xxSuccessful()) {
                log.error("Failed to get user info: {}", userResponse.getStatusCode());
                return ResponseEntity.ok()
                        .contentType(MediaType.TEXT_HTML)
                        .body(generateErrorHtml("Failed to retrieve user information"));
            }

            JsonNode userJson = objectMapper.readTree(userResponse.getBody());

            // Extract user data
            String googleId = userJson.get("id").asText();
            String email = userJson.get("email").asText();
            String name = userJson.has("name") ? userJson.get("name").asText() : email;
            String avatar = userJson.has("picture") ? userJson.get("picture").asText() : "";

            log.info("Desktop OAuth successful for user: {}", email);

            // Step 3: Create/login user using your existing service
            AuthResponse authResponse = authService.handleGoogleLogin(googleId, email, name, avatar);

            // Step 4: Return HTML that triggers deep link via JavaScript
            // CRITICAL: Must use HTML + JS, not HTTP Location header!
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(generateSuccessHtml(
                            authResponse.getUserId(),
                            email,
                            name,
                            avatar,
                            authResponse.getToken(),
                            authResponse.getDisplayName()));

        } catch (Exception e) {
            log.error("Desktop OAuth callback failed", e);
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(generateErrorHtml("OAuth processing failed: " + e.getMessage()));
        }
    }

    // ============================================================================
    // HTML GENERATORS FOR DESKTOP OAUTH
    // ============================================================================

    private String generateSuccessHtml(String userId, String email, String name, String avatar, String token,
            String displayName) {
        // Escape special characters for JSON
        String safeUserId = escapeJson(userId);
        String safeEmail = escapeJson(email);
        String safeName = escapeJson(name);
        String safeAvatar = escapeJson(avatar);
        String safeToken = escapeJson(token);
        String safeDisplayName = escapeJson(displayName);

        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "  <meta charset='UTF-8'>" +
                "  <meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
                "  <title>Login Successful</title>" +
                "  <style>" +
                "    * { margin: 0; padding: 0; box-sizing: border-box; }" +
                "    body { " +
                "      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; "
                +
                "      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%); " +
                "      color: #fff; " +
                "      display: flex; " +
                "      align-items: center; " +
                "      justify-content: center; " +
                "      height: 100vh; " +
                "      margin: 0; " +
                "    }" +
                "    .container { " +
                "      text-align: center; " +
                "      padding: 40px; " +
                "      background: rgba(26, 26, 46, 0.95); " +
                "      border-radius: 16px; " +
                "      border: 2px solid #00ffff; " +
                "      box-shadow: 0 0 30px rgba(0, 255, 255, 0.3); " +
                "      max-width: 400px; " +
                "      animation: fadeIn 0.3s ease-in; " +
                "    }" +
                "    @keyframes fadeIn { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }"
                +
                "    .success-icon { " +
                "      width: 64px; " +
                "      height: 64px; " +
                "      margin: 0 auto 20px; " +
                "      background: #00ffff; " +
                "      border-radius: 50%; " +
                "      display: flex; " +
                "      align-items: center; " +
                "      justify-content: center; " +
                "      font-size: 32px; " +
                "      color: #0a0a0a; " +
                "      font-weight: bold; " +
                "    }" +
                "    h1 { " +
                "      color: #00ffff; " +
                "      margin-bottom: 10px; " +
                "      font-size: 24px; " +
                "      text-shadow: 0 0 10px rgba(0, 255, 255, 0.5); " +
                "    }" +
                "    .welcome { color: #aaa; font-size: 14px; margin-bottom: 20px; }" +
                "    .loader { " +
                "      border: 3px solid #333; " +
                "      border-top: 3px solid #00ffff; " +
                "      border-radius: 50%; " +
                "      width: 40px; " +
                "      height: 40px; " +
                "      animation: spin 1s linear infinite; " +
                "      margin: 20px auto; " +
                "    }" +
                "    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }" +
                "    .status { color: #888; font-size: 14px; margin: 15px 0; }" +
                "    .close-btn { " +
                "      margin-top: 20px; " +
                "      padding: 12px 24px; " +
                "      background: #00ffff; " +
                "      color: #0a0a0a; " +
                "      border: none; " +
                "      border-radius: 8px; " +
                "      cursor: pointer; " +
                "      font-weight: 600; " +
                "      font-size: 14px; " +
                "      transition: all 0.2s; " +
                "      display: none; " +
                "    }" +
                "    .close-btn:hover { background: #00cccc; transform: translateY(-2px); }" +
                "    .debug { " +
                "      margin-top: 20px; " +
                "      padding: 10px; " +
                "      background: rgba(0, 0, 0, 0.3); " +
                "      border-radius: 4px; " +
                "      font-size: 11px; " +
                "      color: #666; " +
                "      font-family: monospace; " +
                "      word-break: break-all; " +
                "      display: none; " +
                "    }" +
                "  </style>" +
                "</head>" +
                "<body>" +
                "  <div class='container'>" +
                "    <div class='success-icon'>✓</div>" +
                "    <h1>Login Successful</h1>" +
                "    <p class='welcome'>Welcome back, " + escapeHtml(safeName) + "!</p>" +
                "    <div class='loader' id='loader'></div>" +
                "    <p class='status' id='status'>Finalizing login…</p>" +
                "    <button class='close-btn' id='openBtn'>Open App</button>" +
                "    <div class='debug' id='debug'></div>" +
                "  </div>" +
                "  <script>" +
                "    console.log('OAuth success page loaded');" +
                "" +
                "    const openBtn = document.getElementById('openBtn');" +
                "    const loader = document.getElementById('loader');" +
                "    const status = document.getElementById('status');" +
                "" +
                "    const userData = {" +
                "      userId: \"" + safeUserId + "\"," +
                "      email: \"" + safeEmail + "\"," +
                "      name: \"" + safeName + "\"," +
                "      avatar: \"" + safeAvatar + "\"," +
                "      token: \"" + safeToken + "\"," +
                "      displayName: \"" + safeDisplayName + "\"" +
                "    };" +
                "" +
                "    const deepLink = 'clype://oauth?data=' + encodeURIComponent(JSON.stringify(userData));" +
                "" +
                "    console.log('Attempting automatic deep link redirect');" +
                "" +
                "    // Let browser finish OAuth redirect cleanly" +
                "    setTimeout(() => {" +
                "      console.log('Redirecting to app via deep link');" +
                "      window.location.href = deepLink;" +
                "    }, 500);" +
                "" +
                "    setTimeout(() => {" +
                "      loader.style.display = 'none';" +
                "      status.textContent = 'If the app did not open, click below';" +
                "      openBtn.style.display = 'inline-block';" +
                "    }, 2000);" +
                "" +
                "    openBtn.addEventListener('click', () => {" +
                "      window.location.href = deepLink;" +
                "" +
                "      // Best-effort close" +
                "      setTimeout(() => {" +
                "        try { window.close(); } catch (e) {}" +
                "      }, 500);" +
                "    });" +
                "  </script>"
                +
                "</body>" +
                "</html>";
    }

    private String generateErrorHtml(String error) {
        String safeError = escapeHtml(error);

        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "  <meta charset='UTF-8'>" +
                "  <meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
                "  <title>Login Failed</title>" +
                "  <style>" +
                "    * { margin: 0; padding: 0; box-sizing: border-box; }" +
                "    body { " +
                "      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; " +
                "      background: linear-gradient(135deg, #0a0a0a 0%, #2e1a1a 100%); " +
                "      color: #fff; " +
                "      display: flex; " +
                "      align-items: center; " +
                "      justify-content: center; " +
                "      height: 100vh; " +
                "    }" +
                "    .container { " +
                "      text-align: center; " +
                "      padding: 40px; " +
                "      background: rgba(46, 26, 26, 0.95); " +
                "      border-radius: 16px; " +
                "      border: 2px solid #ff0040; " +
                "      box-shadow: 0 0 30px rgba(255, 0, 64, 0.3); " +
                "      max-width: 400px; " +
                "    }" +
                "    .error-icon { " +
                "      width: 64px; " +
                "      height: 64px; " +
                "      margin: 0 auto 20px; " +
                "      background: #ff0040; " +
                "      border-radius: 50%; " +
                "      display: flex; " +
                "      align-items: center; " +
                "      justify-content: center; " +
                "      font-size: 32px; " +
                "      color: #fff; " +
                "      font-weight: bold; " +
                "    }" +
                "    h1 { color: #ff0040; margin-bottom: 20px; font-size: 24px; }" +
                "    p { color: #888; font-size: 14px; margin: 10px 0; line-height: 1.5; }" +
                "    button { " +
                "      background: #ff0040; " +
                "      color: white; " +
                "      border: none; " +
                "      padding: 12px 24px; " +
                "      border-radius: 8px; " +
                "      cursor: pointer; " +
                "      font-size: 14px; " +
                "      margin-top: 20px; " +
                "      font-weight: 600; " +
                "      transition: all 0.2s; " +
                "    }" +
                "    button:hover { background: #cc0033; transform: translateY(-2px); }" +
                "  </style>" +
                "</head>" +
                "<body>" +
                "  <div class='container'>" +
                "    <div class='error-icon'>✗</div>" +
                "    <h1>Login Failed</h1>" +
                "    <p>" + safeError + "</p>" +
                "    <button onclick='window.close()'>Close Window</button>" +
                "  </div>" +
                "  <script>" +
                "    console.error('OAuth error:', '" + safeError.replace("'", "\\'") + "');" +
                "  </script>" +
                "</body>" +
                "</html>";
    }

    // ============================================================================
    // UTILITY METHODS
    // ============================================================================

    private String escapeJson(String value) {
        if (value == null)
            return "";
        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    private String escapeHtml(String value) {
        if (value == null)
            return "";
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    // ============================================================================
    // USER MANAGEMENT (YOUR EXISTING CODE - DON'T TOUCH)
    // ============================================================================

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