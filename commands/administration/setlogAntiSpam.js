const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { setLogChannel} = require ("../../utils/logsConfig");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("setlogantispam")
        .setDescription("Définit le salon où l'antispam sera loggés.")
        .addChannelOption(option =>
            option
                .setName("salon")
                .setDescription("Le salon pour les logs l'antispam")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

        async execute(interaction) {
            const channel = interaction.options.getChannel("salon");
            setLogChannel("antiSpam", channel.id);

            return interaction.reply({
                content: `✅ Les logs de l'antispam automod sera maintenant envoyés dans ${channel}.`,
            })
        }
}