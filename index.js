const { Client, GatewayIntentBits, Permissions } = require('discord.js');
const cron = require('node-cron');
require('dotenv').config();

// 創建 Discord 客戶端
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

// 機器人啟動時的事件
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    // 設定每天凌晨 00:00 執行
    cron.schedule('0 0 * * *', async () => {
        try {
            // 取得目標頻道 (請替換成您的頻道 ID)
            const channel = await client.channels.fetch(process.env.CHANNEL_ID);

            // 取得今天的日期
            const today = new Date();
            const dateString = today.toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });

            // 創建新的討論串
            const thread = await channel.threads.create({
                name: `${dateString} 日常討論`,
                autoArchiveDuration: 1440, // 24小時後自動封存
                reason: '每日自動創建的討論串'
            });

            // 發送歡迎訊息
            await thread.send('歡迎來到今天的討論串！');

            console.log(`Successfully created thread for ${dateString}`);
        } catch (error) {
            console.error('Error creating daily thread:', error);
        }
    }, {
        timezone: "Asia/Taipei" // 設定時區為台北時間
    });
});

// 錯誤處理
client.on('error', error => {
    console.error('Discord client error:', error);
});

// 環境配置
// 在 .env 檔案中設定以下變數：
// DISCORD_TOKEN=你的機器人Token
// CHANNEL_ID=目標頻道ID

// 啟動機器人
client.login(process.env.DISCORD_TOKEN);