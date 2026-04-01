const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const Discord = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("profilgdc")
        .setDescription("Lance un sondage pour connaître les membres prêts à combattre en GDC.")
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    category: "Modération",
    
    async run(interaction) {
        const row = new Discord.ActionRowBuilder().addComponents(
            new Discord.ButtonBuilder()
                .setCustomId("gdc_vert")
                .setLabel("Vert ✅")
                .setStyle(Discord.ButtonStyle.Success),
            new Discord.ButtonBuilder()
                .setCustomId("gdc_rouge")
                .setLabel("Rouge ❌")
                .setStyle(Discord.ButtonStyle.Danger)
        );

        const embed = new Discord.EmbedBuilder()
            .setTitle("📣 Mise à jour des profils GDC")
            .setDescription("Choisissez votre statut pour les prochaines **Guerres de Clans** :")
            .setColor("#ffb900");

        await interaction.reply({ embeds: [embed], components: [row] });
    }
};