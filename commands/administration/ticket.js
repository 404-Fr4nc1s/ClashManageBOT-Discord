const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const Discord = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ticket")
        .setDescription("Envoie l'embed des tickets.")
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
        category: "Administration",

    async run(interaction) {
        try {
            const channel = interaction.channel;
            let Embed = new Discord.EmbedBuilder()
                .setColor("#0099ff")
                .setTitle("Support - Tickets")
                .setDescription("Pour ouvrir un ticket, cliquez sur le bouton ci-dessous.")
                .setFooter({
                    text: interaction.client.user.username,
                    iconURL: interaction.client.user.displayAvatarURL({ dynamic: true })
                });

            if (interaction.guild.iconURL()) {
                Embed.setThumbnail(interaction.guild.iconURL());
            }

            const btn = new Discord.ActionRowBuilder()
                .addComponents(
                    new Discord.ButtonBuilder()
                        .setCustomId("createTicket")
                        .setLabel("Ouvrir un ticket")
                        .setStyle(Discord.ButtonStyle.Primary)
                        .setEmoji("📩")
                );
           await channel.send({ embeds: [Embed], components: [btn] })
        } catch (err) {
            console.error(err);
            await channel.send("❌ Une erreur est survenue lors de l'exécution de la commande.");
        }
    }
}