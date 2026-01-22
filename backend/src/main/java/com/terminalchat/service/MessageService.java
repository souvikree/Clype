package com.terminalchat.service;

import com.terminalchat.domain.dto.MessageDTO;
import com.terminalchat.domain.entity.Message;
import com.terminalchat.domain.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MessageService {

    private final MessageRepository messageRepository;
    private static final long MESSAGE_TTL_HOURS = 24;

    public MessageDTO saveMessage(String roomId, String senderId, String senderUsername, String content) {
        LocalDateTime now = LocalDateTime.now();
        
        Message message = Message.builder()
                .roomId(roomId)
                .senderId(senderId)
                .senderUsername(senderUsername)
                .content(content)
                .type("TEXT")
                .createdAt(now)
                .expiresAt(now.plusHours(MESSAGE_TTL_HOURS))
                .build();

        Message savedMessage = messageRepository.save(message);
        log.info("Message saved to room {}: {}", roomId, savedMessage.getId());

        return convertToDTO(savedMessage);
    }

    public MessageDTO saveSystemMessage(String roomId, String content) {
        LocalDateTime now = LocalDateTime.now();
        
        Message message = Message.builder()
                .roomId(roomId)
                .senderUsername("SYSTEM")
                .content(content)
                .type("SYSTEM")
                .createdAt(now)
                .expiresAt(now.plusHours(MESSAGE_TTL_HOURS))
                .build();

        Message savedMessage = messageRepository.save(message);
        return convertToDTO(savedMessage);
    }

    public List<MessageDTO> getRoomMessages(String roomId) {
        List<Message> messages = messageRepository.findByRoomIdOrderByCreatedAtAsc(roomId);
        return messages.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private MessageDTO convertToDTO(Message message) {
        return MessageDTO.builder()
                .id(message.getId())
                .roomId(message.getRoomId())
                .senderId(message.getSenderId())
                .senderUsername(message.getSenderUsername())
                .content(message.getContent())
                .type(message.getType())
                .createdAt(message.getCreatedAt())
                .build();
    }
}
