const { Client, GatewayIntentBits, Permissions, REST, Routes, ApplicationCommandType } = require('discord.js');
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

// 步驟 2: 增加更多意圖以支持線程
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageThreads
    ]
});

// 定義斜線指令
const commands = [
    {
        name: 'create',
        description: '創建一個今日討論串',
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

// 創建討論串的函數
async function createDailyThread(channel) {
    try {
        if (!channel || channel.type !== ChannelType.GuildText) {
            throw new Error('指定的頻道不存在或不是文字頻道');
        }

        const today = new Date();
        const dateString = today.toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });

        const thread = await channel.threads.create({
            name: `${dateString} 日常討論`,
            autoArchiveDuration: 1440,
            reason: '每日討論串'
        });

        await thread.send('歡迎來到今天的討論串！');
        return thread;
    } catch (error) {
        console.error('Error creating thread:', error);
        throw error;
    }
}

// 步驟 4: 增加日誌以協助調試
client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    // 註冊斜線指令
    await deployCommands();

    // 設定每天凌晨 00:00 執行
    cron.schedule('0 0 * * *', async () => {
        try {
            const channel = await client.channels.fetch(process.env.CHANNEL_ID);
            console.log('Fetched channel:', channel);

            await createDailyThread(channel);
            console.log(`Successfully created daily thread`);
        } catch (error) {
            console.error('Error in cron job:', error);
        }
    }, {
        timezone: "Asia/Taipei"
    });
});

// 處理斜線指令
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === 'create') {
        try {
            await interaction.deferReply(); // 先回應 Discord，表示我們收到了指令

            const channel = await client.channels.fetch(process.env.CHANNEL_ID);
            const thread = await createDailyThread(channel);

            await interaction.editReply({
                content: `成功創建了討論串！\n${thread.url}`,
                ephemeral: true // 只有執行指令的人看得到回應
            });
        } catch (error) {
            console.error('Error handling create command:', error);
            await interaction.editReply({
                content: '創建討論串時發生錯誤，請稍後再試。',
                ephemeral: true
            });
        }
    }
});

// 錯誤處理
client.on('error', error => {
    console.error('Discord client error:', error);
});

// 啟動機器人
client.login(process.env.DISCORD_TOKEN);