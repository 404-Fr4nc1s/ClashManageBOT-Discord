const { Events, EmbedBuilder } = require("discord.js");
const { getLogChannel } = require("../../utils/logsConfig");
const fs = require("fs");
const path = require("path");

const dataFilePath = path.join(__dirname, "../../data/log/messageDelete.json");

function readData() {
    if (!fs.existsSync(dataFilePath)) return [];
    return JSON.parse(fs.readFileSync(dataFilePath, "utf-8"));
}

function writeData(data) {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 4), "utf-8");
}

module.exports = {
    name: Events.MessageDelete,
    once: false,
    async run(client, message) {
        if (!message.author || message.author.bot || message.deletedByAntilink) return;

        message.deletedTimestamp = Date.now();
        client.snipe.set(message.channel.id, message);

        let executor = "Inconnu";

        try {
            await new Promise(r => setTimeout(r, 1000)); // délai pour l’audit log

            const fetchedLogs = await message.guild.fetchAuditLogs({ limit: 1, type: 72 });
            const deletionLog = fetchedLogs.entries.first();

            if (deletionLog) {
                const { executor: logExecutor, target, createdTimestamp } = deletionLog;
                const timeDiff = Date.now() - createdTimestamp;
                if (target.id === message.author.id && timeDiff < 3000)
                    executor = logExecutor?.tag || message.author.tag;
                else executor = message.author.tag;
            }

            const embed = new EmbedBuilder()
                .setTitle("🗑️ Message Supprimé")
                .setDescription(`Un message a été supprimé dans <#${message.channel.id}>`)
                .addFields(
                    { name: "Auteur :", value: message.author?.tag || "Inconnu", inline: true },
                    { name: "Supprimé par :", value: executor, inline: true },
                    { name: "Date :", value: new Date(message.deletedTimestamp).toLocaleString(), inline: true },
                    { name: "Contenu :", value: message.content || "Aucun contenu", inline: false }
                )
                .setColor("#FF0000")
                .setThumbnail(message.author?.displayAvatarURL())
                .setFooter({ text: `Message ID: ${message.id}` })
                .setTimestamp();

            // 🧠 Récupération du salon depuis logsConfig.json
            const logChannelId = getLogChannel("messageDelete");
            if (!logChannelId) return; // pas configuré

            const logChannel = await client.channels.fetch(logChannelId).catch(() => null);
            if (logChannel) await logChannel.send({ embeds: [embed] });

            const data = readData();
            data.push({
                messageId: message.id,
                authorId: message.author.id,
                authorTag: message.author.tag,
                channelId: message.channel.id,
                content: message.content || null,
                deletedBy: executor,
                timestamp: new Date(message.deletedTimestamp).toISOString()
            });
            writeData(data);
        } catch (err) {
            console.error("Erreur lors du log MessageDelete :", err);
        }
    }
};
