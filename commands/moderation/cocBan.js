const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("cocban")
        .setDescription("Bannir un membre du serveur")
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addUserOption(option =>
            option.setName("membre")
                .setDescription("Le membre à bannir")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("raison")
                .setDescription("La raison du bannissement")
                .setRequired(false)
        ),
    category: "Modération",

    async run(interaction) {
        try {
            const user = interaction.options.getUser("membre");
            const member = interaction.guild.members.cache.get(user.id); // ✅ important pour vérifier les rôles
            const reason = interaction.options.getString("raison") || "Pas de raison fournie.";

            if (!user)
                return interaction.reply({ content: "❌ Membre introuvable.", ephemeral: true });

            if (interaction.user.id === user.id)
                return interaction.reply({ content: "❌ Tu ne peux pas te bannir toi-même !", ephemeral: true });

            if ((await interaction.guild.fetchOwner()).id === user.id)
                return interaction.reply({ content: "❌ Tu ne peux pas bannir le propriétaire du serveur.", ephemeral: true });

            if (member && interaction.member.roles.highest.comparePositionTo(member.roles.highest) <= 0)
                return interaction.reply({ content: "❌ Tu ne peux pas bannir ce membre (hiérarchie de rôles).", ephemeral: true });

            const banList = await interaction.guild.bans.fetch();
            if (banList.get(user.id))
                return interaction.reply({ content: "❌ Ce membre est déjà banni !", ephemeral: true });

            if (member && !member.bannable)
                return interaction.reply({ content: "❌ Je ne peux pas bannir ce membre (permissions insuffisantes).", ephemeral: true });

            // ✅ Envoi du message privé
            try {
                await user.send(`🚫 Vous avez été banni du serveur **${interaction.guild.name}** par **${interaction.user.tag}**.\nRaison : \`${reason}\``);
            } catch (err) {
                console.log("Impossible d'envoyer un message privé au membre banni.");
            }

            // ✅ Correction de la faute de frappe ici : `user.idn` → `user.id`
            await interaction.guild.bans.create(user.id, { reason });

            await interaction.reply({
                content: `✅ **${user.tag}** a été banni par **${interaction.user.tag}**.\nRaison : \`${reason}\``
            });

        } catch (err) {
            console.error(err);
            return interaction.reply({ content: "❌ Une erreur est survenue lors du bannissement.", ephemeral: true });
        }
    }
};
