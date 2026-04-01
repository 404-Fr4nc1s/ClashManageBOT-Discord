const { PermissionFlagsBits, ComponentType, StringSelectMenuBuilder, ActionRowBuilder } = require("discord.js");
const { loadWarns } = require("../../events/coc/warnsManager");
const coc = require("../../events/coc/cocClient");

module.exports = {
    name: "warn",
    type: ComponentType.Button,
    botpermissions: [
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.EmbedLinks
    ],

    async run(interaction, action) {
        if (action === "open") {
            await interaction.deferUpdate();

            const warns = loadWarns();

            // ✅ Récupération en parallèle
            const playerPromises = Object.keys(warns).map(async (tag) => {
                try {
                    const player = await coc.getPlayer(tag);
                    return {
                        label: player.name,
                        value: tag,
                        description: `Voir les avertissements de ${player.name}`
                    };
                } catch {
                    return null;
                }
            });

            const results = await Promise.all(playerPromises);
            const options = results.filter(opt => opt !== null);

            if (options.length === 0) {
                return interaction.editReply({
                    content: "❌ Aucun joueur avec avertissement trouvé.",
                    components: []
                });
            }

            const select = new StringSelectMenuBuilder()
                .setCustomId("select_warn_player")
                .setPlaceholder("Choisis un joueur")
                .addOptions(options);

            const row = new ActionRowBuilder().addComponents(select);

            await interaction.editReply({
                content: "📂 Sélectionne un joueur :",
                components: [row],
                embeds: [] // ✅ Retire l'embed précédent
            });
        }
    }
};
