const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const Discord = require("discord.js")
const ms = require("ms");
const { data } = require("./cocBan");

module.exports = {

    data: new SlashCommandBuilder()
        .setName("clear")
        .setDescription("Supprime une masse de message dans un salon")
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addNumberOption(option =>
            option.setName("nombre").setDescription("Le nombre de messages à supprimer").setRequired(true)
        )
        .addChannelOption(option =>
            option.setName("salon").setDescription("Le salon où le clear s'effectuera").setRequired(false)
        ),
    category: "Modération",

    async run(interaction) {

        let channel = interaction.options.getChannel("salon") || interaction.channel;
        if(channel.id !== interaction.channel.id && !interaction.guild.channels.cache.get(channel.id)) {
            return interaction.reply("❌ Je ne retrouve pas ce salon !");
        }

        let number = interaction.options.getNumber("nombre");
        if(parseInt(number) <= 0 || parseInt(number) > 100) {
            return interaction.reply("❌ Il nous faut un nombre entre `0` et `100` inclus !");
        }

        try {
            let messages = await channel.bulkDelete(parseInt(number));
            await interaction.reply({ content: `J'ai bien supprimé \`${messages.size}\` message(s) dans le salon ${channel} !`, ephemeral: true });
        } catch (err) {
            let messages = [...(await channel.messages.fetch()).values()].filter(async m => m.createdAt <= 1209600000);
            if(messages.length <= 0) {
                return interaction.reply("Aucun message à supprimer car ils datent tous de plus de 14 jours !");
            }
            await channel.bulkDelete(messages);
            await interaction.reply({ content: `J'ai pu supprimer uniquement \`${messages.size}\` message(s) dans le salon ${channel} car les autres dataient de plus de 14 jours !`, ephemeral: true });
        }
    }
};