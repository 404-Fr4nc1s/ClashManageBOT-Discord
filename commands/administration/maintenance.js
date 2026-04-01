const fs = require("fs");
const path = require("path");
const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

const filePath = path.join(__dirname, "../../data/maintenance.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("maintenance")
        .setDescription("Active ou désactive le mode maintenance du bot.")
        .addStringOption(option =>
            option
                .setName("etat")
                .setDescription("Choisis d'activer ou de désactiver la maintenance.")
                .setRequired(true)
                .addChoices(
                    { name: "Activer", value: "on" },
                    { name: "Désactiver", value: "off" }
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const DEV_ROLE_ID = "1439674615675883561";
        const member = interaction.member;

        // Vérifie que le membre a le rôle dev
        if (!member.roles.cache.has(DEV_ROLE_ID)) {
            return interaction.reply({
                content: "❌ Tu n'as pas la permission d'utiliser cette commande.",
                ephemeral: true
            });
        }

        const state = interaction.options.getString("etat");
        const maintenance = { enabled: state === "on" };

        fs.writeFileSync(filePath, JSON.stringify(maintenance, null, 4));

        return interaction.reply({
            content: `⚙️ Le mode maintenance a été **${state === "on" ? "activé" : "désactivé"}**.`,
            ephemeral: true
        });
    }
};
