const { Events, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const { getLogChannel } = require("../../utils/logsConfig");

const dataFilePath = path.join(__dirname, "../../data/log/antilinkData.json");

// Fonction pour lire le fichier JSON
function readData() {
    try {
        if (!fs.existsSync(dataFilePath)) return [];
        const rawData = fs.readFileSync(dataFilePath, "utf-8");
        return JSON.parse(rawData);
    } catch (err) {
        console.error("Erreur en lisant le fichier de données :", err);
        return [];
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
    name: Events.MessageCreate,
    once: false,
    async run(client, message) {
        if (
            !message.guild ||
            message.author.bot ||
            !message.member ||
            message.member.roles.cache.has("1439674603030188053") ||
            message.content.includes("https://link.clashofclans.com")
        ) return;

        if (
            message.content.includes("https://") ||
            message.content.includes("discord.gg/") ||
            message.content.includes("http://") ||
            message.content.includes("www.")
        ) {
            const messageContent = message.content;
            const authorTag = message.author.tag;
            const authorId = message.author.id;
            const channelId = message.channel.id;
            const messageId = message.id;
            const timestamp = new Date().toISOString();

            message.delete().then(async () => {
                message.channel.send({ content: `${message.author}, tu n'as pas le droit d'envoyer de lien sur le serveur !` });

                // Création de l'embed
                const embed = new EmbedBuilder()
                    .setTitle("️Lien Supprimé")
                    .setDescription(`Un lien a été supprimé dans <#${channelId}>`)
                    .addFields(
                        { name: "Auteur", value: authorTag, inline: true },
                        { name: "Date", value: new Date().toLocaleString(), inline: true },
                        { name: "Contenu", value: messageContent || "Aucun contenu", inline: false }
                    )
                    .setColor("#00fff1")
                    .setThumbnail(message.author.displayAvatarURL())
                    .setFooter({ text: `Message ID: ${messageId}` })
                    .setTimestamp();

                const logChannelId = getLogChannel("automodLink");
                if(!logChannelId) return;

                // Envoi dans le canal de logs
                const logChannel = await client.channels.fetch(logChannelId).catch(() => null);
                if (logChannel) await logChannel.send({ embeds: [embed] });

                // Stockage dans le fichier JSON
                const currentData = readData();
                currentData.push({
                    messageId,
                    authorId,
                    authorTag,
                    channelId,
                    content: messageContent,
                    timestamp
                });
                writeData(currentData);

                // Timeout de l'utilisateur
                try {
                    await message.member.timeout(5 * 60 * 1000, "Envoi de liens interdits");
                    console.log(`L'utilisateur ${authorTag} a été mis en timeout pendant 5 minutes.`);
                } catch (error) {
                    console.error('Erreur lors de la mise en timeout de l\'utilisateur:', error);
                }
            });

            message.deletedByAntilink = true;
        }
    }
};
