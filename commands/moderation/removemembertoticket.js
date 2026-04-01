const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("removemembertoticket")
        .setDescription("Retire un membre du ticket actuel.")
        .addUserOption(option =>
            option
                .setName("membre")
                .setDescription("Le membre à retirer du ticket.")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .setDMPermission(false),

    async execute(interaction) {
        const STAFF_ROLE_ID = "1439674603030188053";
        const LOGS_CHANNEL_ID = "1439674736564109513";

        const member = interaction.member;
        const target = interaction.options.getUser("membre");
        const guildMember = await interaction.guild.members.fetch(target.id).catch(() => null);
        const channel = interaction.channel;

        // Vérifie le rôle staff
        if (!member.roles.cache.has(STAFF_ROLE_ID)) {
            return interaction.reply({
                content: "❌ Tu n’as pas la permission de retirer un membre de ce ticket.",
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

        // Vérifie que le membre à retirer est bien dans le ticket
        const permissions = channel.permissionOverwrites.cache.get(target.id);
        if (!permissions) {
            return interaction.reply({
                content: "⚠️ Ce membre n’a pas accès à ce ticket.",
                ephemeral: true
            });
        }

        try {
            // Supprime les permissions du membre
            await channel.permissionOverwrites.edit(target.id, {
                ViewChannel: false,
                SendMessages: false,
                ReadMessageHistory: false,
                AttachFiles: false,
                EmbedLinks: false
            });

            await interaction.reply({
                content: `✅ <@${target.id}> a été retiré du ticket.`,
                ephemeral: false
            });

            // Embed log
            const logChannel = interaction.guild.channels.cache.get(LOGS_CHANNEL_ID);
            if (logChannel) {
                const embed = new EmbedBuilder()
                    .setColor("#e74c3c")
                    .setTitle("➖ Membre retiré du ticket")
                    .addFields(
                        { name: "👤 Retiré par", value: `<@${member.id}>`, inline: true },
                        { name: "📂 Ticket", value: `<#${channel.id}>`, inline: true },
                        { name: "🙅‍♂️ Membre retiré", value: `<@${target.id}>`, inline: true }
                    )
                    .setTimestamp();

                await logChannel.send({ embeds: [embed] });
            }
        } catch (error) {
            console.error("Erreur removemembertoticket:", error);
            if (!interaction.replied) {
                await interaction.reply({
                    content: "❌ Une erreur est survenue lors du retrait du membre.",
                    ephemeral: true
                });
            }
        }
    }
};
