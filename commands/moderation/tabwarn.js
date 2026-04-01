const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { loadWarns } = require("../../events/coc/warnsManager");
const coc = require("../../events/coc/cocClient");
const { data } = require("./addwarn");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("tabwarn")
        .setDescription("Affiche tous les avertissements du clan.")
        .setDMPermission(false),
    category: "Modération",
    

    async run(interaction) {
        const warns = loadWarns();

        const embed = new EmbedBuilder()
            .setTitle("📁 Tableau des avertissements")
            .setColor(0xff0000)
            .setTimestamp();
        if (Object.keys(warns).length === 0) {
            embed.setDescription("Aucun avertissement enregistré.");
            return interaction.reply({ embeds: [embed] });
        }

        for (const tag in warns) {
            const joueur = warns[tag];
            let nom; 
            try {
                const date = await coc.getPlayer(tag);
                nom = date.name || "Inconnu";
            } catch {
                nom = "Inconnu";
            }

            embed.addFields({
                name: `────────────────────────────────────`,
                value: `**${nom}**\nTag du joueur : \`${tag}\`\nStatut : ${joueur.statut} → ${joueur.warns.length} avertissement(s)`
            })
        }
        
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("open_warn_select")
                .setLabel("🔍 Voir les détails par joueur")
                .setStyle(ButtonStyle.Primary)
        )
        await interaction.reply({ embeds: [embed], components: [row] });
    }
}