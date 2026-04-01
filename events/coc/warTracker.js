// events/coc/warTracker.js
const fs = require("fs");
const path = require("path");
const coc = require("./cocClient");
const Discord = require("discord.js");

const dataPath = path.join(__dirname, "../../data/war-attacks.json");
let lastAttacks = new Set();

// 🔹 Charger les attaques déjà envoyées (évite les doublons après reboot)
if (fs.existsSync(dataPath)) {
  try {
    const raw = fs.readFileSync(dataPath, "utf8");
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      for (const atk of parsed) {
        const id = `${atk.attackerTag}-${atk.defenderTag}-${atk.order}`;
        lastAttacks.add(id);
      }
      console.log(`🔄 Attaques chargées depuis le fichier : ${lastAttacks.size} entrées`);
    }
  } catch (err) {
    console.warn("⚠️ Impossible de charger war-attacks.json, fichier ignoré.");
  }
}

// 🔹 Fonction utilitaire pour enregistrer les attaques
function saveAttackData(attackData) {
  let fileData = [];

  if (fs.existsSync(dataPath)) {
    try {
      const raw = fs.readFileSync(dataPath, "utf8");
      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        fileData = parsed;
      } else {
        console.warn("⚠️ war-attacks.json n'était pas un tableau, réinitialisation.");
        fileData = [];
      }
    } catch (err) {
      console.warn("⚠️ Impossible de parser war-attacks.json, réinitialisation.");
      fileData = [];
    }
  }

  fileData.push(attackData);

  fs.writeFileSync(dataPath, JSON.stringify(fileData, null, 2), "utf8");
}

async function checkWar(bot, clanTag, channelId) {
  try {
    const war = await coc.getCurrentWar(clanTag);
    if (war.state !== "inWar") return;

    const channel = await bot.channels.fetch(channelId);
    if (!channel) return;

    const playerMap = new Map();
    for (const member of war.clan.members.concat(war.opponent.members)) {
      playerMap.set(member.tag, member.name);
    }

    const allAttacks = [];
    for (const member of war.clan.members) {
      if (!member.attacks) continue;
      for (const attack of member.attacks) {
        allAttacks.push(attack);
      }
    }

    for (const attack of allAttacks) {
      const attackId = `${attack.attackerTag}-${attack.defenderTag}-${attack.order}`;

      if (!lastAttacks.has(attackId)) {
        lastAttacks.add(attackId);

        const attackerName = playerMap.get(attack.attackerTag) || attack.attackerTag;
        const defenderName = playerMap.get(attack.defenderTag) || attack.defenderTag;

        // 🔹 Sauvegarde locale
        saveAttackData({
          attackerTag: attack.attackerTag,
          defenderTag: attack.defenderTag,    // ← OBLIGATOIRE !
          attackerName,
          defenderName,
          stars: attack.stars,
          destruction: attack.destruction,
          duration: attack.duration,
          order: attack.order,
        });


        // 🔹 Envoi Discord
        const embed = new Discord.EmbedBuilder()
          .setTitle("📣 | Nouvelle attaque en GDC !")
          .setDescription(`**${attackerName}** a attaqué **${defenderName}**`)
          .addFields(
            { name: "Étoiles", value: `${attack.stars} ⭐`, inline: true },
            { name: "Dégâts", value: `${attack.destruction} % ⚔️`, inline: true },
            { name: "Temps", value: `${attack.duration} s ⏱️`, inline: true }
          )
          .setColor("Orange")
          .setTimestamp();

        await channel.send({ embeds: [embed] });
      }
    }
  } catch (err) {
    console.error("Erreur GDC :", err);
  }
}

function startWarTracking(bot, clanTag, channelId) {
  setInterval(() => checkWar(bot, clanTag, channelId), 60_000);
}

module.exports = { startWarTracking };