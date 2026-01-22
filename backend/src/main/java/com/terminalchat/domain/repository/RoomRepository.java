package com.terminalchat.domain.repository;

import com.terminalchat.domain.entity.Room;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomRepository extends MongoRepository<Room, String> {
    List<Room> findByStatus(String status);
    Optional<Room> findById(String id);
}
