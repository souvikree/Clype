package com.terminalchat.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.IndexOperations;
import org.springframework.data.mongodb.core.index.IndexResolver;
import org.springframework.data.mongodb.core.index.MongoPersistentEntityIndexResolver;
import org.springframework.data.mongodb.core.mapping.MongoMappingContext;

@Configuration
public class MongoDBConfig {
    
    @Bean
    public IndexResolver mongoIndexResolver(MongoMappingContext mongoMappingContext) {
        return new MongoPersistentEntityIndexResolver(mongoMappingContext);
    }
    
    // TTL Index will be created for expiresAt field on Message collection
    // MongoDB's TTL monitor runs every 60 seconds by default
}
