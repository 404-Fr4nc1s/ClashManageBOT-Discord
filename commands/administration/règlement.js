const { 
    SlashCommandBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    EmbedBuilder, 
    PermissionsBitField 
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reglement')
        .setDescription('Envoie le règlement du clan avec le bouton pour l’accepter.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .setDMPermission(false),

    async run(interaction) {
        try {
            const channel = interaction.channel;

            const reglement = `
                **1. Événements obligatoires :**
                ⚔️ **| Guerres de Clans (GDC) :**
                \u200B• 2 attaques obligatoires sur la cible attribuée.  
                \u200B• Dans les délais qui vous sont donnés.  
                \u200B• Préviens en cas d’absence.  
                \u200B• 3 Héros minimum pour participer.

                🎖️ **| Jeux de Clan (JDC):**
                \u200B• Participation obligatoire (minimum 1000 points)

                ☁️ **| Raids Capital:**
                \u200B• Chaque membre doit contribuer chaque week-end.
                \u200B• Finir un village avant d’en entamer un autre (sauf si plus d’attaques).
                \u200B• Ordre d’attaque conseillé : Mines Gobeline → Parc des squelettes → Carrière des Golems → Atelier des ouvriers → Lagon des ballons → Falaises des dragons → Vallée des sorciers → Camp des barbares → Sommet de la Capitale.
                \u200B• Maxer tous les villages avant de toucher celui du sommet.

                ⚔️ **| Ligues de Clans (LDC) :**
                \u200B• Respecter les stratégies et ordres d’attaque.  
                \u200B• Être disponible pendant toute la durée de la LDC.  
                \u200B• Tous les héros doivent être prêts.

                -------------------------------------------------------------------------------------

                **2. Comportement :**
                \u200B• Inactivité de plus de 5 jours sans prévenir = risque d’expulsion.  
                \u200B• Absence prolongée → prévenir un adjoint ou le chef.

                -------------------------------------------------------------------------------------

                **3. Sanctions :**
                \u200B• 1ʳᵉ infraction → avertissement.  
                \u200B• 2ᵉ infraction → suspension temporaire.  
                \u200B• 3ᵉ infraction → exclusion définitive.  
                ⚠️ En cas de faute grave, une exclusion immédiate peut être décidée.

                -------------------------------------------------------------------------------------

                > ***Autres informations :***
                > 
                > ***Comportement en dehors du jeu :** Nous encourageons des échanges amicaux entre membres. Soyez respectueux, même en dehors des attaques et événements.*
                > ***Suggestion de nouvelles règles :** Si tu as des idées pour améliorer le serveur ou la gestion du clan, contacte un Adjoint ou le chef pour en discuter.*

                **Le respect des règles garantit un clan actif, organisé et agréable pour tous !**
                `;

            const embed = new EmbedBuilder()
                .setColor('#00AAFF')
                .setTitle('📜 | Règlement du clan Forza')
                .setDescription(`|| <@&1384169399623221350> ||\n\n${reglement}`)
                .setTimestamp();

            const bouton = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('acceptReglement')
                    .setLabel('✅ Accepter le règlement')
                    .setStyle(ButtonStyle.Success)
            );

            await channel.send({ embeds: [embed], components: [bouton] });

            await interaction.reply({ 
                content: "✅ Le règlement a bien été envoyé dans ce salon.", 
                ephemeral: true 
            });

        } catch (err) {
            console.error(err);
            await interaction.reply({ 
                content: "❌ Une erreur est survenue lors de l’envoi du règlement.", 
                ephemeral: true 
            });
        }
    }
};
