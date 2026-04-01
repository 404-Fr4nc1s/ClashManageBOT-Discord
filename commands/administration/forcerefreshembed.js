const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");

const MEMBERS_PATH = path.join(__dirname, "../../data/members.json");
const EMBED_MSG_PATH = path.join(__dirname, "../../data/embedMessage.json");

// Charger / sauvegarder les fichiers
function loadMembers() {
    if (!fs.existsSync(MEMBERS_PATH)) fs.writeFileSync(MEMBERS_PATH, "{}");
    return JSON.parse(fs.readFileSync(MEMBERS_PATH, "utf-8"));
}

function saveEmbedMessage(data) {
    fs.writeFileSync(EMBED_MSG_PATH, JSON.stringify(data, null, 2));
}

function getRemainingTime(joinDateStr) {
    const parts = joinDateStr.split(/[\s/:]/);
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

module.exports = {
    data: new SlashCommandBuilder()
        .setName("forcerefreshembed")
        .setDescription("Force la mise à jour de l'embed des membres en attente")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName("id")
                .setDescription("ID du salon où se trouve l'embed")
                .setRequired(true)
        ),

    async run(interaction) {
        try {
            const channelId = interaction.options.getString("id");
            const channel = await interaction.guild.channels.fetch(channelId);
            if (!channel) return interaction.reply({ content: "Salon introuvable !", ephemeral: true });

            const members = loadMembers();
            const waiting = Object.entries(members)
                .filter(([_, data]) => data.isDiscord === false)
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
                            .map((p, index) =>
                                `**${index + 1}.** \`${p.tag}\`\n👤 ${p.name}\n🕒 Temps restant : **${p.time}**\n`
                            )
                            .join("\n")
                );

            // Essaye de récupérer le message précédent depuis embedMessage.json
            let embedInfo = {};
            if (fs.existsSync(EMBED_MSG_PATH)) {
                try {
                    embedInfo = JSON.parse(fs.readFileSync(EMBED_MSG_PATH, "utf-8"));
                } catch {}
            }

            let msg;
            if (embedInfo.messageId) {
                try {
                    msg = await channel.messages.fetch(embedInfo.messageId);
                    await msg.edit({ embeds: [embed] });
                    return interaction.reply({ content: "✅ Embed mis à jour avec succès !", ephemeral: true });
                } catch {
                    console.log("[WARN] Message embed introuvable, un nouveau sera créé.");
                }
            }

            // Si pas trouvé, on crée un nouveau message
            msg = await channel.send({ embeds: [embed] });
            saveEmbedMessage({ messageId: msg.id });

            return interaction.reply({ content: "✅ Embed créé et mis à jour avec succès !", ephemeral: true });
        } catch (err) {
            console.error(err);
            return interaction.reply({ content: "❌ Une erreur est survenue lors de la mise à jour de l'embed.", ephemeral: true });
        }
    }
};
