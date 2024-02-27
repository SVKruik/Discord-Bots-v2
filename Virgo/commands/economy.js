const { SlashCommandBuilder } = require('discord.js');
const config = require('../assets/config.js');
const modules = require('..');
const embedConstructor = require('../utils/embed.js');
const logger = require('../utils/logger.js');

module.exports = {
    cooldown: config.cooldowns.C,
    data: new SlashCommandBuilder()
        .setName('economy')
        .setNameLocalizations({
            nl: "economie"
        })
        .setDescription('Controls for the economy system. View balance, withdraw and deposit.')
        .setDescriptionLocalizations({
            nl: "Bediening voor het economy systeem. Bekijk saldo, opnemen en inleggen."
        })
        .addSubcommand(option => option
            .setName('withdraw')
            .setNameLocalizations({
                nl: "opnemen"
            })
            .setDescription("Withdraw Bits from your Bank to your Wallet account.")
            .setDescriptionLocalizations({
                nl: "Bits opnemen van uw spaarrekening naar uw betaalrekening."
            })
            .addIntegerOption(option => option
                .setName('amount')
                .setNameLocalizations({
                    nl: "hoeveelheid"
                })
                .setDescription("Amount to withdraw. You must have enough Bits to do this.")
                .setDescriptionLocalizations({
                    nl: "De hoeveelheid om op te nemen. U moet genoeg Bits hebben op uw spaarrekening."
                })
                .setRequired(true)
                .setMinValue(1)))
        .addSubcommand(option => option
            .setName('deposit')
            .setNameLocalizations({
                nl: "inleggen"
            })
            .setDescription("Deposit Bits from your wallet to your bank account.")
            .setDescriptionLocalizations({
                nl: "Bits inleggen van uw betaalrekening naar uw spaarrekening."
            })
            .addIntegerOption(option => option
                .setName('amount')
                .setNameLocalizations({
                    nl: "hoeveelheid"
                })
                .setDescription("Amount to deposit. You must have enough Bits to do this.")
                .setDescriptionLocalizations({
                    nl: "De hoeveelheid om in te leggen. U moet genoeg Bits hebben op uw betaalrekening."
                })
                .setRequired(true)
                .setMinValue(100)))
        .addSubcommand(option => option
            .setName('balance')
            .setNameLocalizations({
                nl: "saldo"
            })
            .setDescription("Check your current balance.")
            .setDescriptionLocalizations({
                nl: "Bekijk uw saldo."
            })),
    async execute(interaction) {
        try {
            const snowflake = interaction.user.id;
            const amount = interaction.options.getInteger('amount');
            const actionType = interaction.options.getSubcommand();

            if (actionType === "withdraw") {
                modules.database.query("UPDATE economy SET wallet = wallet + ?, bank = bank - ? WHERE snowflake = ?;", [amount, amount, snowflake])
                    .then((data) => {
                        // Validation
                        if (!data.affectedRows) return interaction.reply({
                            content: "This command requires you to have an account. Create an account with the `/register` command.",
                            ephemeral: true
                        });

                        interaction.reply({
                            content: `Successfully withdrew \`${amount}\` Bits.`,
                            ephemeral: true
                        });
                    }).catch(() => {
                        return interaction.reply({
                            content: "Something went wrong while updating your information. Please try again later.",
                            ephemeral: true
                        });
                    });
            } else if (actionType === "deposit") {
                modules.database.query("UPDATE economy SET wallet = wallet - ?, bank = bank + ? WHERE snowflake = ?;", [amount, amount, snowflake])
                    .then((data) => {
                        // Validation
                        if (!data.affectedRows) return interaction.reply({
                            content: "This command requires you to have an account. Create an account with the `/register` command.",
                            ephemeral: true
                        });

                        interaction.reply({
                            content: `Successfully deposited \`${amount}\` Bits.`,
                            ephemeral: true
                        });
                    }).catch(() => {
                        return interaction.reply({
                            content: "Something went wrong while trying to update your information. Please try again later.",
                            ephemeral: true
                        });
                    });
            } else if (actionType === "balance") {
                modules.database.query("SELECT wallet, bank, (wallet + bank) AS 'total' FROM economy WHERE snowflake = ?;", [snowflake])
                    .then((data) => {
                        if (data.length === 0) return interaction.reply({
                            content: "This command requires you to have an account. Create an account with the `/register` command.",
                            ephemeral: true
                        });
                        const embed = embedConstructor.create("Bits Balance", "Economy Accounts", interaction.user,
                            [
                                { name: 'Wallet', value: `\`${data[0].wallet}\`` },
                                { name: 'Bank', value: `\`${data[0].bank}\`` },
                                { name: '-----', value: `Summary` },
                                { name: 'Combined', value: `\`${data[0].total}\`` }
                            ], ["shop"]);
                        interaction.reply({ embeds: [embed], ephemeral: true });
                    }).catch(() => {
                        return interaction.reply({
                            content: "Something went wrong while retrieving the required information. Please try again later.",
                            ephemeral: true
                        });
                    });
            }
        } catch (error) {
            logger.error(error);
        }
    }
};