package com.terminalchat.service;

import com.terminalchat.domain.dto.AuthResponse;
import com.terminalchat.domain.entity.User;
import com.terminalchat.domain.repository.UserRepository;
import com.terminalchat.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthResponse handleGoogleLogin(String googleId, String email, String displayName, String profilePicture) {
        Optional<User> existingUser = userRepository.findByGoogleId(googleId);

        User user;
        boolean isNewUser = false;

        if (existingUser.isPresent()) {
            user = existingUser.get();
            user.setLastLogin(LocalDateTime.now());
            user.setActive(true);
            user.setUpdatedAt(LocalDateTime.now());
            log.info("User logged in: {}", email);
        } else {
            user = User.builder()
                    .googleId(googleId)
                    .email(email)
                    .displayName(displayName)
                    .profilePicture(profilePicture)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .lastLogin(LocalDateTime.now())
                    .active(true)
                    .build();
            isNewUser = true;
            log.info("New user created: {}", email);
        }

        user = userRepository.save(user);

        String token = jwtTokenProvider.generateToken(user.getId(), user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .profilePicture(user.getProfilePicture())
                .newUser(isNewUser)
                .build();
    }

    public Optional<User> getUserById(String userId) {
        return userRepository.findById(userId);
    }

    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public User updateDisplayName(String userId, String newDisplayName) {
        Optional<User> optionalUser = userRepository.findById(userId);
        if (optionalUser.isPresent()) {
            User user = optionalUser.get();
            user.setDisplayName(newDisplayName);
            user.setUpdatedAt(LocalDateTime.now());
            return userRepository.save(user);
        }
        throw new RuntimeException("User not found: " + userId);
    }
}
