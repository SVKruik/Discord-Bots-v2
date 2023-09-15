const { SlashCommandBuilder } = require('discord.js');
const config = require('../assets/config.js');
const { EmbedBuilder } = require('discord.js');
const modules = require('..');
const fs = require('fs');

module.exports = {
    cooldown: config.cooldowns.C,
    data: new SlashCommandBuilder()
        .setName('statistics')
        .setDescription('Let the bot display some statistics.'),
    async execute(interaction) {
        const username = interaction.user.username;
        const pfp = interaction.user.avatarURL();
        const commands = fs.readdirSync("commands").length;
        const hours = Math.floor(modules.client.uptime / 3600000) % 24;
        const minutes = Math.floor(modules.client.uptime / 60000) % 60;
        const uptime = `\`${hours}\` hours and \`${minutes}\` minutes.`

        const embed = new EmbedBuilder()
            .setColor(config.general.color)
            .setTitle("Bot Statistics")
            .setAuthor({ name: username, iconURL: pfp })
            .addFields({ name: '----', value: 'List' })
            .addFields(
                { name: 'Name', value: `**${config.general.name}**` },
                { name: 'Creator', value: `<@422704748488163332>` },
                { name: 'Uptime', value: uptime },
                { name: 'Ping', value: `\`${modules.client.ws.ping}\`ms` },
                { name: 'Commands', value: `\`${commands}\` Total` },
                { name: 'Repository', value: `https://github.com/SVKruik/Discord-Bots-v2` },
                { name: 'Version', value: `\`v2.1.0\`` }
            )
            .addFields({ name: '----', value: 'Meta' })
            .setTimestamp()
            .setFooter({ text: `Embed created by ${config.general.name}` })
        await interaction.reply({ embeds: [embed] });
    }
};