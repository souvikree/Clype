package com.terminalchat.websocket;

import com.terminalchat.domain.entity.Room;
import com.terminalchat.service.MessageService;
import com.terminalchat.service.RoomService;
import com.terminalchat.service.SessionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatWebSocketHandler {

    private final SimpMessagingTemplate messagingTemplate;
    private final MessageService messageService;
    private final RoomService roomService;
    private final SessionService sessionService;

    @MessageMapping("/chat/send/{roomId}")
    public void handleChatMessage(
            @DestinationVariable String roomId,
            @Payload Map<String, String> payload) {
        
        String senderId = payload.get("senderId");
        String senderUsername = payload.get("senderUsername");
        String content = payload.get("content");

        // Validate room participant
        if (!roomService.validateRoomParticipants(roomId, senderId)) {
            log.warn("Unauthorized message attempt in room {}", roomId);
            return;
        }

        // Save message with TTL
        var messageDTO = messageService.saveMessage(roomId, senderId, senderUsername, content);

        // Broadcast to room
        messagingTemplate.convertAndSend("/room/" + roomId + "/messages", messageDTO);
        log.info("Message sent in room {}", roomId);
    }

    @MessageMapping("/chat/typing/{roomId}")
    public void handleTypingIndicator(
            @DestinationVariable String roomId,
            @Payload Map<String, String> payload) {
        
        String userId = payload.get("userId");
        
        Map<String, Object> typingEvent = new HashMap<>();
        typingEvent.put("userId", userId);
        typingEvent.put("isTyping", true);

        messagingTemplate.convertAndSend("/room/" + roomId + "/typing", typingEvent);
    }
}
