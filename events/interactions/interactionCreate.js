const {
    Events,
    InteractionType,
    PermissionFlagsBits,
    PermissionsBitField
} = require("discord.js");
const fs = require("fs");
const path = require("path");

const maintenancePath = path.join(__dirname, "../../data/maintenance.json");

module.exports = {
    name: Events.InteractionCreate,
    once: false,
    async run(client, interaction) {

        // ======== MODE MAINTENANCE GLOBAL ========
        const DEV_ROLE_ID = "1439674615675883561";
        const data = JSON.parse(fs.readFileSync(maintenancePath, "utf8"));
        const isMaintenance = data.enabled;

        const isDev =
            interaction.guild &&
            interaction.member &&
            interaction.member.roles.cache.has(DEV_ROLE_ID);

        if (isMaintenance && !isDev) {
            if (interaction.isRepliable()) {
                try {
                    await interaction.reply({
                        content: "**⚙️ - EN MAINTENANCE**\nLe bot est actuellement en maintenance. Réessayez plus tard.",
                        ephemeral: true
                    });
                } catch {
                    // Ignorer les erreurs
                }
            }
            return;
        }
        // =========================================

        switch (interaction.type) {
            case InteractionType.ApplicationCommand: {
                const command = client.commands.get(interaction.commandName);
                if (!command) return;

                if (!interaction.guild) {
                    if (command.data.dm_permission === false) {
                        return interaction.reply({
                            content: "❌ Cette commande ne peut être utilisée qu'en serveur.",
                            ephemeral: true
                        });
                    }

                    if (typeof command.run === "function") {
                        await command.run(interaction);
                    } else if (typeof command.execute === "function") {
                        await command.execute(interaction);
                    }
                    return;
                }

                const missingPermissions = command.permissions
                    ? command.permissions
                          .flatMap(p => new PermissionsBitField(p).toArray())
                          .filter(p => !interaction.guild.members.me.permissions.toArray().includes(p))
                    : [];

                if (
                    !(await interaction.guild.members.fetchMe()).permissions.has(PermissionFlagsBits.Administrator) &&
                    missingPermissions.length > 0
                ) {
                    return interaction.reply({
                        content: `❌ Je n'ai pas ${missingPermissions.length > 1 ? "les" : "la"} permission${
                            missingPermissions.length > 1 ? "s" : ""
                        } requise${missingPermissions.length > 1 ? "s" : ""} ${missingPermissions
                            .map(p => `\`${new PermissionsBitField(p).toArray()}\``)
                            .join(" ")} pour exécuter cette commande.`,
                        ephemeral: true
                    });
                }

                if (typeof command.run === "function") {
                    await command.run(interaction);
                } else if (typeof command.execute === "function") {
                    await command.execute(interaction);
                } else {
                    console.error(`❌ La commande ${interaction.commandName} n'a ni run ni execute.`);
                }
                break;
            }

            case InteractionType.MessageComponent: {
                const args = interaction.customId.split("_");
                const name = args.shift();

                const component = client.interactions.find(
                    i => i.name === name && i.type === interaction.componentType
                );

                if (!component) return;

                if (!interaction.guild) {
                    return interaction.reply({
                        content: "❌ Ce composant ne peut être utilisé qu'en serveur.",
                        ephemeral: true
                    });
                }

                if (component.permission && !interaction.member.permissions.has(component.permission)) {
                    return interaction.reply({
                        content: `❌ Vous n'avez pas la permission requise \`${new PermissionsBitField(component.permission).toArray()}\` pour exécuter ce composant.`,
                        ephemeral: true
                    });
                }

                const missingPermissions = component.botpermissions
                    ? component.botpermissions
                          .flatMap(p => new PermissionsBitField(p).toArray())
                          .filter(p => !interaction.guild.members.me.permissions.toArray().includes(p))
                    : [];

                if (
                    !(await interaction.guild.members.fetchMe()).permissions.has(PermissionFlagsBits.Administrator) &&
                    missingPermissions.length > 0
                ) {
                    return interaction.reply({
                        content: `❌ Je n'ai pas ${missingPermissions.length > 1 ? "les" : "la"} permission${
                            missingPermissions.length > 1 ? "s" : ""
                        } requise${missingPermissions.length > 1 ? "s" : ""} ${missingPermissions
                            .map(p => `\`${new PermissionsBitField(p).toArray()}\``)
                            .join(" ")} pour exécuter ce composant.`,
                        ephemeral: true
                    });
                }

                await component.run(interaction, ...args);
                break;
            }

            case InteractionType.ApplicationCommandAutocomplete: {
                const autocomplete = client.interactions.find(
                    i => i.name === interaction.commandName && i.type === interaction.type
                );
                if (!autocomplete) return;
                await autocomplete.run(interaction);
                break;
            }
        }
    }
};
