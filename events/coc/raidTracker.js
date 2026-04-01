const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { EmbedBuilder } = require("discord.js");
const { clanTag, clashApiToken } = require("../../config");

const DATA_PATH = path.join(__dirname, "../../data/raids.json");
const API_HEADERS = { Authorization: `Bearer ${clashApiToken}` };

/**
 * Vérifie si nous sommes pendant un Raid Weekend.
 * Vendredi 19h → Lundi 7h (inclus)
 */
function isRaidWeekend() {
  const now = new Date();
  const day = now.getDay(); // 0 = dimanche, 1 = lundi, ..., 6 = samedi
  const hour = now.getHours();

  return (
    (day === 5 && hour >= 19) || // vendredi après 19h
    day === 6 || // samedi
    day === 0 || // dimanche
    (day === 1 && hour < 9) // lundi avant 7h
  );
}

/**
 * Charge les données locales de raids (historique des attaques reportées)
 */
function loadData() {
  if (!fs.existsSync(DATA_PATH)) {
    fs.writeFileSync(DATA_PATH, JSON.stringify({ reported: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
}

/**
 * Sauvegarde les données dans le fichier raids.json
 */
function saveData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

/**
 * Récupère la saison de raid actuelle via l’API Clash of Clans
 */
async function fetchRaidSeason() {
  const encodedTag = encodeURIComponent(clanTag);
  const url = `https://api.clashofclans.com/v1/clans/${encodedTag}/capitalraidseasons`;
  const res = await axios.get(url, { headers: API_HEADERS });

  if (!res.data.items?.length) throw new Error("Aucune saison de raid trouvée !");
  return res.data.items[0];
}

/**
 * Suivi des raids — détecte les nouvelles attaques et les envoie sur Discord
 */
async function trackRaids(bot, channelId) {
  if (!isRaidWeekend()) {
    console.log("[RAID] Hors période de raid, nettoyage du JSON.");
    saveData({ reported: [] }); // Reset à chaque fin de week-end
    return;
  }

  const data = loadData();
  const seen = new Set(data.reported);

  let season;
  try {
    season = await fetchRaidSeason();
  } catch (err) {
    console.error("[RAID] Erreur API :", err.message);
    return;
  }

  if (!season.members?.length) {
    console.log("[RAID] Aucun membre trouvé dans la saison actuelle.");
    return;
  }

  for (const member of season.members) {
    if (!member.attacks) continue;

    for (const attack of member.attacks) {
      const attackId = `${member.tag}-${attack.battleTime}`;

      if (!seen.has(attackId)) {
        seen.add(attackId);

        const embed = new EmbedBuilder()
          .setTitle("⚔️ Nouvelle attaque de Raid détectée !")
          .setDescription(`**${member.name}** a attaqué en raid !`)
          .addFields(
            { name: "🏰 Pourcentage", value: `${attack.destructionPercent}%`, inline: true },
            { name: "💰 Butin", value: `${attack.loot}`, inline: true },
            { name: "📍 District", value: attack.districtName || "Inconnu", inline: false }
          )
          .setColor("#fc3535")
          .setFooter({
            text: `Heure : ${new Date(attack.battleTime).toLocaleString("fr-FR")}`,
          });

        try {
          const channel = await bot.channels.fetch(channelId);
          await channel.send({ embeds: [embed] });
          console.log(`[RAID] ✅ ${member.name} a attaqué (${attack.destructionPercent}%)`);
        } catch (err) {
          console.error("[RAID] Erreur d’envoi Discord :", err.message);
        }
      }
    }
  }

  saveData({ reported: Array.from(seen) });
}

/**
 * Lance la boucle de tracking automatique toutes les 2 minutes
 */
function startRaidTracking(bot, channelId) {
  console.log("✅ Raid Tracker lancé !");
  trackRaids(bot, channelId).catch(err => console.error("[RAID] Erreur initiale :", err.message));

  setInterval(() => {
    trackRaids(bot, channelId).catch(err => console.error("[RAID] Erreur :", err.message));
  }, 2 * 60 * 1000); // toutes les 2 minutes
}

module.exports = { startRaidTracking };
