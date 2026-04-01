const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { addWarn } = require("../../events/coc/warnsManager");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("addwarn")
        .setDescription("Ajoute un avertissement à un membre du clan.")
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addStringOption(option =>
            option
                .setName("tag")
                .setDescription("Tag du joueur")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("raison")
                .setDescription("La raison de l'avertissement")
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
        try {
            const tag = interaction.options.getString("tag").toUpperCase();
            const raison = interaction.options.getString("raison");
            const statut = interaction.options.getString("statut");

            const code = addWarn(tag, raison, statut);

            await interaction.reply(
                `✅ Avertissement ajouté à **${tag}** pour *${raison}*.\nStatut : \`${statut}\`\nCode : \`${code}\``
            );
        } catch (err) {
            console.error(err);
            await interaction.reply("❌ Une erreur est survenue lors de l'ajout de l'avertissement.");
        }
    }
};
