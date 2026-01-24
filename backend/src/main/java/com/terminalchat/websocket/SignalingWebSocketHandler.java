package com.terminalchat.websocket;

import com.terminalchat.service.RoomService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
@RequiredArgsConstructor
@Slf4j
public class SignalingWebSocketHandler {

    private final SimpMessagingTemplate messagingTemplate;
    private final RoomService roomService;

    @MessageMapping("/signaling/offer/{roomId}")
    public void handleWebRTCOffer(
            @DestinationVariable String roomId,
            @Payload Map<String, Object> payload) {
        
        log.info("📥 Received WebRTC offer for room: {}", roomId);
        log.info("📦 Payload: {}", payload);

        String senderId = (String) payload.get("senderId");
        Object sdpOffer = payload.get("sdpOffer");
        String callType = (String) payload.get("callType");

        if (!roomService.validateRoomParticipants(roomId, senderId)) {
            log.warn("❌ Unauthorized WebRTC offer in room {}", roomId);
            return;
        }

        // Broadcast to the room
        messagingTemplate.convertAndSend("/room/" + roomId + "/webrtc-offer", payload);
        
        log.info("✅ WebRTC {} offer broadcasted to room: {}", callType, roomId);
    }

    @MessageMapping("/signaling/answer/{roomId}")
    public void handleWebRTCAnswer(
            @DestinationVariable String roomId,
            @Payload Map<String, Object> payload) {
        
        log.info("📥 Received WebRTC answer for room: {}", roomId);

        String senderId = (String) payload.get("senderId");
        
        if (!roomService.validateRoomParticipants(roomId, senderId)) {
            log.warn("❌ Unauthorized WebRTC answer in room {}", roomId);
            return;
        }

        // Broadcast to the room
        messagingTemplate.convertAndSend("/room/" + roomId + "/webrtc-answer", payload);
        
        log.info("✅ WebRTC answer broadcasted to room: {}", roomId);
    }

    @MessageMapping("/signaling/ice-candidate/{roomId}")
    public void handleICECandidate(
            @DestinationVariable String roomId,
            @Payload Map<String, Object> payload) {
        
        String senderId = (String) payload.get("senderId");
        
        if (!roomService.validateRoomParticipants(roomId, senderId)) {
            log.warn("❌ Unauthorized ICE candidate in room {}", roomId);
            return;
        }

        // Broadcast to the room
        messagingTemplate.convertAndSend("/room/" + roomId + "/ice-candidate", payload);
        
        log.debug("✅ ICE candidate broadcasted to room: {}", roomId);
    }
}