const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");

const MEMBERS_PATH = path.join(__dirname, "../data/members.json");
const EMBED_MSG_PATH = path.join(__dirname, "../data/embedMessage.json");

// Charger les données
function loadMembers() {
  if (!fs.existsSync(MEMBERS_PATH)) fs.writeFileSync(MEMBERS_PATH, "{}");
  return JSON.parse(fs.readFileSync(MEMBERS_PATH, "utf-8"));
}

function saveMembers(data) {
  fs.writeFileSync(MEMBERS_PATH, JSON.stringify(data, null, 2));
}

function loadEmbedMessage() {
  if (!fs.existsSync(EMBED_MSG_PATH)) fs.writeFileSync(EMBED_MSG_PATH, "{}");
  return JSON.parse(fs.readFileSync(EMBED_MSG_PATH, "utf-8"));
}

function saveEmbedMessage(data) {
  fs.writeFileSync(EMBED_MSG_PATH, JSON.stringify(data, null, 2));
}

// Calcul du temps restant
function getRemainingTime(joinDateStr) {
  // Format attendu : DD/MM/YYYY HH:MM:SS
  const parts = joinDateStr.split(/[\s/:]/); // coupe sur espace, / et :
  if (parts.length < 5) return "⛔ Date invalide";

  const [day, month, year, hour, minute, second] = parts.map(Number);

  const joinDate = new Date(year, month - 1, day, hour, minute, second);

  if (isNaN(joinDate.getTime())) return "⛔ Date invalide";

  const limit = joinDate.getTime() + 3 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const diff = limit - now;

  if (diff <= 0) return "⛔ Expiré";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}h ${minutes}min`;
}

// Mise à jour automatique de l'embed
async function updatePendingEmbed(bot) {
  const channelId = "1439674722764849232";
  const channel = await bot.channels.fetch(channelId);

  const members = loadMembers();
  const embedInfo = loadEmbedMessage();

  const waiting = Object.entries(members)
    .filter(([tag, data]) => data.isDiscord === false)
    .map(([tag, data]) => ({
      tag,
      name: data.name,
      time: getRemainingTime(data.joinDate)
    }));

  const embed = new EmbedBuilder()
    .setTitle("⏳ Membres en attente de rejoindre le Discord")
    .setColor(0xf1c40f)
    .setTimestamp()
    .setDescription(
      waiting.length === 0
        ? "🎉 Aucun membre en attente !"
        : waiting
            .map(
              (p, index) =>
                `**${index + 1}.** \`${p.tag}\`\n👤 ${p.name}\n🕒 Temps restant : **${p.time}**\n`
            )
            .join("\n")
    );

  let msg;

  if (embedInfo.messageId) {
    try {
      msg = await channel.messages.fetch(embedInfo.messageId);
      await msg.edit({ embeds: [embed] });
      return;
    } catch {
      console.log("[WARN] Embed introuvable → il va être recréé.");
    }
  }

  msg = await channel.send({ embeds: [embed] });
  saveEmbedMessage({ messageId: msg.id });
}

function startPendingDiscordSystem(bot) {
  console.log("⏳ Système d'attente Discord activé");
  setInterval(() => updatePendingEmbed(bot), 30 * 1000);
}

module.exports = { startPendingDiscordSystem };