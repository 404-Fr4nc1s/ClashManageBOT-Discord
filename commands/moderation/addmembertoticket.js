const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("addmembertoticket")
        .setDescription("Ajoute un membre au ticket actuel.")
        .addUserOption(option =>
            option
                .setName("membre")
                .setDescription("Le membre à ajouter au ticket.")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .setDMPermission(false),

    async run(interaction) {
        const STAFF_ROLE_ID = "1439674603030188053";
        const LOGS_CHANNEL_ID = "1439674736564109513";

        const member = interaction.member;
        const target = interaction.options.getUser("membre");
        const channel = interaction.channel;

        // Vérifie le rôle staff
        if (!member.roles.cache.has(STAFF_ROLE_ID)) {
            return interaction.reply({
                content: "❌ Tu n’as pas la permission d’ajouter un membre à ce ticket.",
                ephemeral: true
            });
        }

        // Vérifie que c’est bien un salon de ticket
        if (!channel.name.includes("・")) {
            return interaction.reply({
                content: "❌ Cette commande ne peut être utilisée que dans un salon de ticket.",
                ephemeral: true
            });
        }

        try {
            // Ajoute les permissions au membre
            await channel.permissionOverwrites.edit(target.id, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true,
                AttachFiles: true,
                EmbedLinks: true
            });

            await interaction.reply({
                content: `✅ <@${target.id}> a été ajouté au ticket.`,
                ephemeral: false
            });

            // Embed log
            const logChannel = interaction.guild.channels.cache.get(LOGS_CHANNEL_ID);
            if (logChannel) {
                const embed = new EmbedBuilder()
                    .setColor("#2ecc71")
                    .setTitle("➕ Membre ajouté au ticket")
                    .addFields(
                        { name: "👤 Ajouté par", value: `<@${member.id}>`, inline: true },
                        { name: "📂 Ticket", value: `<#${channel.id}>`, inline: true },
                        { name: "🙋‍♂️ Membre ajouté", value: `<@${target.id}>`, inline: true }
                    )
                    .setTimestamp();

                await logChannel.send({ embeds: [embed] });
            }
        } catch (error) {
            console.error("Erreur addmembertoticket:", error);
            await interaction.reply({
                content: "❌ Une erreur est survenue lors de l’ajout du membre.",
                ephemeral: true
            });
        }
    }
};
