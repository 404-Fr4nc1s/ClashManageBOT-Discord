const { PermissionFlagsBits, ComponentType } = require("discord.js");
const Discord = require("discord.js");
const { loadWarns } = require("../../events/coc/warnsManager");
const coc = require("../../events/coc/cocClient"); // Ajuste le chemin

module.exports = {
    name: "back",
    type: ComponentType.Button,
    botpermissions: [
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.EmbedLinks
    ],
    
    async run(interaction, ...args) {
        const action = args.join("_"); // "to_global_warn"
        
        if (action === "to_global_warn") {
            const warns = loadWarns();
            const embed = new Discord.EmbedBuilder()
                .setTitle("📒 Tableau des avertissements")
                .setColor(0xffcc00)
                .setTimestamp();
                
            if (Object.keys(warns).length === 0) {
                embed.setDescription("Aucun avertissement enregistré.");
            } else {
                for (const tag in warns) {
                    const joueur = warns[tag];
                    let nom;
                    try {
                        const data = await coc.getPlayer(tag);
                        nom = data.name || "Inconnu";
                    } catch {
                        nom = "Nom introuvable";
                    }
                    embed.addFields({
                        name: `────────────────────────────────────`,
                        value: `**${nom}**\nTag du joueur : \`${tag}\`\nStatut : ${joueur.statut} → ${joueur.warns.length} avertissement(s)`
                    });
                }
            }
            
            const row = new Discord.ActionRowBuilder().addComponents(
                new Discord.ButtonBuilder()
                    .setCustomId("open_warn_select")
                    .setLabel("🔍 Voir détails par joueur")
                    .setStyle(Discord.ButtonStyle.Primary)
            );
            
            await interaction.update({ embeds: [embed], components: [row] });
        }
    }
};