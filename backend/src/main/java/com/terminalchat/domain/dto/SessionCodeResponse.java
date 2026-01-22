package com.terminalchat.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionCodeResponse {
    private String sessionCode;
    private String sessionId;
    private String sessionType;
}
