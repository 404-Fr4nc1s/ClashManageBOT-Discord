const Discord = require("discord.js");
const cron = require("node-cron");

function startProfileReminder(bot, channelId) {
    cron.schedule("15 18 */2 * *", async () => {
        try {
            const channel = await bot.channels.fetch(channelId);
            if (!channel) {
                console.error(`[ProfileReminder] Salon introuvable : ${channelId}`);
                return;
            }

            // Création de l'embed
            const embed = new Discord.EmbedBuilder()
                .setTitle("📢 Mise à jour de votre profil GDC/LDC")
                .setDescription("Il est temps de mettre à jour votre participation pour la prochaine GDC/LDC.\n\nChoisissez ci-dessous :")
                .setColor(0xffb900)
                .setFooter({ text: "Merci de répondre rapidement !" })
                .setTimestamp();

            // Boutons Vert / Rouge
            const row = new Discord.ActionRowBuilder().addComponents(
                new Discord.ButtonBuilder()
                    .setCustomId("gdc_vert")
                    .setLabel("✅ Participer")
                    .setStyle(Discord.ButtonStyle.Success),
                new Discord.ButtonBuilder()
                    .setCustomId("gdc_rouge")
                    .setLabel("❌ Ne pas participer")
                    .setStyle(Discord.ButtonStyle.Danger)
            );

            await channel.send({ embeds: [embed], components: [row] });
            console.log("[ProfileReminder] Message envoyé avec succès !");
        } catch (err) {
            console.error("[ProfileReminder] Erreur :", err);
        }
    }, {
        timezone: "Europe/Paris"
    });
}

module.exports = { startProfileReminder };
