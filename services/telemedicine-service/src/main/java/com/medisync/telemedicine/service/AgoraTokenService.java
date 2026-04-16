package com.medisync.telemedicine.service;

import com.medisync.telemedicine.agora.RtcTokenBuilder2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class AgoraTokenService {
    @Value("${agora.app.id}") private String appId;
    @Value("${agora.app.certificate}") private String appCertificate;

    public String generateToken(String channelName, int uid){
        try {
            return new RtcTokenBuilder2().buildTokenWithUid(appId, appCertificate, channelName, uid, RtcTokenBuilder2.Role.ROLE_PUBLISHER, 3600, 3600);
        } catch (Exception ex){ throw new RuntimeException("Agora token generation failed", ex); }
    }

    public String getAppId(){ return appId; }
}
