const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const fs = require("fs");
const path = require("path");

const MEMBERS_PATH = path.join(__dirname, "../../data/members.json");

// Charger / sauvegarder le fichier
function loadMembers() {
    if (!fs.existsSync(MEMBERS_PATH)) fs.writeFileSync(MEMBERS_PATH, "{}");
    return JSON.parse(fs.readFileSync(MEMBERS_PATH, "utf-8"));
}

function saveMembers(data) {
    fs.writeFileSync(MEMBERS_PATH, JSON.stringify(data, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("validdiscord")
        .setDescription("Valide qu'un joueur a rejoint le Discord")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addStringOption(option =>
            option
                .setName("tag")
                .setDescription("Le tag du joueur (ex : #ABC123)")
                .setRequired(true)
        ),

    async run(interaction) {
        try {
            const tag = interaction.options.getString("tag").toUpperCase();
            const members = loadMembers();

            // Vérifier si le tag existe
            if (!members[tag]) {
                return interaction.reply({
                    content: "❌ Ce tag n'existe pas dans **members.json**.",
                    ephemeral: true
                });
            }

            // Vérifier si déjà validé
            if (members[tag].isDiscord === true) {
                return interaction.reply({
                    content: `⚠️ **${members[tag].name}** est déjà validé.`,
                    ephemeral: true
                });
            }

            // Mettre à jour
            members[tag].isDiscord = true;
            saveMembers(members);

            interaction.reply(`✅ **${members[tag].name}** est maintenant marqué comme ayant **rejoint le Discord**.`);

        } catch (err) {
            console.error(err);
            return interaction.reply({
                content: "❌ Une erreur est survenue lors de la validation du membre.",
                ephemeral: true
            });
        }
    }
};
