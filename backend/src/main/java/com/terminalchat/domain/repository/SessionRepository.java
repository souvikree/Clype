package com.terminalchat.domain.repository;

import com.terminalchat.domain.entity.Session;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface SessionRepository extends MongoRepository<Session, String> {
    Optional<Session> findBySessionCode(String sessionCode);
    List<Session> findByStatus(String status);
    List<Session> findByUserId(String userId);
    List<Session> findByRoomId(String roomId);
}
