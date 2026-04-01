const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("deletebackup")
        .setDescription("Supprime une sauvegarde")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName("id")
                .setDescription("L'ID de la sauvegarde à supprimer")
                .setRequired(true)
        )
        .setDMPermission(false),
    category: "Administration",

    async run(interaction) {
        const id = interaction.options.getString("id");
        const guildId = interaction.guild.id;
        const filePath = path.join(__dirname, `../../backups/${guildId}/${id}.json`);

        if (!fs.existsSync(filePath))
            return interaction.reply({ content: "❌ Aucune sauvegarde trouvée avec cet ID.", ephemeral: true });

        fs.unlinkSync(filePath);
        await interaction.reply({ content: `🗑️ Sauvegarde **${id}** supprimée.`, ephemeral: true });

    }
};
