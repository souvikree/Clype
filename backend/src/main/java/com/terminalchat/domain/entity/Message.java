package com.terminalchat.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {
    
    @Id
    private String id;
    
    private String roomId;
    private String senderId;
    private String senderUsername;
    
    private String content;
    private String type; // TEXT, SYSTEM
    
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt; 
}
