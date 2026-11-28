package id.rapsonyx.server;

import io.javalin.Javalin;
import io.javalin.websocket.WsContext;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

/**
 * RAPSONYX Java 21 + Javalin 6 Authoritative Arena & Combat Math Server
 */
public class RapsonyxServerApp {
    private static final Map<String, WsContext> CLIENTS = new ConcurrentHashMap<>();
    private static final Map<String, String> CLIENT_ROOMS = new ConcurrentHashMap<>();
    private static final Map<String, Map<String, Object>> LEADERBOARD = new ConcurrentHashMap<>();

    public static double computeMitigation(double baseDef, double flatPen, double pctPen) {
        double afterPct = baseDef > 0 ? baseDef * Math.max(0.0, 1.0 - pctPen) : baseDef;
        double effDef = Math.max(-60.0, afterPct - flatPen);
        return 120.0 / (120.0 + effDef);
    }

    public static void main(String[] args) {
        int port = Integer.parseInt(System.getenv().getOrDefault("PORT", "7860"));

        Javalin app = Javalin.create(config -> {
            config.bundledPlugins.enableCors(cors -> cors.addRule(it -> it.anyHost()));
        }).start(port);

        app.get("/health", ctx -> ctx.json(Map.of(
                "ok", true,
                "service", "rapsonyx-java-server",
                "runtime", "Java 21 + Javalin 6",
                "connected", CLIENTS.size()
        )));

        app.get("/api/health", ctx -> ctx.json(Map.of(
                "ok", true,
                "service", "rapsonyx-java-server",
                "runtime", "Java 21 + Javalin 6",
                "connected", CLIENTS.size()
        )));

        app.get("/api/leaderboard", ctx -> {
            List<Map<String, Object>> sorted = LEADERBOARD.values().stream()
                    .sorted(Comparator.comparingInt(m -> -((Number) m.getOrDefault("rankStars", 0)).intValue()))
                    .limit(50)
                    .toList();
            ctx.json(Map.of("ok", true, "leaderboard", sorted));
        });

        app.get("/api/profile/{playerId}", ctx -> {
            String pid = ctx.pathParam("playerId");
            Map<String, Object> prof = LEADERBOARD.get(pid);
            if (prof == null) {
                ctx.status(404).json(Map.of("ok", false, "error", "Profile not found"));
            } else {
                ctx.json(Map.of("ok", true, "profile", prof));
            }
        });

        app.post("/api/match-result", ctx -> {
            Map<?, ?> body = ctx.bodyAsClass(Map.class);
            String playerId = String.valueOf(body.get("playerId") != null ? body.get("playerId") : "");
            if (playerId.isBlank()) {
                ctx.status(400).json(Map.of("ok", false, "error", "Missing playerId"));
                return;
            }
            Map<String, Object> entry = Map.of(
                    "playerId", playerId,
                    "nickname", String.valueOf(body.get("nickname") != null ? body.get("nickname") : "Commander"),
                    "rankStars", ((Number) (body.get("rankStars") != null ? body.get("rankStars") : 0)).intValue(),
                    "rankTier", String.valueOf(body.get("rankTier") != null ? body.get("rankTier") : "Trainee"),
                    "wins", ((Number) (body.get("wins") != null ? body.get("wins") : 0)).intValue(),
                    "matchesPlayed", ((Number) (body.get("matchesPlayed") != null ? body.get("matchesPlayed") : 0)).intValue(),
                    "mvpCount", ((Number) (body.get("mvpCount") != null ? body.get("mvpCount") : 0)).intValue(),
                    "updatedAt", Instant.now().toString()
            );
            LEADERBOARD.put(playerId, entry);
            ctx.json(Map.of("ok", true, "profile", entry));
        });

        app.post("/api/combat/calc", ctx -> {
            Map<?, ?> body = ctx.bodyAsClass(Map.class);
            double rawDamage = ((Number) body.getOrDefault("rawDamage", 100)).doubleValue();
            double baseDef = ((Number) body.getOrDefault("baseDef", 25)).doubleValue();
            double flatPen = ((Number) body.getOrDefault("flatPen", 0)).doubleValue();
            double pctPen = ((Number) body.getOrDefault("pctPen", 0)).doubleValue();
            double mult = computeMitigation(baseDef, flatPen, pctPen);
            ctx.json(Map.of(
                    "finalDamage", Math.max(1L, Math.round(rawDamage * mult)),
                    "mitigationFactor", mult
            ));
        });

        app.ws("/ws/arena", ws -> {
            ws.onConnect(ctx -> {
                CLIENTS.put(ctx.sessionId(), ctx);
                CLIENT_ROOMS.put(ctx.sessionId(), "arena_colosseum");
            });
            ws.onMessage(ctx -> {
                String msg = ctx.message();
                if (msg.contains("\"roomCode\"") && msg.contains("\"join\"")) {
                    int idx = msg.indexOf("\"roomCode\"");
                    int colon = msg.indexOf(':', idx);
                    int q1 = msg.indexOf('"', colon + 1);
                    int q2 = q1 >= 0 ? msg.indexOf('"', q1 + 1) : -1;
                    if (q1 >= 0 && q2 > q1 + 1) {
                        CLIENT_ROOMS.put(ctx.sessionId(), "priv_" + msg.substring(q1 + 1, q2));
                    }
                }
                String senderRoom = CLIENT_ROOMS.getOrDefault(ctx.sessionId(), "arena_colosseum");
                for (Map.Entry<String, WsContext> entry : CLIENTS.entrySet()) {
                    WsContext peer = entry.getValue();
                    if (peer.session.isOpen() && senderRoom.equals(CLIENT_ROOMS.getOrDefault(entry.getKey(), "arena_colosseum"))) {
                        peer.send(msg);
                    }
                }
            });
            ws.onClose(ctx -> {
                CLIENTS.remove(ctx.sessionId());
                CLIENT_ROOMS.remove(ctx.sessionId());
            });
        });

        Executors.newSingleThreadScheduledExecutor().scheduleAtFixedRate(() -> {
            // Keepalive tick
        }, 25, 25, TimeUnit.SECONDS);
    }
}
