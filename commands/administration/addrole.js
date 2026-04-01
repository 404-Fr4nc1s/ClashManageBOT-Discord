const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("addrole")
        .setDescription("Ajoute un rôle à un membre.")
        .addUserOption(option =>
            option
                .setName("player")
                .setDescription("Le membre à qui ajouter le rôle.")
                .setRequired(true)
        )
        .addRoleOption(option =>
            option
                .setName("role")
                .setDescription("Le rôle à ajouter.")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false),

    async execute(interaction) {
        const staffRoleId = "1439674624316280913"; // ID de ton rôle staff si tu veux restreindre la commande
        const logChannelId = "1439674708529250405"; // ID du salon logs si tu veux log les ajouts

        const executor = interaction.member;
        const targetUser = interaction.options.getUser("player");
        const role = interaction.options.getRole("role");

        const guildMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        const logChannel = interaction.guild.channels.cache.get(logChannelId);

        // 🔒 Vérifie permissions
        if (!executor.roles.cache.has(staffRoleId)) {
            return interaction.reply({
                content: "❌ Tu n’as pas la permission d’utiliser cette commande.",
                ephemeral: true
            });
        }

        if (!guildMember) {
            return interaction.reply({
                content: "❌ Le membre spécifié n’a pas été trouvé sur le serveur.",
                ephemeral: true
            });
        }

        // 🚫 Vérifie si le bot a la permission
        const botMember = interaction.guild.members.me;
        if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return interaction.reply({
                content: "❌ Je n’ai pas la permission d’ajouter des rôles.",
                ephemeral: true
            });
        }

        // 🔧 Vérifie la hiérarchie des rôles
        if (role.position >= botMember.roles.highest.position) {
            return interaction.reply({
                content: "⚠️ Je ne peux pas ajouter ce rôle car il est au-dessus du mien.",
                ephemeral: true
            });
        }

        try {
            // ✅ Ajout du rôle
            await guildMember.roles.add(role);

            await interaction.reply({
                content: `✅ Le rôle ${role} a bien été ajouté à <@${targetUser.id}>.`,
                ephemeral: false
            });

            // 🪶 Envoi dans les logs
            if (logChannel) {
                const embed = new EmbedBuilder()
                    .setColor("#2ecc71")
                    .setTitle("🎭 Rôle ajouté")
                    .addFields(
                        { name: "👤 Membre", value: `<@${targetUser.id}>`, inline: true },
                        { name: "🎯 Rôle ajouté", value: `${role}`, inline: true },
                        { name: "👮‍♂️ Ajouté par", value: `<@${executor.id}>`, inline: true }
                    )
                    .setTimestamp();

                await logChannel.send({ embeds: [embed] });
            }

        } catch (error) {
            console.error("❌ Erreur addrole:", error);
            return interaction.reply({
                content: "❌ Une erreur est survenue lors de l’ajout du rôle. Vérifie mes permissions.",
                ephemeral: true
            });
        }
    }
};
