const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { setLogChannel } = require("../../utils/logsConfig");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("setlogautomodlink")
        .setDescription("Définit le salon où les liens supprimés par l'automod seront loggés.")
        .addChannelOption(option =>
            option
                .setName("salon")
                .setDescription("Le salon pour les logs de messages supprimés")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

        async execute(interaction) {
            const channel = interaction.options.getChannel("salon");
            setLogChannel("automodLink", channel.id);

            return interaction.reply({
                content: `✅ Les logs des liens supprimés par l'automod seront maintenant envoyés dans ${channel}.`,
            })
        }
};