const { ComponentType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { loadWarns } = require("../../events/coc/warnsManager");
const coc = require("../../events/coc/cocClient");

module.exports = {
    name: "select",
    type: ComponentType.StringSelect,

    async run(interaction, action) {
        if (action === "warn_player") {
            // ✅ Déférer immédiatement en éphémère (Discord affiche automatiquement "réflexion...")
            await interaction.reply({ ephemeral: true });

            const tag = interaction.values[0];
            const warns = loadWarns()[tag];

            if (!warns || warns.warns.length === 0) {
                return interaction.editReply({
                    content: "❌ Aucun avertissement trouvé pour ce joueur."
                });
            }

            let playerName = "Nom introuvable";
            try {
                const player = await coc.getPlayer(tag);
                playerName = player.name;
            } catch {}

            const embed = new EmbedBuilder()
                .setTitle(`📒 Tableau des avertissements de ${playerName}`)
                .setColor(0xffaa00)
                .setTimestamp()
                .setDescription(`Avertissements reçus : **${warns.warns.length}**`);

            warns.warns.forEach(w => {
                const date = new Date(w.date).toLocaleDateString();
                embed.addFields({
                    name: "―",
                    value: `**Code :** \`${w.code}\`\n**Date :** ${date}\n**Raison :** ${w.raison}\n**Statut :** ${warns.statut}`
                });
            });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("warn_open")
                    .setLabel("↩ Revenir au tableau global")
                    .setStyle(ButtonStyle.Secondary)
            );

            // ✅ Éditer la réponse différée
            await interaction.editReply({ 
                embeds: [embed], 
                components: [row]
            });
        }
    }
};