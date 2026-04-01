const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Affiche toutes les commandes du bot ou les détails d'une commande spécifique")
    .addStringOption(option =>
      option
        .setName("commande")
        .setDescription("Nom de la commande à afficher")
        .setRequired(false)
        .setAutocomplete(true)
    ),
  category: "Aide",

  // Autocomplete : limite à 25 résultats et renvoie des objets { name, value }
  async autocomplete(interaction) {
    try {
      const focused = interaction.options.getFocused(); // texte tapé
      const choices = [...interaction.client.commands.keys()]; // noms de commandes
      const filtered = choices
        .filter(c => c.toLowerCase().includes(focused.toLowerCase()))
        .slice(0, 25); // max 25

      await interaction.respond(
        filtered.map(name => ({ name, value: name }))
      );
    } catch (err) {
      console.error("Autocomplete error:", err);
      // ne pas throw — Discord attend une réponse rapide
      await interaction.respond([]);
    }
  },

  async run(interaction) {
    // Répond immédiatement pour éviter timeout, puis editReply
    await interaction.reply({ content: "⏳ Traitement en cours...", fetchReply: true });

    const commandName = interaction.options.getString("commande");
    const commands = interaction.client.commands;

    if (commandName) {
      const command = commands.get(commandName);
      if (!command) return interaction.editReply({ content: "❌ Cette commande n'existe pas !" });

      const embed = new EmbedBuilder()
        .setColor("#ffcc00")
        .setTitle(`Aide : /${command.data.name}`)
        .setDescription(
            `**Description:** ${command.data.description}\n` +
            `**Permissions requises:** ${command.permissions ? command.permissions.flat().join(", ") : "Aucune"}`
        )
        .setFooter({ text: "Commande spécifique" })
        .setTimestamp();

      return interaction.editReply({ content: null, embeds: [embed] });
    }

    const categories = {};
    for (const cmd of commands.values()) {
      const cat = cmd.category || "Autres";
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(cmd);
    }

    const embed = new EmbedBuilder()
      .setColor("#ffcc00")
      .setTitle("📚 Commandes disponibles")
      .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
      .setDescription(
        `Le bot contient **${commands.size}** commandes réparties en **${Object.keys(categories).length}** catégories.`
      )
      .setTimestamp()
      .setFooter({ text: "Utilise /help [commande] pour plus de détails" });

    for (const [category, cmds] of Object.entries(categories)) {
      embed.addFields({
        name: `🗂️ ${category}`,
        value: cmds.map(c => `\`/${c.data.name}\``).join(", "),
        inline: false,
      });
    }

    await interaction.editReply({ content: null, embeds: [embed] });
  },
};
