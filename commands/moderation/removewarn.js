const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { removeWarn } = require("../../events/coc/warnsManager");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("removewarn")
        .setDescription("Supprime un avertissement via son code")
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addStringOption(option =>
            option
                .setName("code")
                .setDescription("Code unique de l'avertissement")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("statut")
                .setDescription("Statut du joueur")
                .setRequired(true)
                .addChoices(
                    { name: "Dans le clan", value: "Dans le clan" },
                    { name: "Banni du clan", value: "Banni du clan" }
                )
        ),
    category: "Modération",

    async run(interaction) {
        const code = interaction.options.getString("code");
        const statut = interaction.options.getString("statut");

        const success = removeWarn(code, statut);
        if (success) {
            await interaction.reply(`✅ Avertissement avec le code \`${code}\` supprimé.`);
        } else {
            await interaction.reply(`❌ Aucun avertissement trouvé avec le code \`${code}\`.`);
        }
    }
};
