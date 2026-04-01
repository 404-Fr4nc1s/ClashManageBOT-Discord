const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { getRanking } = require("../../utils/wartStats");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gdc-stats")
    .setDescription("Affiche les statistiques complètes de la GDC")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const ranking = getRanking();

    if (!ranking.length) {
      return interaction.reply("❌ Aucune attaque n'a encore été enregistrée en GDC.");
    }

    let desc = "";

    ranking.forEach((p, i) => {
      desc += `**#${i + 1} — ${p.name}**\n`
            + `⭐ Étoiles : **${p.starsTotal}** (moy : ${p.starsAvg.toFixed(2)})\n`
            + `⚔️ Destruction : **${p.destructionAvg.toFixed(1)}%**\n`
            + `📊 Attaques : ${p.attacks}\n`
            + `🏆 Score : **${p.score}**\n`
            + `✨ Best : ${p.best.stars}⭐ / ${p.best.destruction}%\n`
            + `💀 Worst : ${p.worst.stars}⭐ / ${p.worst.destruction}%\n`
            + `──────────────────\n`;
    });

    const embed = new EmbedBuilder()
      .setTitle("📊 Statistiques complètes de la GDC")
      .setDescription(desc)
      .setColor("Orange")
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
