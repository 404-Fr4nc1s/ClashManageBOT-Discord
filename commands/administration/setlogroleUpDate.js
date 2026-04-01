const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { setLogChannel } = require("../../utils/logsConfig");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("setlogroleupdate")
        .setDescription("Définit le salon où les mises à jour de rôles seront loggées.")
        .addChannelOption(option =>
            option
                .setName("salon")
                .setDescription("Le salon pour les logs de mises à jour de rôles")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

        async execute(interaction) {
            const channel = interaction.options.getChannel("salon");
            setLogChannel("roleUpdate", channel.id);

            return interaction.reply({
                content: `✅ Les logs des mises à jour de rôles seront maintenant envoyés dans ${channel}.`,
            });
        }
}