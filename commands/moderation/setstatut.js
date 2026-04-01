const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { toggleStatut } = require("../../events/coc/warnsManager");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("setstatut")
        .setDescription("Alterner le statut d’un joueur (Dans le clan / Banni du clan).")
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addStringOption(option =>
            option
                .setName("tag")
                .setDescription("Tag du joueur")
                .setRequired(true)
        ),
    category: "Modération",

    async run(interaction) {
        try {
            const tag = interaction.options.getString("tag").toUpperCase();
            const newStatut = toggleStatut(tag);

            if (!newStatut) {
                return await interaction.reply(`❌ Aucun joueur trouvé avec le tag \`${tag}\`.`);
            }

            await interaction.reply(`🔁 Statut du joueur \`${tag}\` mis à jour : **${newStatut}**`);
        } catch (err) {
            console.error(err);
            await interaction.reply("❌ Une erreur est survenue lors de la mise à jour du statut.");
        }
    }
};
