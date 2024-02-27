const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../assets/config.js');
const modules = require('..');
const logger = require('../utils/logger.js');
const userUtils = require('../utils/user.js');

module.exports = {
    cooldown: config.cooldowns.A,
    data: new SlashCommandBuilder()
        .setName('block')
        .setNameLocalizations({
            nl: "blokkeren"
        })
        .setDescription(`Block a user from using ${config.general.name}.`)
        .setDescriptionLocalizations({
            nl: `Blokkeer een gebruiker voor het gebruik van ${config.general.name}.`
        })
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addUserOption(option => option
            .setName('target')
            .setNameLocalizations({
                nl: "gebruiker"
            })
            .setDescription('The target member.')
            .setDescriptionLocalizations({
                nl: "De betreffende gebruiker."
            })
            .setRequired(true))
        .addStringOption(option => option
            .setName('action')
            .setNameLocalizations({
                nl: "actie"
            })
            .setDescription('Whether you want to modify or check the user status.')
            .setDescriptionLocalizations({
                nl: "Of u de gebruiker status wilt wijzigen of bekijken."
            })
            .setRequired(true)
            .addChoices(
                { name: 'Add', value: 'add' },
                { name: 'Remove', value: 'remove' },
                { name: 'Check', value: 'check' }
            )),
    async execute(interaction) {
        try {
            // Permission Validation
            if (!(await userUtils.checkAdmin(interaction.user.id, interaction.guild))) return interaction.reply({
                content: `You do not have the required permissions to perform this elevated command. Please try again later, or contact moderation to receive elevated permissions.`,
                ephemeral: true
            });

            // Setup
            const targetUsername = interaction.options.getUser('target').username;
            const targetSnowflake = interaction.options.getUser('target').id;
            const actionType = interaction.options.getString('action');

            // Handle
            if (actionType === "add") {
                modules.database.query("INSERT INTO user_blocked (user_snowflake, user_username, guild_snowflake) VALUES (?, ?, ?);", [targetSnowflake, targetUsername, interaction.guild.id])
                    .then(() => {
                        logger.log(`${targetUsername} was blocked by '${interaction.user.username}@${interaction.user.id}' in server '${interaction.guild.name}@${interaction.guild.id}'.`, "warning");
                        return interaction.reply({
                            content: `Successfully blocked user <@${targetSnowflake}>. They can no longer use any of my commands.`,
                            ephemeral: true
                        });
                    }).catch((error) => {
                        if (error.code === "ER_DUP_ENTRY") {
                            return interaction.reply({
                                content: `User <@${targetSnowflake}> has been blocked already.`,
                                ephemeral: true
                            });
                        } else return interaction.reply({
                            content: "Something went wrong while blocking this user. Please try again later.",
                            ephemeral: true
                        });
                    });
            } else if (actionType === "remove") {
                modules.database.query("DELETE FROM user_blocked WHERE user_snowflake = ? AND guild_snowflake = ?;", [targetSnowflake, interaction.guild.id])
                    .then(() => {
                        logger.log(`${targetUsername} was unblocked by '${interaction.user.username}@${interaction.user.id}' in server '${interaction.guild.name}@${interaction.guild.id}'.`, "warning");
                        return interaction.reply({
                            content: `Successfully unblocked user <@${targetSnowflake}>. They can now use all of my commands again.`,
                            ephemeral: true
                        });
                    }).catch(() => {
                        return interaction.reply({
                            content: "Something went wrong while unblocking this user. Please try again later.",
                            ephemeral: true
                        });
                    });
            } else if (actionType === "check") {
                modules.database.query("SELECT user_snowflake FROM user_blocked WHERE user_snowflake = ?;", [targetSnowflake])
                    .then((data) => {
                        return interaction.reply({
                            content: `Blocked status of user <@${targetSnowflake}>: \`${data.length === 0 ? "false" : "true"}\``,
                            ephemeral: true
                        });
                    }).catch(() => {
                        return interaction.reply({
                            content: "Something went wrong while checking the block status of this user. Please try again later.",
                            ephemeral: true
                        });
                    });
            }
        } catch (error) {
            logger.error(error);
        }
    }
};