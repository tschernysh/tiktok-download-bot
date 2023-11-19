const { Config } = require('./config/Config');
const TelegramBot = require('node-telegram-bot-api');
const NeedSubscribeChannels = require('./config/needSubscribeChannels.json');
const { getVideo, getVideoWOWatermark } = require('./api/api');
const { startDownloading } = require('./utils/download');
const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios')

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true })

bot.on('callback_query', async (query) => {

  const chatId = query.message.chat.id;
  const chatUsername = '@' + query.message.chat.username
  const data = query.data;
  const greetPicture = 'assets/tgnavigator.jpg'; // Шлях до файлу зображення
  console.log(query)
  switch (data) {
    case 'checkChannels':
      const subscribeChannelsList = NeedSubscribeChannels.channels

      let accessDenied = false

      let currentUserSubscribed
      console.log(subscribeChannelsList[0], query.from.id)
      console.log('data to check: ', subscribeChannelsList[0].channelId, query.from.id)
      try {
        currentUserSubscribed = await bot.getChatMember(subscribeChannelsList[0].channelId, query.from.id)
      } catch (error) {
        console.log(error.message)
      }
      console.log('currentUserSubscribed: ', currentUserSubscribed)
      if (!currentUserSubscribed || currentUserSubscribed.status === 'left' || currentUserSubscribed.status === 'kicked') {
        accessDenied = true
        break
      }
      console.log('access denied', accessDenied)
      if (accessDenied) {
        sendChannelsToSubscribe(chatId)
      } else {
        sendGreetingMenu(chatId, greetPicture)
      }


      break
  }

  bot.answerCallbackQuery(query.id);
})

const sendGreetingMenu = async (chatId, greetPicture) => {
  await bot.sendMessage(chatId, 'Feel free to send TikTok video link.')
    .then(() => {
      console.log('Картинка успішно відправлена');
    })
    .catch((error) => {
      console.error('Помилка під час відправлення картинки:', error);
    });
}
const sendTiktokVideo = async (chatId, videoUrl) => {
  console.log('chat id', chatId)

  const linkToSend = 'https://t.me/+B2uDX5gPI2UwMDBi'

  const captionText = `Earn 24/7
${linkToSend}`

  const video = await startDownloading(videoUrl)

  const videoPath = `./downloads/${video}.mp4`

  const url = `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendVideo`;

  const videoData = await fs.promises.readFile(videoPath);

  const formData = new FormData();
  formData.append('chat_id', chatId);
  formData.append('video', videoData, 'video.mp4');
  formData.append('caption', captionText)
  console.log('FORM DATA', formData)
  try {
    const response = await axios.post(url, formData, {
      headers: {
        ...formData.getHeaders(),
        'Content-Type': 'multipart/form-data'
      }
    });
    console.log(response)
  } catch (error) {
    console.log('FUCKING ERROR', error.message)
  }

  try {
    fs.unlinkSync(videoPath)
  } catch (error) {
    console.log(error.message)
  }

}

const checkSubscription = async (id, messageToSend) => {
  const subscribeChannelsList = NeedSubscribeChannels.channels

  let accessDenied = false
  let currentUserSubscribed
  console.log(subscribeChannelsList[0], id)
  console.log('data to check: ', subscribeChannelsList[0].channelId, id)
  try {
    currentUserSubscribed = await bot.getChatMember(subscribeChannelsList[0].channelId, id)
  } catch (error) {
    console.log(error.message)
  }
  console.log('currentUserSubscribed: ', currentUserSubscribed)
  if (!currentUserSubscribed || currentUserSubscribed.status === 'left' || currentUserSubscribed.status === 'kicked') {
    accessDenied = true
  }
  console.log('access denied', accessDenied)
  if (accessDenied) {
    sendChannelsToSubscribe(id)
  } else {
    console.log(messageToSend)
    messageToSend()
  }
}

const sendChannelsToSubscribe = (chatId) => {

  const listOfChannels = NeedSubscribeChannels.channels.map((el, index) => (el.link)).join("\n")

  const textToSubscribe = `Hello, for using our service you need to subscribe to this channel:

${listOfChannels}`

  const subscribeOptions = {
    reply_markup: JSON.stringify({
      inline_keyboard: [
        [{ text: 'Check', callback_data: 'checkChannels' }],
      ],
    }),
    disable_web_page_preview: true
  }

  bot.sendMessage(chatId, textToSubscribe, subscribeOptions);

}

bot.onText(/\/start/, (msg) => {
  userNeedToSubscribe = true
  sendChannelsToSubscribe(msg.chat.id)
});

bot.onText(/^https:\/\/www\.tiktok\.com\/@([^\/]+)\/video\/(\d+)/, (msg) => {
  const matches = msg.text.match(/^https:\/\/www\.tiktok\.com\/@([^\/]+)\/video\/(\d+)\?/);

  console.log(matches)
  checkSubscription(msg.chat.id, () => sendTiktokVideo(msg.chat.id, msg.text))
})


bot.onText(/^https:\/\/vm\.tiktok\.com\/[A-Za-z0-9\-_]+\/?$/, (msg) => {
  const matches = msg.text.match(/^https:\/\/www\.tiktok\.com\/@([^\/]+)\/video\/(\d+)\?/);

  checkSubscription(msg.chat.id, () => sendTiktokVideo(msg.chat.id, msg.text))
})
