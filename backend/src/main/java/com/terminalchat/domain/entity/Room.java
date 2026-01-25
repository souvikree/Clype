package com.terminalchat.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "rooms")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Room {
    
    @Id
    private String id;
    
    private String roomType; // CHAT, VOICE, VIDEO
    private String status; 
    
    @Builder.Default
    private List<String> participantIds = new ArrayList<>();
    
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private LocalDateTime closedAt;
}
