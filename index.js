// 添加需要的 Discord.js 組件
const { Client, GatewayIntentBits, ApplicationCommandType, Routes, REST } = require('discord.js');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageThreads,
        GatewayIntentBits.MessageContent
    ]
});
const cron = require('node-cron');
const express = require('express');
require('dotenv').config();

// 創建 Express 應用
const app = express();
const PORT = process.env.PORT || 3000;

// 簡單的健康檢查端點
app.get('/', (req, res) => {
    res.send('Discord Bot is running!');
});

// 啟動 HTTP 服務器
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// 定義斜線指令
const commands = [
    {
        name: 'create',
        description: '創建一個今日貼文',
        type: ApplicationCommandType.ChatInput
    }
];

// 註冊斜線指令的函數
async function deployCommands() {
    try {
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error('Error deploying commands:', error);
    }
}

// 處理斜線指令
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === 'create') {
        await interaction.deferReply();

        try {
            const channel = await client.channels.fetch(process.env.CHANNEL_ID);

            const today = new Date();
            const dateString = today.toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });

            const thread = await channel.threads.create({
                name: `${dateString} 今日貼文`,
                message: {
                    content: '歡迎來到今日貼文！'
                },
                autoArchiveDuration: 1440,
                reason: '每日論壇貼文'
            });

            await interaction.editReply(`✅ 成功創建今日貼文：${thread.url}`);
        } catch (error) {
            console.error('建立貼文時發生錯誤:', error);
            await interaction.editReply('❌ 創建貼文時發生錯誤，請稍後再試。');
        }
    }
});

client.once('ready', () => {
    console.log(`機器人已登入: ${client.user.tag}`);
    deployCommands();
});

// 啟動機器人
client.login(process.env.DISCORD_TOKEN);