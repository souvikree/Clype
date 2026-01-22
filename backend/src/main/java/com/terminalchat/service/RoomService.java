package com.terminalchat.service;

import com.terminalchat.domain.entity.Room;
import com.terminalchat.domain.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RoomService {

    private final RoomRepository roomRepository;
    private static final long ROOM_EXPIRY_MINUTES = 120;

    public Room createRoom(String roomType, String participant1, String participant2) {
        Room room = Room.builder()
                .roomType(roomType)
                .status("ACTIVE")
                .participantIds(Arrays.asList(participant1, participant2))
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusMinutes(ROOM_EXPIRY_MINUTES))
                .build();

        Room savedRoom = roomRepository.save(room);
        log.info("Room created: {} (type: {})", savedRoom.getId(), roomType);
        return savedRoom;
    }

    public Optional<Room> getRoomById(String roomId) {
        return roomRepository.findById(roomId);
    }

    public void closeRoom(String roomId) {
        Optional<Room> optionalRoom = roomRepository.findById(roomId);
        if (optionalRoom.isPresent()) {
            Room room = optionalRoom.get();
            room.setStatus("CLOSED");
            room.setClosedAt(LocalDateTime.now());
            roomRepository.save(room);
            log.info("Room closed: {}", roomId);
        }
    }

    public void markRoomExpired(String roomId) {
        Optional<Room> optionalRoom = roomRepository.findById(roomId);
        if (optionalRoom.isPresent()) {
            Room room = optionalRoom.get();
            room.setStatus("EXPIRED");
            room.setClosedAt(LocalDateTime.now());
            roomRepository.save(room);
            log.info("Room marked expired: {}", roomId);
        }
    }

    public boolean validateRoomParticipants(String roomId, String userId) {
        Optional<Room> optionalRoom = roomRepository.findById(roomId);
        if (optionalRoom.isPresent()) {
            Room room = optionalRoom.get();
            return room.getParticipantIds().contains(userId);
        }
        return false;
    }
}
