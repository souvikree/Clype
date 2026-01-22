package com.terminalchat.websocket;

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

@Controller
@RequiredArgsConstructor
@Slf4j
public class SignalingWebSocketHandler {

    private final SimpMessagingTemplate messagingTemplate;
    private final RoomService roomService;
    private final SessionService sessionService;

    @MessageMapping("/signaling/offer/{roomId}")
    public void handleWebRTCOffer(
            @DestinationVariable String roomId,
            @Payload Map<String, Object> payload) {
        
        String senderId = (String) payload.get("senderId");
        String sdpOffer = (String) payload.get("sdpOffer");

        if (!roomService.validateRoomParticipants(roomId, senderId)) {
            log.warn("Unauthorized WebRTC offer in room {}", roomId);
            return;
        }

        // Broadcast offer to other participant
        Map<String, Object> offerEvent = new HashMap<>();
        offerEvent.put("senderId", senderId);
        offerEvent.put("sdpOffer", sdpOffer);

        messagingTemplate.convertAndSend("/room/" + roomId + "/webrtc-offer", offerEvent);
        log.info("WebRTC offer sent in room {}", roomId);
    }

    @MessageMapping("/signaling/answer/{roomId}")
    public void handleWebRTCAnswer(
            @DestinationVariable String roomId,
            @Payload Map<String, Object> payload) {
        
        String senderId = (String) payload.get("senderId");
        String sdpAnswer = (String) payload.get("sdpAnswer");

        if (!roomService.validateRoomParticipants(roomId, senderId)) {
            log.warn("Unauthorized WebRTC answer in room {}", roomId);
            return;
        }

        Map<String, Object> answerEvent = new HashMap<>();
        answerEvent.put("senderId", senderId);
        answerEvent.put("sdpAnswer", sdpAnswer);

        messagingTemplate.convertAndSend("/room/" + roomId + "/webrtc-answer", answerEvent);
        log.info("WebRTC answer sent in room {}", roomId);
    }

    @MessageMapping("/signaling/ice-candidate/{roomId}")
    public void handleICECandidate(
            @DestinationVariable String roomId,
            @Payload Map<String, Object> payload) {
        
        String senderId = (String) payload.get("senderId");
        String candidate = (String) payload.get("candidate");

        if (!roomService.validateRoomParticipants(roomId, senderId)) {
            log.warn("Unauthorized ICE candidate in room {}", roomId);
            return;
        }

        Map<String, Object> candidateEvent = new HashMap<>();
        candidateEvent.put("senderId", senderId);
        candidateEvent.put("candidate", candidate);

        messagingTemplate.convertAndSend("/room/" + roomId + "/ice-candidate", candidateEvent);
    }
}
