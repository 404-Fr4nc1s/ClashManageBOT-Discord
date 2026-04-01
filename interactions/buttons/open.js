const { PermissionFlagsBits, ComponentType } = require("discord.js");
const Discord = require("discord.js");
const { loadWarns } = require("../../events/coc/warnsManager");
const coc = require("../../events/coc/cocClient"); // Ajuste le chemin

module.exports = {
    name: "open",
    type: ComponentType.Button,
    botpermissions: [
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.EmbedLinks
    ],
    
    async run(interaction, ...args) {
        const action = args.join("_"); // "warn_select"
        
        if (action === "warn_select") {
            const warns = loadWarns();
            const options = [];

            for (const tag in warns) {
                try {
                    const player = await coc.getPlayer(tag);
                    options.push({
                        label: player.name,
                        value: tag,
                        description: `Voir les avertissements de ${player.name}`
                    });
                } catch {
                    continue;
                }
            }

            if (options.length === 0) {
                return interaction.reply({
                    content: "❌ Aucun joueur avec avertissement trouvé.",
                    ephemeral: true
                });
            }

            const select = new Discord.StringSelectMenuBuilder()
                .setCustomId("select_warn_player")
                .setPlaceholder("Choisis un joueur")
                .addOptions(options);

            const row = new Discord.ActionRowBuilder().addComponents(select);
            
            await interaction.reply({
                content: "📂 Sélectionne un joueur :",
                components: [row],
                ephemeral: true
            });
        }
    }
};