package com.terminalchat;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TerminalChatBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(TerminalChatBackendApplication.class, args);
    }
}
