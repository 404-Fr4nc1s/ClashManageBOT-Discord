const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("backup")
        .setDescription("Crée une sauvegarde complète du serveur")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false)
        .addStringOption(option =>
            option
                .setName("nom")
                .setDescription("Nom de la sauvegarde (ex: backup_octobre)")
                .setRequired(true)
        ),
    category: "Administration",

    async run(interaction) {
        const name = interaction.options.getString("nom").replace(/[^a-zA-Z0-9_-]/g, "_"); 
        const guild = interaction.guild;

        await interaction.deferReply({ ephemeral: true });

        try {
            const timestamp = Date.now();
            const backupId = `${timestamp}`;
            const backupData = {
                id: backupId,
                name,
                guildId: guild.id,
                guildName: guild.name,
                authorId: interaction.user.id,
                authorTag: interaction.user.tag,
                date: Date.now(),
                roles: [],
                channels: [],
                emojis: [],
                members: [] // <-- nouvelle section pour membres et leurs rôles
            };

            // --- Sauvegarde des rôles ---
            guild.roles.cache
                .filter(role => !role.managed && role.id !== guild.id && role.id !== guild.members.me.roles.highest.id)
                .sort((a, b) => a.position - b.position)
                .forEach(role => {
                    backupData.roles.push({
                        name: role.name,
                        color: role.color,
                        hoist: role.hoist,
                        permissions: role.permissions.bitfield.toString(),
                        mentionable: role.mentionable,
                        position: role.position
                    });
                });

            // --- Sauvegarde des salons ---
            guild.channels.cache.forEach(channel => {
                backupData.channels.push({
                    name: channel.name,
                    type: channel.type,
                    parent: channel.parent ? channel.parent.name : null,
                    position: channel.position,
                    topic: channel.topic || null,
                    nsfw: channel.nsfw || false,
                    rateLimitPerUser: channel.rateLimitPerUser || 0
                });
            });

            // --- Sauvegarde des émojis ---
            guild.emojis.cache.forEach(emoji => {
                backupData.emojis.push({
                    name: emoji.name,
                    url: emoji.url
                });
            });

            // --- Sauvegarde des membres et leurs rôles ---
            guild.members.cache.forEach(member => {
                if (member.user.bot) return; // on peut ignorer les bots si tu veux
                backupData.members.push({
                    id: member.id,
                    username: member.user.tag,
                    roles: member.roles.cache.filter(r => !r.managed && r.id !== guild.id).map(r => r.name) // on sauvegarde le nom des rôles
                });
            });

            // --- Création du dossier du serveur ---
            const guildBackupDir = path.join(__dirname, `../../backups/${guild.id}`);
            if (!fs.existsSync(guildBackupDir)) fs.mkdirSync(guildBackupDir, { recursive: true });

            // --- Écriture du fichier de backup ---
            const filePath = path.join(guildBackupDir, `${backupId}.json`);
            fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));

            await interaction.editReply({
                content: `✅ Sauvegarde **${name}** créée avec succès pour **${guild.name}** !\n> 🆔 ID : \`${backupId}\``
            });

        } catch (err) {
            console.error(err);
            await interaction.editReply("❌ Une erreur est survenue pendant la sauvegarde.");
        }
    }
};
