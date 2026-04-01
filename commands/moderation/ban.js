const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ban")
        .setDescription("Ban un membre du serveur")
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addUserOption(option => option.setName("membre").setDescription("Le membre à bannir du serveur").setRequired(true))
        .addStringOption(option => option.setName("raison").setDescription("La raison du bannissement").setRequired(true)),
    category: "Modération",
    
    async run(interaction) {
        try {
            const user = interaction.options.getUser("membre");
            const reason = interaction.options.getString("raison") || "Pas de raison fournie.";
            const member = interaction.guild.members.cache.get(user.id);

            if (interaction.user.id === user.id) return interaction.reply("Essaie pas de te bannir !");
            if ((await interaction.guild.fetchOwner()).id === user.id) return interaction.reply("Ne ban pas l'un des propriétaires du serveur !");
            if (member && !member.bannable) return interaction.reply("Je ne peux pas bannir ce membre !");
            if (member && interaction.member.roles.highest.comparePositionTo(member.roles.highest) <= 0) return interaction.reply("Tu ne peux pas bannir ce membre !");
            if ((await interaction.guild.bans.fetch()).get(user.id)) return interaction.reply("Ce membre est déjà ban !");

            try {
                await user.send(`Tu as été banni du serveur ${interaction.guild.name} par ${interaction.user.tag} pour la raison : \`${reason}\``);
            } catch (err) {}

            await interaction.reply(`${interaction.user} a banni ${user.tag} pour la raison : \`${reason}\``);
            await interaction.guild.bans.create(user.id, { reason: reason });
        } catch (err) {
            console.error(err); 
            return interaction.followUp("Une erreur est survenue lors du bannissement du membre !");
        }
    }
};
