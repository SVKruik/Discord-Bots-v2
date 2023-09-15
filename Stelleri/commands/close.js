const { SlashCommandBuilder } = require('discord.js');
const modules = require('..');
const config = require('../assets/config.js');

module.exports = {
    cooldown: config.cooldowns.D,
    data: new SlashCommandBuilder()
        .setName('close')
        .setDescription('Close your account. You can no longer use account specific commands.')
        .addStringOption(option => option.setName('pincode').setDescription('Your 4-digit pincode you chose when registering your account.').setRequired(true)),
    async execute(interaction) {
        const snowflake = interaction.user.id;
        const inputPincode = interaction.options.getString('pincode');

        modules.database.query(`SELECT pincode AS 'pin' FROM user WHERE snowflake = '${snowflake}';`)
            .then(async ([data]) => {
                const dataPincode = data[0].pin;
                if (inputPincode == dataPincode) {
                    modules.database.query(`DELETE FROM user WHERE snowflake = '${snowflake}';`)
                        .then(async () => {
                            await interaction.reply({ content: "Your account has been succesfully closed. If you change your mind, you can always create a new account with `/register`.", ephemeral: true });
                        }).catch(async () => {
                            await interaction.reply({ content: "This command requires you to have an account. Create an account with the `/register` command.", ephemeral: true });
                        });
                } else {
                    await interaction.reply({ content: "Your pincode is not correct. If you forgot your pincode, you can request it with `/pincode`.", ephemeral: true });
                };
            }).catch(async () => {
                return modules.log(`Command usage increase unsuccessful, ${username} does not have an account yet.`, "warning");
            });
    }
};