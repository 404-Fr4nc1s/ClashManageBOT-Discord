const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("kick")
        .setDescription("Kick un membre du serveur")
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addUserOption(option =>
            option.setName("membre").setDescription("Le membre à kick").setRequired(true)
        )
        .addStringOption(option =>
            option.setName("raison").setDescription("La raison du kick").setRequired(false)
        ),
    category: "Modération",

    async run(interaction) { // Supprimé "message" car inutile
        try {
            const user = interaction.options.getUser("membre");
            const reason = interaction.options.getString("raison") || "Pas de raison fournie.";
            const member = interaction.guild.members.cache.get(user.id);

            if (!member) return interaction.reply({ content: "Ce membre n'est pas dans le serveur.", ephemeral: true });

            if (interaction.user.id === user.id) 
                return interaction.reply({ content: "Tu ne peux pas te kick toi-même !", ephemeral: true });

            if ((await interaction.guild.fetchOwner()).id === user.id) 
                return interaction.reply({ content: "Tu ne peux pas kick le propriétaire du serveur !", ephemeral: true });

            if (!member.kickable) 
                return interaction.reply({ content: "Je ne peux pas kick ce membre !", ephemeral: true });

            if (interaction.member.roles.highest.comparePositionTo(member.roles.highest) <= 0) 
                return interaction.reply({ content: "Tu ne peux pas kick ce membre !", ephemeral: true });

            // Essayer d'envoyer un message privé au membre kické
            try {
                await user.send(`Tu as été kick du serveur ${interaction.guild.name} par ${interaction.user.tag} pour la raison : \`${reason}\``);
            } catch (err) {
                console.warn(`Impossible d'envoyer un message à ${user.tag}`);
            }

            await member.kick(reason);
            await interaction.reply({ content: `${interaction.user} a kick ${user.tag} pour la raison : \`${reason}\`` });

        } catch (err) {
            console.error(err);
            return interaction.reply({ content: "Une erreur est survenue lors du kick du membre.", ephemeral: true });
        }
    }
};
