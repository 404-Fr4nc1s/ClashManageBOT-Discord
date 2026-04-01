const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { setLogChannel } = require("../../utils/logsConfig");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("setlogmessagedelete")
        .setDescription("Définit le salon où les messages supprimés seront loggés.")
        .addChannelOption(option =>
            option
                .setName("salon")
                .setDescription("Le salon pour les logs de messages supprimés")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const channel = interaction.options.getChannel("salon");
        setLogChannel("messageDelete", channel.id);

        return interaction.reply({
            content: `✅ Les logs de messages supprimés seront maintenant envoyés dans ${channel}.`,
        });
    },
};
