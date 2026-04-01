// -------------------- main.js --------------------

require("dotenv").config();
const { ActivityType } = require("discord.js");
const Client = require("./classes/Client");
const client = new Client();

const { clanTag, clashApiToken } = require("./config");
const { fetchClanMembers } = require("./events/coc/contributionTracker");
const fs = require("fs");
const path = require("path");
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;

// -------------------- CONSTANTES --------------------
const maintenanceFilePath = path.join(__dirname, "./data/maintenance.json");
const LOG_CHANNEL_ID = "1439676896135745660";
const guildId = "1383848143484883140";

// RÔLES REQUIS
const roleChef = "1439674603030188053";
const roleSettings = "1439674615675883561";

let botReady = false;

// -------------------- GESTION ERREURS --------------------
process.on("uncaughtException", async (err) => {
    console.error("🔥 CRASH détecté :", err);
    if (botReady) {
        const channel = client.channels.cache.get(LOG_CHANNEL_ID);
        if (channel) channel.send(`⚠️ **CRASH**\n\`\`\`${err.stack}\`\`\``);
    }
});

process.on("unhandledRejection", async (err) => {
    console.error("⚠️ Promesse rejetée :", err);
    if (botReady) {
        const channel = client.channels.cache.get(LOG_CHANNEL_ID);
        if (channel) channel.send(`⚠️ **ERREUR NON GÉRÉE**\n\`\`\`${err}\`\`\``);
    }
});

client.on("error", (err) => {
    console.error("Erreur Discord.js :", err);
    if (botReady) {
        const channel = client.channels.cache.get(LOG_CHANNEL_ID);
        if (channel) channel.send(`⚠️ **Erreur Discord.js** : \`${err.message}\``);
    }
});

// -------------------- MIDDLEWARE AUTH --------------------

function isLogged(req) {
    return req.isAuthenticated && req.isAuthenticated();
}

function requireAuth(req, res, next) {
    if (!isLogged(req)) return res.redirect("/auth/discord");
    next();
}

const roleCache = new Map(); // key : userId, value : { roles, expires }

// ⭐ Middleware de vérification de rôle
function requireRole(roleId) {
    return async (req, res, next) => {
        try {
            const userId = req.user?.id;
            const accessToken = req.user?.accessToken;

            if (!accessToken || !userId) {
                return res.redirect("/login");
            }

            const cached = roleCache.get(userId);
            const now = Date.now();

            // -------------------------
            // 1️⃣ Si le cache dit OUI -> OK
            // -------------------------
            if (cached && cached.expires > now && cached.roles.includes(roleId)) {
                return next();
            }

            // -------------------------
            // 2️⃣ Sinon -> FORCER vérification API
            // -------------------------

            const response = await fetch(
                `https://discord.com/api/v10/users/@me/guilds/${guildId}/member`,
                {
                    headers: { Authorization: `Bearer ${accessToken}` },
                }
            );

            if (!response.ok) {
                return res.status(403).render("access-denied", {
                    reason: "Impossible de vérifier vos permissions Discord."
                });
            }

            const member = await response.json();
            const roles = member.roles;

            // -------------------------
            // 3️⃣ Mise à jour du cache
            // -------------------------
            roleCache.set(userId, {
                roles,
                expires: now + 30_000
            });

            // -------------------------
            // 4️⃣ Vérification finale
            // -------------------------
            if (roles.includes(roleId)) {
                return next();
            }

            return res.status(403).render("access-denied", {
                reason: "Vous n'avez pas les permissions requises."
            });

        } catch (err) {
            console.error("Erreur requireRole:", err);
            return res.status(500).render("access-denied", {
                reason: "Erreur interne du serveur."
            });
        }
    };
}

// -------------------- DASHBOARD EXPRESS --------------------
function startDashboard(bot) {
    const app = express();
    const port = 3000;

    app.use(express.json());
    app.engine("html", require("ejs").renderFile);
    app.set("view engine", "html");
    app.set("views", path.join(__dirname, "site", "html"));

    app.use("/css", express.static(path.join(__dirname, "site", "css")));
    app.use("/js", express.static(path.join(__dirname, "site", "js")));
    app.use("/img", express.static(path.join(__dirname, "img")));
    app.get("/style.css", (req, res) => res.sendFile(path.join(__dirname, "site/css/style.css")));
    app.use("/data", express.static(path.join(__dirname, "/data")));

    // SESSION
    app.use(
        session({
            secret: "BOT-SECRET-KEY",
            resave: false,
            saveUninitialized: false,
        })
    );

    // PASSPORT
    app.use(passport.initialize());
    app.use(passport.session());

    passport.serializeUser((user, done) => done(null, user));
    passport.deserializeUser((obj, done) => done(null, obj));

    passport.use(
        new DiscordStrategy(
            {
                clientID: process.env.CLIENT_ID,
                clientSecret: process.env.CLIENT_SECRET,
                callbackURL: process.env.REDIRECT_URI,
                scope: ["identify", "guilds", "guilds.members.read"],
            },
            (accessToken, refreshToken, profile, done) => {
                profile.accessToken = accessToken;
                return done(null, profile);
            }
        )
    );

    // ROUTES AUTH
    app.get("/auth/discord", passport.authenticate("discord"));
    app.get(
        "/auth/discord/callback",
        passport.authenticate("discord", { failureRedirect: "/" }),
        (req, res) => res.redirect("/")
    );
    app.get("/logout", (req, res) => {
        req.logout(() => {});
        res.redirect("/");
    });

    // PAGE ACCÈS REFUSÉ
    app.get("/access-denied", (req, res) => {
        res.render("access-denied", { reason: "Accès refusé." });
    });

    // -------------------- ROUTES PROTÉGÉES --------------------

    // ⭐ ROUTES DASHBOARD COC (à charger AVANT les routes protégées pour éviter les conflits)
    const startDashboardRoutes = require("./events/coc/dashboard");
    startDashboardRoutes(app, bot, clanTag, clashApiToken);

    // -------------------- ROUTES PROTÉGÉES PAR RÔLES --------------------
    // ⚠️ Ces routes doivent être définies APRÈS dashboard.js pour les override si nécessaire

    // PAGE CHEF - Accessible uniquement avec le rôle Chef
    app.get("/admin", requireAuth, requireRole(roleChef), (req, res) => {
        res.render("admin", {
            title: "Chefs",
            botName: client.user.username,
            botAvatarUrl: client.user.displayAvatarURL()
        });
    });

    // PAGE SETTINGS - Accessible uniquement avec le rôle Settings
    app.get("/settings", requireAuth, requireRole(roleSettings), (req, res) => {
        res.render("settings", {
            title: "Settings Bot",
            botName: client.user.username,
            botAvatarUrl: client.user.displayAvatarURL()
        });
    });

    // START SERVER
    app.listen(port, () => {
        console.log(`🌐 Dashboard lancé : http://localhost:${port}`);
    });
}

// -------------------- LANCEMENT BOT DISCORD --------------------
(async () => await client.start(process.env.TOKEN))();

// -------------------- SERVICES AUTOMATIQUES COC --------------------
const { startContributionTracking } = require("./events/coc/contributionTracker");
startContributionTracking(client, "1439674697959870576");

const { startWarTracking } = require("./events/coc/warTracker");
startWarTracking(client, "#2C0GPRJP2", "1439674707556176015");

const { startRaidTracking } = require("./events/coc/raidTracker");
startRaidTracking(client, "1439674689243971694");

const { startCapitalTracking } = require("./events/coc/trackCapitalDistricts");
startCapitalTracking(client, "1439674689243971694");

const { startPendingDiscordSystem } = require("./utils/pendingDiscord");

// -------------------- BOT READY --------------------
client.once("ready", () => {
    console.log("✅ Bot connecté !");
    botReady = true;

    updateBotStatus(client);
    setInterval(() => updateBotStatus(client), 30 * 1000);

    startDashboard(client);
    startPendingDiscordSystem(client);
});

client.on("messageCreate", message => {
    if (message.author.bot) return;

    const salutations = ["salut", "slt", "coucou", "bonjour", "bjr", "yo"];

    // on met le message en minuscule pour comparer facilement
    const contenu = message.content.toLowerCase();

    // si une salutation est trouvée, on réagit
    if (salutations.some(mot => contenu.includes(mot))) {
        message.react("👋").catch(() => {});
    }
});


// -------------------- STATUS BOT --------------------
async function updateBotStatus(client) {
    try {
        let maintenance = { enabled: false };
        if (fs.existsSync(maintenanceFilePath)) {
            maintenance = JSON.parse(fs.readFileSync(maintenanceFilePath, "utf-8"));
        }

        if (maintenance.enabled) {
            await client.user.setPresence({
                activities: [{ name: `⚙️ - Maintenance`, type: ActivityType.Playing }],
                status: "dnd",
            });
            console.log("[STATUS] Mode maintenance activé !");
        } else {
            let count = 0;
            try {
                const clan = await fetchClanMembers();
                count = clan.length;
            } catch {}

            await client.user.setPresence({
                activities: [{ name: `👥 - ${count} / 50 Membres`, type: ActivityType.Playing }],
                status: "online",
            });
        }
    } catch (err) {
        console.error("Erreur statut :", err);
    }
}