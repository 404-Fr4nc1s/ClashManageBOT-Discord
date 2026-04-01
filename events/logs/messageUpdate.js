const { Events, EmbedBuilder } = require("discord.js");
const { getLogChannel } = require("../../utils/logsConfig");
const fs = require("fs");
const path = require("path");

const dataFilePath = path.join(__dirname, "../../data/log/messageUpdate.json");

// Fonction robuste pour lire les données JSON
function readData() {
    try {
        if (!fs.existsSync(dataFilePath)) return [];
        const rawData = fs.readFileSync(dataFilePath, "utf-8").trim();

        if (!rawData) return []; // fichier vide => retourne tableau vide

        return JSON.parse(rawData);
    } catch (err) {
        console.error("Erreur en lisant le fichier de données :", err);
        return []; // JSON corrompu => retourne tableau vide
    }
}

// Fonction pour écrire dans le fichier JSON
function writeData(data) {
    try {
        fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 4), "utf-8");
    } catch (err) {
        console.error("Erreur en écrivant le fichier de données :", err);
    }
}

module.exports = {
    name: Events.MessageUpdate,
    once: false,

    async run(client, oldMessage, newMessage) {
        if (!oldMessage.author || oldMessage.author.bot) return;
        try {
            const embed = new EmbedBuilder()
                .setTitle("✏️ Message Modifié")
                .setDescription(`Un message a été modifié dans <#${oldMessage.channel.id}>`)
                .addFields(
                    { name: "Auteur", value: oldMessage.author.tag, inline: true },
                    { name: "Date", value: new Date().toLocaleString(), inline: true },
                    { name: "Ancien Contenu", value: oldMessage.content || "Aucun contenu", inline: false },
                    { name: "Nouveau Contenu", value: newMessage.content || "Aucun contenu", inline: false }
                )
                .setColor("#FFA500")
                .setThumbnail(oldMessage.author.displayAvatarURL())
                .setFooter({ text: `Message ID: ${oldMessage.id}` })
                .setTimestamp();

            // Envoi dans le canal de logs
            const logChannelID = getLogChannel("messageUpdate");
            if (!logChannelID) return; // pas configuré

            const logChannel = await client.channels.fetch(logChannelID).catch(() => null);
            if (logChannel) logChannel.send({ embeds: [embed] });

            // Stockage dans le fichier JSON
            const currentData = readData();
            currentData.push({
                messageId: oldMessage.id,
                authorId: oldMessage.author.id,
                authorTag: oldMessage.author.tag,
                channelId: oldMessage.channel.id,
                oldContent: oldMessage.content || null,
                newContent: newMessage.content || null,
                timestamp: new Date().toISOString()
            });
            writeData(currentData);
        } catch (err) {
            console.error("Erreur dans le gestionnaire de MessageUpdate :", error);
        }
    }
};
