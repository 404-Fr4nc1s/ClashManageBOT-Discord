const { EmbedBuilder } = require("discord.js");
const { getLogChannel } = require ("../../utils/logsConfig") 

module.exports = {
    name: "messageCreate",
    once: false,
    async run(client, message) {
        if (message.author.bot) return;

        const fs = require("fs");
        const path = require("path");

        // ---- CONFIG LOGS ----
        const LOG_BANWORD_CHANNEL_ID = getLogChannel("banWord")
        if(!LOG_BANWORD_CHANNEL_ID) return;
        const LOG_SPAM_CHANNEL_ID = getLogChannel("antiSpam")
        if(!LOG_SPAM_CHANNEL_ID) return;

        const logBanword = await client.channels.fetch(LOG_BANWORD_CHANNEL_ID).catch(() => null);
        const logSpam = await client.channels.fetch(LOG_SPAM_CHANNEL_ID).catch(() => null);

        // ---- FILTRE MOTS INTERDITS ----
        const filePath = path.join(__dirname, "../../data/banwords.json");
        const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
        const content = message.content.toLowerCase();

        for (const word of data.words) {
            if (content.includes(word)) {

                await message.delete().catch(() => {});
                await message.channel.send({
                    content: `🚫 ${message.author}, ton message contenait un mot interdit.`,
                });

                // ---- LOG MOT INTERDIT ----
                if (logBanword) {
                    const embed = new EmbedBuilder()
                        .setTitle("🚫 Mot interdit détecté")
                        .setColor("#ff0000")
                        .addFields(
                            { name: "Auteur", value: `${message.author} (${message.author.id})` },
                            { name: "Salon", value: `${message.channel}` },
                            { name: "Mot détecté", value: word },
                            { name: "Message supprimé", value: message.content || "*Aucun contenu*" }
                        )
                        .setTimestamp();

                    if (logBanword) await logBanword.send({ embeds: [embed] });
                }

                return;
            }
        }

        // ---- ANTI-SPAM ----

        if (!client.msgTracker) client.msgTracker = new Map();

        const LIMIT = 5;
        const TIME_WINDOW = 7000;

        const userId = message.author.id;
        const now = Date.now();

        if (!client.msgTracker.has(userId)) {
            client.msgTracker.set(userId, []);
        }

        const timestamps = client.msgTracker.get(userId);

        timestamps.push(now);

        const filtered = timestamps.filter(ts => now - ts < TIME_WINDOW);
        client.msgTracker.set(userId, filtered);

        if (filtered.length >= LIMIT) {
            await message.delete().catch(() => {});
            await message.channel.send({
                content: `⚠️ ${message.author}, merci de ne pas spammer.`,
            });

            // ---- LOG SPAM ----
            if (logSpam) {
                const embed = new EmbedBuilder()
                    .setTitle("⚠️ Anti-Spam : Message supprimé")
                    .setColor("#ffcc00")
                    .addFields(
                        { name: "Auteur", value: `${message.author} (${message.author.id})` },
                        { name: "Salon", value: `${message.channel}` },
                        { name: "Message supprimé", value: message.content || "*Aucun contenu*" },
                        { name: "Raison", value: `Spam : ${filtered.length} messages / ${TIME_WINDOW / 1000}s` }
                    )
                    .setTimestamp();

                if (logSpam) await logSpam.send({ embeds: [embed] });
            }

            client.msgTracker.set(userId, []);
            return;
        }

        message.deletedByAntispam = true;
    },
};
