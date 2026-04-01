const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { setLogChannel } = require("../../utils/logsConfig");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("setlogmessageupdate")
        .setDescription("Définit le salon où les messages modifié seront loggés.")
        .addChannelOption(option =>
            option
                .setName("salon")
                .setDescription("Le salon pour les logs de messages modifié")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const channel = interaction.options.getChannel("salon");
        setLogChannel("messageUpdate", channel.id);

        return interaction.reply({
            content: `✅ Les logs de messages modifié seront maintenant envoyés dans ${channel}.`,
            ephemeral: true
        });
    },
};
