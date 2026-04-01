// -------------------- dashboard.js --------------------
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { getRanking } = require("../../utils/wartStats");

module.exports = (app, client, clanTag, clashApiToken) => {
  const API_HEADERS = { Authorization: `Bearer ${clashApiToken}` };
  const DATA_PATH = path.join(__dirname, "../../data/contributions.json");
  const STATS_FILE_PATH = path.join(__dirname, "../../data/stats-mois.json");
  const DISCORD_LINKS_PATH = path.join(
    __dirname,
    "../../data/discord-links.json"
  );
  const WAR_ATTACKS_PATH = path.join(__dirname, "../../data/war-attacks.json");

  // -------------------- FONCTIONS UTILITAIRES --------------------

  function safeRead(filename) {
    try {
      const filePath = path.join(__dirname, "../../data", filename);
      if (!fs.existsSync(filePath)) return [];
      const raw = fs.readFileSync(filePath, "utf8");
      return JSON.parse(raw);
    } catch (err) {
      console.error(`❌ Erreur lecture ${filename}:`, err);
      return [];
    }
  }

  function loadContributions() {
    if (!fs.existsSync(DATA_PATH))
      fs.writeFileSync(DATA_PATH, JSON.stringify({}));
    return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
  }

  function loadDiscordLinks() {
    if (!fs.existsSync(DISCORD_LINKS_PATH)) return {};
    try {
      return JSON.parse(fs.readFileSync(DISCORD_LINKS_PATH, "utf-8"));
    } catch (e) {
      console.error("Erreur lecture discord-links.json", e);
      return {};
    }
  }

  // -------------------- FONCTIONS API --------------------

  async function fetchClanInfo() {
    try {
      const encodedTag = encodeURIComponent(clanTag);
      const res = await axios.get(
        `https://api.clashofclans.com/v1/clans/${encodedTag}`,
        {
          headers: API_HEADERS,
        }
      );
      return res.data;
    } catch (err) {
      console.error(
        "❌ Erreur fetchClanInfo:",
        err.response?.data || err.message
      );
      return null;
    }
  }

  async function fetchClanMembers() {
    try {
      const encodedTag = encodeURIComponent(clanTag);
      const res = await axios.get(
        `https://api.clashofclans.com/v1/clans/${encodedTag}/members`,
        {
          headers: API_HEADERS,
        }
      );
      return res.data.items || [];
    } catch (err) {
      console.error(
        "❌ Erreur fetchClanMembers:",
        err.response?.data || err.message
      );
      return [];
    }
  }

  async function fetchPlayer(tag) {
    try {
      const encodedTag = encodeURIComponent(tag);
      const res = await axios.get(
        `https://api.clashofclans.com/v1/players/${encodedTag}`,
        {
          headers: API_HEADERS,
        }
      );
      return res.data;
    } catch (err) {
      console.error(
        `❌ Erreur fetchPlayer(${tag}):`,
        err.response?.data || err.message
      );
      return null;
    }
  }

  async function fetchLastWar() {
    try {
      const encodedTag = encodeURIComponent(clanTag);
      const res = await axios.get(
        `https://api.clashofclans.com/v1/clans/${encodedTag}/warlog`,
        {
          headers: API_HEADERS,
        }
      );
      const items = res.data.items;
      return items && items.length > 0 ? items[0] : null;
    } catch (err) {
      console.error(
        "❌ Erreur fetchLastWar:",
        err.response?.data || err.message
      );
      return null;
    }
  }

  async function fetchCurrentWar() {
    try {
      const encodedTag = encodeURIComponent(clanTag);
      const res = await axios.get(
        `https://api.clashofclans.com/v1/clans/${encodedTag}/currentwar`,
        {
          headers: API_HEADERS,
        }
      );
      return res.data;
    } catch (err) {
      console.error(
        "❌ Erreur fetchCurrentWar:",
        err.response?.data || err.message
      );
      return null;
    }
  }
  
  async function fetchLeagueGroup() {
    try {
      const encodedTag = encodeURIComponent(clanTag);
      const res = await axios.get(
        `https://api.clashofclans.com/v1/clans/${encodedTag}/currentwar/leaguegroup`,
        { headers: API_HEADERS }
      );
      return res.data;
    } catch (err) {
      console.error("❌ Erreur fetchLeagueGroup:", err.response?.data || err.message);
      return null;
    }
  }

  async function fetchLeagueWar(warTag) {
    try {
      const encoded = encodeURIComponent(warTag);
      const res = await axios.get(
        `https://api.clashofclans.com/v1/clanwarleagues/wars/${encoded}`,
        { headers: API_HEADERS }
      );
      return res.data;
    } catch (err) {
      console.error("❌ Erreur fetchLeagueWar:", err.response?.data || err.message);
      return null;
    }
  }


  async function fetchWarlog() {
    try {
      const encodedTag = encodeURIComponent(clanTag);
      const res = await axios.get(
        `https://api.clashofclans.com/v1/clans/${encodedTag}/warlog`,
        {
          headers: API_HEADERS,
        }
      );
      return res.data.items || [];
    } catch (err) {
      console.error(
        "❌ Erreur fetchWarlog:",
        err.response?.data || err.message
      );
      return [];
    }
  }

  // -------------------- STATS MENSUELLES --------------------

  function getOrUpdateMonthlyStats(clanPoints) {
    let statsFile = {
      lastMonth: null,
      lastMonthYear: null,
      startTrophies: null,
    };
    if (fs.existsSync(STATS_FILE_PATH)) {
      try {
        statsFile = JSON.parse(fs.readFileSync(STATS_FILE_PATH, "utf-8"));
      } catch (e) {
        console.error("Erreur lecture stats-mois.json", e);
      }
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    if (
      statsFile.lastMonth !== currentMonth ||
      statsFile.lastMonthYear !== currentYear
    ) {
      statsFile.lastMonth = currentMonth;
      statsFile.lastMonthYear = currentYear;
      statsFile.startTrophies = clanPoints;
      fs.writeFileSync(STATS_FILE_PATH, JSON.stringify(statsFile, null, 2));
    }

    return statsFile;
  }

  async function getEffectiveCurrentWar() {
    // 1️⃣ Essayer la GDC normale
    const currentWar = await fetchCurrentWar();

    if (currentWar && (currentWar.state === "inWar" || currentWar.state === "preparation")) {
      return { type: "normal", war: currentWar };
    }

    // 2️⃣ Essayer la LDC
    const leagueGroup = await fetchLeagueGroup();
    if (!leagueGroup || !leagueGroup.rounds) {
      return { type: "none", war: null };
    }

    // Trouver un round avec des warTags valides
    const activeRound = leagueGroup.rounds.find(round =>
      round.warTags.some(tag => tag && tag !== "#0")
    );

    if (!activeRound) {
      return { type: "none", war: null };
    }

    // Chercher une guerre où notre clan participe
    for (const warTag of activeRound.warTags) {
      if (!warTag || warTag === "#0") continue;

      const war = await fetchLeagueWar(warTag);
      if (!war) continue;

      if (war.clan?.tag === clanTag || war.opponent?.tag === clanTag) {
        return { type: "league", war };
      }
    }

    return { type: "none", war: null };
  }



  // -------------------- FONCTION COMMUNE --------------------

  async function getDashboardData() {
    const clan = await fetchClanInfo();
    const membersList = await fetchClanMembers();
    const lastWar = await fetchLastWar();
    const currentWar = await fetchCurrentWar();
    const warlog = await fetchWarlog();
    const contributionsData = loadContributions();

    if (!clan) throw new Error("Impossible de récupérer les infos du clan.");

    // Top membres
    const topMembers = [...membersList]
      .sort((a, b) => b.trophies - a.trophies)
      .slice(0, 3)
      .map((m) => ({ name: m.name, trophies: m.trophies }));

    // Statistiques mensuelles
    const statsFile = getOrUpdateMonthlyStats(clan.clanPoints);
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let statsMonth = null;
    try {
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const warsLastMonth = warlog.filter((war) => {
        const warDate = new Date(
          war.endTime.replace(/\..*$/, "").replace(/-/g, "/")
        );
        return (
          warDate.getMonth() === lastMonth &&
          warDate.getFullYear() === lastMonthYear
        );
      });

      let winStreak = 0,
        maxStreak = 0,
        totalStars = 0,
        totalAttacks = 0,
        totalDestruction = 0;

      warsLastMonth.forEach((war) => {
        if (war.result === "win") winStreak++;
        else winStreak = 0;
        if (winStreak > maxStreak) maxStreak = winStreak;
        totalStars += war.clan.stars;
        totalAttacks += war.clan.attacks;
        totalDestruction += war.clan.destructionPercentage;
      });

      const avgStars =
        totalAttacks > 0 ? (totalStars / totalAttacks).toFixed(2) : "0";
      const avgDestruction =
        warsLastMonth.length > 0
          ? (totalDestruction / warsLastMonth.length).toFixed(1)
          : "0";

      let trophiesGained = "?";
      if (
        statsFile.lastMonth === currentMonth &&
        statsFile.lastMonthYear === currentYear &&
        typeof statsFile.startTrophies === "number"
      ) {
        trophiesGained = clan.clanPoints - statsFile.startTrophies;
      }

      statsMonth = {
        winStreak: maxStreak,
        trophiesGained,
        avgStars,
        avgDestruction,
      };
    } catch (err) {
      console.error("Erreur stats du mois (dashboard):", err);
    }

    // Activité
    const activeMembersCount = membersList.filter(
      (m) => contributionsData[m.tag] && contributionsData[m.tag] > 0
    ).length;
    const activePercent =
      membersList.length > 0
        ? ((activeMembersCount / membersList.length) * 100).toFixed(0)
        : 0;

    // Dernière guerre
    let lastGdcResult = "Non disponible",
      lastGdcOpponent = "?",
      lastGdcScore = "?",
      lastGdcStars = "?";
    if (lastWar) {
      const starsClan = lastWar.clan.stars;
      const starsOpponent = lastWar.opponent.stars;
      lastGdcOpponent = lastWar.opponent.name || "?";
      lastGdcScore = `${starsClan} - ${starsOpponent}`;
      lastGdcStars = starsClan;
      if (lastWar.result === "win") lastGdcResult = "Victoire ✅";
      else if (lastWar.result === "lose") lastGdcResult = "Défaite ❌";
      else lastGdcResult = "Égalité 🤝";
    }

    let currentGdcOpponent = "?",
      currentGdcScore = "?",
      currentGdcAttacks = "?";

    const currentWarMembers = { our: [], opponent: [] };

    if (currentWar) {
      const us = currentWar.clan;
      const them = currentWar.opponent;

      currentGdcOpponent = them?.name || "?";
      currentGdcScore = `${us?.stars ?? 0} - ${them?.stars ?? 0}`;
      currentGdcAttacks = us?.attacks?.length ?? "0";

      currentWarMembers.our = us?.members || [];
      currentWarMembers.opponent = them?.members || [];
    }


    if (currentWar && currentWar.state === "inWar") {
      currentGdcOpponent = currentWar.opponent?.name || "?";
      currentGdcScore = `${currentWar.clan?.stars ?? 0} - ${
        currentWar.opponent?.stars ?? 0
      }`;
      currentGdcAttacks = currentWar.clan?.attacks
        ? currentWar.clan.attacks.length
        : "0";
      currentWarMembers.our = currentWar.clan?.members || [];
      currentWarMembers.opponent = currentWar.opponent?.members || [];
    }

    const capitalLeague = clan.capitalLeague
      ? `${clan.capitalLeague.name} 🏰`
      : "N/A";

    return {
      clan,
      membersList,
      statsMonth,
      activePercent,
      topMembers,
      lastGdcResult,
      lastGdcOpponent,
      lastGdcScore,
      lastGdcStars,
      currentGdcOpponent,
      currentGdcScore,
      currentGdcAttacks,
      currentWarMembers,
      capitalLeague,
      clanName: clan.name,
      clanLevel: clan.clanLevel,
      clanTrophies: clan.clanPoints,
      clanMembersCount: membersList.length,
    };
  }

  // -------------------- ROUTES --------------------

  // 🏠 Dashboard principal
  app.get("/", async (req, res) => {
    try {
      const data = await getDashboardData();
      res.render("index", {
        botName: client.user.username,
        botAvatarUrl: client.user.displayAvatarURL(),
        guilds: client.guilds.cache.size,
        ping: client.ws.ping,
        clanName: data.clanName,
        clanLevel: data.clanLevel,
        clanMembers: data.clanMembersCount,
        clanCapacity: 50,
        clanTrophies: data.clanTrophies,
        lastGdcResult: data.lastGdcResult,
        lastGdcOpponent: data.lastGdcOpponent,
        lastGdcScore: data.lastGdcScore,
        lastGdcStars: data.lastGdcStars,
        currentGdcOpponent: data.currentGdcOpponent,
        currentGdcScore: data.currentGdcScore,
        currentGdcAttacks: data.currentGdcAttacks,
        currentLdcPosition: data.capitalLeague,
        activePercent: data.activePercent,
        statsMonth: data.statsMonth,
        topMembers: data.topMembers,
      });
    } catch (err) {
      console.error("Erreur / :", err);
      res.status(500).send("Erreur lors du chargement du dashboard.");
    }
  });

  // 🔧 Page Admin GDC
  app.get("/admin-gdc", async (req, res) => {
    try {
      const data = await getDashboardData();
      res.render("admin-gdc", {
        title: "Admin GDC",
        botName: client.user.username,
        botAvatarUrl: client.user.displayAvatarURL(),
        guilds: client.guilds.cache.size,
        ping: client.ws.ping,
        clanName: data.clanName,
        clanLevel: data.clanLevel,
        clanMembers: data.clanMembersCount,
        clanCapacity: 50,
        clanTrophies: data.clanTrophies,
        lastGdcResult: data.lastGdcResult,
        lastGdcOpponent: data.lastGdcOpponent,
        lastGdcScore: data.lastGdcScore,
        lastGdcStars: data.lastGdcStars,
        currentGdcOpponent: data.currentGdcOpponent,
        currentGdcScore: data.currentGdcScore,
        currentGdcAttacks: data.currentGdcAttacks,
        currentLdcPosition: data.capitalLeague,
        activePercent: data.activePercent,
        statsMonth: data.statsMonth,
        topMembers: data.topMembers,
      });
    } catch (err) {
      console.error("Erreur /admin-gdc :", err);
      res.status(500).send("Erreur lors du chargement de la page Admin GDC.");
    }
  });

  // 👥 Page des membres
  app.get("/members", async (req, res) => {
    try {
      const membersList = await fetchClanMembers();
      const discordLinks = loadDiscordLinks();
      const roleMapping = {
        leader: "Chef 👑",
        coLeader: "Chef adjoint 🛡️",
        admin: "Aîné ⚔️",
        member: "Membre 👥",
      };

      const memberCards = await Promise.all(
        membersList.map(async (member) => {
          const playerData = await fetchPlayer(member.tag);
          const discordId = discordLinks[member.name] || null;
          return {
            tag: member.tag,
            name: member.name,
            townHallLevel: playerData?.townHallLevel || "?",
            trophies: member.trophies,
            role: roleMapping[member.role] || "Membre 👥",
            warPreference:
              playerData?.warPreference === "in"
                ? "Actif en GDC ✅"
                : "Non actif ❌",
            discordId,
          };
        })
      );

      res.render("members", {
        title: "Membres du clan",
        botName: client.user.username,
        botAvatarUrl: client.user.displayAvatarURL(),
        memberCards,
      });
    } catch (err) {
      console.error("❌ Erreur /members :", err);
      res.status(500).send("Erreur lors du chargement des membres du clan.");
    }
  });

  // 📩 Route POST pour attribuer une attaque
  app.post("/assign-attack", async (req, res) => {
    try {
      const { discordId, memberName, hdvNumber } = req.body || {};

      if (!hdvNumber) return res.status(400).send("Aucun numéro d'HDV fourni.");
      if (!discordId)
        return res.status(400).send("Aucun ID Discord fourni pour notifier.");

      const channelId = "1437513827813167265";
      let channel;

      try {
        channel = await client.channels.fetch(channelId);
      } catch (err) {
        console.error("Erreur fetch channel:", err);
        return res
          .status(500)
          .send("Impossible de récupérer le salon Discord (Missing Access ?).");
      }

      if (!channel) {
        console.error("❌ Salon introuvable.");
        return res.status(404).send("Salon introuvable.");
      }

      const message = `📢 **Nouvelle attaque attribuée !**\n\n<@${discordId}> → Nous t'avons attribué le numéro **${hdvNumber}**.`;
      await channel.send(message);
      res.status(200).send("Message envoyé !");
    } catch (err) {
      console.error("Erreur /assign-attack :", err);
      res.status(500).send("Erreur lors de l'envoi du message.");
    }
  });

  // 📜 Page Registre des attaques
  app.get("/registre-attaques", async (req, res) => {
    try {
      const membersList = await fetchClanMembers();
      const discordLinks = loadDiscordLinks();

      let attackData = [];
      if (fs.existsSync(WAR_ATTACKS_PATH)) {
        attackData = JSON.parse(fs.readFileSync(WAR_ATTACKS_PATH, "utf-8"));
      }

      const roleMapping = {
        leader: "Chef 👑",
        coLeader: "Chef adjoint 🛡️",
        admin: "Aîné ⚔️",
        member: "Membre 👥",
      };

      const memberCards = await Promise.all(
        membersList.map(async (member) => {
          const playerData = await fetchPlayer(member.tag);
          const discordId = discordLinks[member.name] || null;
          const memberAttacks = attackData.filter(
            (a) => a.attackerName === member.name
          );

          return {
            tag: member.tag,
            name: member.name,
            townHallLevel: playerData?.townHallLevel || "?",
            trophies: member.trophies,
            role: roleMapping[member.role] || "Membre 👥",
            warPreference:
              playerData?.warPreference === "in"
                ? "Actif en GDC ✅"
                : "Non actif ❌",
            discordId,
            attack1: memberAttacks[0] || null,
            attack2: memberAttacks[1] || null,
          };
        })
      );

      res.render("registre-attaques", {
        title: "Registre des attaques",
        botName: client.user.username,
        botAvatarUrl: client.user.displayAvatarURL(),
        memberCards,
      });
    } catch (err) {
      console.error("❌ Erreur /registre-attaques :", err);
      res
        .status(500)
        .send("Erreur lors du chargement du registre des attaques.");
    }
  });

  // 🛡️ Page GDC
  app.get("/gdc", async (req, res) => {
    try {
      const { war, type } = await getEffectiveCurrentWar();

      if (!war) {
        return res.render("gdc", {
          title: "Membres de la GDC",
          botName: client.user.username,
          botAvatarUrl: client.user.displayAvatarURL(),
          ourMembers: [],
          opponentMembers: [],
          opponentName: "Aucun (pas de GDC ou LDC en cours)",
        });
      }

      // Tri correct
      const ourMembersRaw = (war.clan?.members || []).sort(
        (a, b) => a.mapPosition - b.mapPosition
      );
      const opponentMembersRaw = (war.opponent?.members || []).sort(
        (a, b) => a.mapPosition - b.mapPosition
      );

      // ⭐ Numérotation propre et linéaire
      const ourMembers = ourMembersRaw.map((m, i) => ({
        ...m,
        displayPos: i + 1,
      }));

      const opponentMembers = opponentMembersRaw.map((m, i) => ({
        ...m,
        displayPos: i + 1,
      }));

      res.render("gdc", {
        title: type === "league" ? "Membres de la LDC" : "Membres de la GDC",
        botName: client.user.username,
        botAvatarUrl: client.user.displayAvatarURL(),
        ourMembers,
        opponentMembers,
        opponentName: war.opponent?.name || "Aucun",
      });
    } catch (err) {
      console.error("❌ Erreur /gdc :", err);
      res.status(500).send("Erreur lors du chargement des membres de la GDC.");
    }
  });



  // 📊 Page Stats
  app.get("/stats", async (req, res) => {
    try {
      const data = await getDashboardData();
      const currentWar = await fetchCurrentWar();
      const opponentMembers = (currentWar?.opponent?.members || []).sort(
        (a, b) => a.mapPosition - b.mapPosition
      );
      const opponentName = currentWar?.opponent?.name || "Aucun";
      const memberStats = getRanking();

      res.render("stats", {
        title: "Stats du clan",
        botName: client.user.username,
        botAvatarUrl: client.user.displayAvatarURL(),
        guilds: client.guilds.cache.size,
        ping: client.ws.ping,
        clanName: data.clanName,
        clanLevel: data.clanLevel,
        clanMembers: data.clanMembersCount,
        clanCapacity: 50,
        clanTrophies: data.clanTrophies,
        lastGdcResult: data.lastGdcResult,
        lastGdcOpponent: data.lastGdcOpponent,
        lastGdcScore: data.lastGdcScore,
        lastGdcStars: data.lastGdcStars,
        currentGdcOpponent: data.currentGdcOpponent,
        currentGdcScore: data.currentGdcScore,
        currentGdcAttacks: data.currentGdcAttacks,
        currentLdcPosition: data.capitalLeague,
        activePercent: data.activePercent,
        statsMonth: data.statsMonth,
        topMembers: data.topMembers,
        opponentMembers,
        opponentName,
        memberStats,
      });
    } catch (err) {
      console.error("Erreur /stats :", err);
      res.status(500).send("Erreur lors du chargement des stats.");
    }
  });

  // 🏰 Page LDC
  app.get("/ldc", (req, res) => {
    res.render("ldc", {
      title: "Ligue des clans",
      botName: client.user.username,
      botAvatarUrl: client.user.displayAvatarURL(),
    });
  });

  // ⚠️ SUPPRIMÉ: /settings et /chef sont gérés dans main.js avec protection par rôles

  // 📋 Page Plan d'attaques
  app.get("/plan-attaques", (req, res) => {
    res.render("plan-attaques", {
      title: "Plan d'attaques",
      botName: client.user.username,
      botAvatarUrl: client.user.displayAvatarURL(),
    });
  });

  // ⚙️ Channel Settings
  app.get("/settings/channelsettings", (req, res) => {
    res.render("channelsettings", {
      title: "Paramètres des canaux",
      botName: client.user.username,
      botAvatarUrl: client.user.displayAvatarURL(),
    });
  });

  // Route pour mettre à jour les channel IDs
  app.post('/updateChannelID', (req, res) => {
    try {
      const { key, value } = req.body;

      // Validation basique
      if (!key || value === undefined) {
        return res.status(400).json({ error: 'Key et value sont requis' });
      }

      // Chemin vers ton fichier de config
      const configPath = path.join(__dirname, '..', '..', 'data', 'config', 'logsConfig.json');

      // Lire le fichier actuel
      const fileContent = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(fileContent);

      // Mettre à jour la valeur
      config[key] = value;

      // Sauvegarder le fichier
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');

      console.log(`✅ Channel ID mis à jour : ${key} = ${value}`);

      res.json({ success: true, message: 'Channel ID mis à jour avec succès' });

    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour :', error);
      res.status(500).json({ error: 'Erreur serveur lors de la mise à jour' });
    }
  });

  // 📝 Page Logs
  app.get("/settings/logs", (req, res) => {
    const messageDeleteLogs = safeRead("messageDelete.json");
    const messageUpdateLogs = safeRead("messageUpdate.json");
    const roleUpdateLogs = safeRead("roleUpdate.json");
    const antilinkDataLogs = safeRead("antilinkData.json");
    const ticketCreatedLogs = safeRead("ticketCreated.json");
    const ticketClosedLogs = safeRead("ticketClosed.json");
    const ticketStatutLogs = safeRead("ticketStatut.json");

    res.render("logs", {
      title: "Logs du bot",
      botName: client.user.username,
      botAvatarUrl: client.user.displayAvatarURL(),
      messageDeleteLogs,
      messageUpdateLogs,
      roleUpdateLogs,
      antilinkDataLogs,
      ticketCreatedLogs,
      ticketClosedLogs,
      ticketStatutLogs,
    });
  });

  // 👥 Récupérer les membres Discord du serveur
  app.get("/api/members", async (req, res) => {
    try {
      const guild = client.guilds.cache.get("1421836468833222678"); // Remplace par ton ID
      if (!guild) return res.status(404).json({ members: [] });

      const members = await guild.members.fetch();
      const sorted = members.map(m => ({ id: m.id, username: m.user.username }))
                            .sort((a, b) => a.username.localeCompare(b.username));

      res.json({ members: sorted });
    } catch (err) {
      console.error("Erreur fetch members:", err);
      res.status(500).json({ members: [] });
    }
  });

  // 📤 Envoyer le plan d'attaque
  app.post("/api/send-gdc-plan", async (req, res) => {
    try {
      const { plan, manager } = req.body;
      if (!plan || !manager) return res.status(400).json({ message: "Données manquantes." });

      // Générer le texte selon le plan choisi
      let text = "";
      if (plan === "plan1") {
        text = `
Dérouler de cette GDC :

**Gérant de cette GDC** : <@${manager}> 

*1ère ATTAQUE OBLIGATOIRE dans les **12 premières heures** sur son **VIS-À-VIS UNIQUEMENT **❗*

⭐ **- Par la suite** :
Les attaques seront **attribuées en fonction des étoiles prises** en dessous de nos vis-à-vis.

> ⚠️ **- ATTENTION** :
> 👉 - TOUTE ATTAQUE **non faite dans le temps demandé,**
> 👉 **- Ou numéro non respecté,**
> ➡️ **- SERA SANCTIONNÉE ❗**

💥 - **Bon jeu, bonne guerre !**

||<@&1437513776235544616> ||
`;
            } else if (plan === "plan2") {
              text = `
Déroulé de cette GDC :

**Gérant de cette GDC :** <@${manager}> 

1ère ATTAQUE OBLIGATOIRE dans les **12 premières heures sur l’HDV en face de vous -1** ❗️
-# Vous prenez celui juste en dessous (ex : si votre vis-à-vis est le 12, alors vous prenez le 13).

⭐ **- Par la suite :**
Les attaques seront attribuées en fonction des étoiles prises en dessous de nos vis-à-vis.

> ⚠️ **ATTENTION :**
> 👉 Toute attaque **non faite dans le temps demandé,
> 👉 Ou numéro non respecté,
> ➡️ SERA SANCTIONNÉE** ❗


💥 - **Bon jeu, bonne guerre !**

|| <@&1437513776235544616> ||
        `;
      }

      // ID du salon Discord où envoyer le message
      const channelId = "1437513810620711063"; // Remplace par ton salon
      const channel = await client.channels.fetch(channelId);
      if (!channel) return res.status(404).json({ message: "Salon introuvable." });

      await channel.send(text);
      res.json({ message: "Plan d'attaque envoyé !" });

    } catch (err) {
      console.error("Erreur /api/send-gdc-plan :", err);
      res.status(500).json({ message: "Erreur lors de l'envoi du plan." });
    }
  });

};