const fs = require("fs");
const path = require("path");
const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

const filePath = path.join(__dirname, "../../data/banwords.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("removebanword")
        .setDescription("Supprime un mot de la liste des mots interdits.")
        .addStringOption(option =>
            option
                .setName("mot")
                .setDescription("Le mot à supprimer")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const word = interaction.options.getString("mot").toLowerCase();
        const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

        if (!data.words.includes(word)) {
            return interaction.reply({ content: `❌ Le mot \`${word}\` n'est pas dans la liste.`, ephemeral: true });
        }

        data.words = data.words.filter(w => w !== word);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 4));

        return interaction.reply({ content: `✅ Le mot \`${word}\` a été supprimé de la liste.`, ephemeral: true });
    },
};
