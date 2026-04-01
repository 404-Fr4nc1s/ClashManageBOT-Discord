const { ActionRowBuilder, ButtonBuilder } = require("@discordjs/builders");
const { SlashCommandBuilder, ButtonStyle, PermissionFlagsBits } = require("discord.js");

module.exports = {

    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Obtenir la latence du bot")
        .setDMPermission(true)
        .setDefaultMemberPermissions(null),
        permissions: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.UseExternalEmojis, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ViewChannel, PermissionFlagsBits.EmbedLinks],
    category: "Information",

    async run(interaction) {

        const button = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
            .setCustomId("ping")
            .setStyle(ButtonStyle.Secondary)
            .setLabel("Rafraîchir")
            .setEmoji({ name: "🔄" })
        );

        await interaction.reply({content: `Mon ping est de\`${interaction.client.ws.ping}ms\`.`, components: [button]});
    }
};