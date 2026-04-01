const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { setLogChannel} = require ("../../utils/logsConfig");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("setlogbanword")
        .setDescription("Définit le salon où les banword supprimés par l'automod seront loggés.")
        .addChannelOption(option =>
            option
                .setName("salon")
                .setDescription("Le salon pour les logs de banword supprimés")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

        async execute(interaction) {
            const channel = interaction.options.getChannel("salon");
            setLogChannel("banWord", channel.id);

            return interaction.reply({
                content: `✅ Les logs des banword supprimés par l'automod seraont maintenant envoyés dans ${channel}.`,
            })
        }
}