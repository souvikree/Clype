package com.terminalchat.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageDTO {
    private String id;
    private String roomId;
    private String senderId;
    private String senderUsername;
    private String content;
    private String type;
    private LocalDateTime createdAt;
}
