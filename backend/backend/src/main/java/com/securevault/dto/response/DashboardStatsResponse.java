package com.securevault.dto.response;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DashboardStatsResponse {
    private long filesSent;
    private long filesReceived;
    private boolean keyGenerated;
}