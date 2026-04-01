const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const Discord = require("discord.js");
const coc = require("../../events/coc/cocClient")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("claninfo")
        .setDescription("Affiche les informations d’un clan Clash of Clans.")
        .setDMPermission(false)
        .setDefaultMemberPermissions(null)
        .addStringOption(option => option.setName("tag").setDescription("Tag du clan (ex: #8QU8J9LP)").setRequired(true)),
    category: "Information",
    
    async run(interaction) {
        const tag = interaction.options.getString("tag").toUpperCase();

        try {
            const clan = await coc.getClan(tag);

            if (!clan) {
                return interaction.reply("❌ Clan introuvable. Veuillez vérifier le tag et réessayer.");
            }

           const embed = new Discord.EmbedBuilder()
                .setTitle(`🏰 ${clan.name || "Nom inconnu"}`)
                .setDescription(clan.description || "*Aucune description*")
                .setColor("#00ff00")
                .addFields(
                    { name: "🏷️ Tag", value: clan.tag || "N/A", inline: true },
                    { name: "🎖️ Niveau", value: clan.level?.toString() || "N/A", inline: true },
                    { name: "👥 Membres", value: `${clan.memberCount || 0}/50`, inline: true },
                    { name: "🏆 Trophées", value: clan.points?.toString() || "N/A", inline: true },
                    { name: "⚔️ Ligue GDC", value: clan.warLeague?.name || "Non classé", inline: true },
                    { name: "📍 Région", value: clan.location?.name || "Inconnue", inline: true }
                )
                .setThumbnail(clan.badgeUrls?.medium || null)
                .setFooter({ text: "Données récupérées via l’API Clash of Clans" });

            await interaction.reply({ embeds: [embed] });
                

        } catch (err) {
            console.error(err);
            await interaction.reply("❌ Une erreur est survenue lors de la récupération des informations du clan. Assure-toi que le tag est correct (ex: `#8QU8J9LP`).");
        }
    }
};
