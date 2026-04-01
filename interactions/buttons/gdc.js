const { PermissionFlagsBits, ComponentType } = require("discord.js");

module.exports = {
    name: "gdc",
    type: ComponentType.Button,
    botpermissions: [
        PermissionFlagsBits.SendMessages, 
        PermissionFlagsBits.UseExternalEmojis, 
        PermissionFlagsBits.ReadMessageHistory, 
        PermissionFlagsBits.ViewChannel, 
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.ManageRoles
    ],
    
    async run(interaction, color) {
        const roleVertID = "1439674611280117824";
        const roleRougeID = "1439674608235057173";
        
        const roleVert = interaction.guild.roles.cache.get(roleVertID);
        const roleRouge = interaction.guild.roles.cache.get(roleRougeID);
        const member = interaction.member;
        
        if (!roleVert || !roleRouge) {
            return interaction.reply({ 
                content: "❌ Un ou plusieurs rôles n'ont pas été trouvés.", 
                ephemeral: true 
            });
        }
        
        try {
            if (color === "vert") {
                if (member.roles.cache.has(roleVertID)) {
                    await member.roles.remove(roleVert);
                    return interaction.reply({ 
                        content: `${interaction.user.tag} a quitté l'équipe Verte ❌`, 
                        ephemeral: true 
                    });
                }
                
                await member.roles.remove(roleRouge);
                await member.roles.add(roleVert);
                return interaction.reply({ 
                    content: `${interaction.user.tag} a rejoint l'équipe Verte ✅`, 
                    ephemeral: true 
                });
                
            } else if (color === "rouge") {
                if (member.roles.cache.has(roleRougeID)) {
                    await member.roles.remove(roleRouge);
                    return interaction.reply({ 
                        content: `${interaction.user.tag} a quitté l'équipe Rouge ❌`, 
                        ephemeral: true 
                    });
                }
                
                await member.roles.remove(roleVert);
                await member.roles.add(roleRouge);
                return interaction.reply({ 
                    content: `${interaction.user.tag} a rejoint l'équipe Rouge ✅`, 
                    ephemeral: true 
                });
            }
        } catch (error) {
            console.error(error);
            await interaction.reply({ 
                content: "❌ Une erreur est survenue lors de la gestion du rôle.", 
                ephemeral: true 
            });
        }
    }
};