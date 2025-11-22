package ai.omni;

import java.io.File;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

public class VoiceClient {
    private final String baseUrl;
    private final String apiKey;

    public VoiceClient(String baseUrl, String apiKey) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
    }

    public List<String> listPresets() {
        // Demo stub – no real network
        return List.of("Kai-Calm", "Kai-Energetic");
    }

    public String setDefault(String name) {
        return "Default preset set to " + name + " (demo stub, no real service)";
    }

    public void tts(String text, String provider, String voice,
                    Map<String,String> options, File out) throws Exception {
        // Demo stub – just create an empty placeholder file
        if (!out.exists()) {
            out.createNewFile();
        }
    }

    public CompletableFuture<Void> wsSpeak(String text, String provider, String voice,
                                           Map<String,String> options, File out) {
        // Demo stub – write an empty placeholder asynchronously
        return CompletableFuture.runAsync(() -> {
            try {
                if (!out.exists()) {
                    out.createNewFile();
                }
            } catch (Exception ignored) {}
        });
    }
}
