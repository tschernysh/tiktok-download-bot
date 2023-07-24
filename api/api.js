const { Config } = require('../config/Config');
const axios = require('axios')

const api = axios.create({
  responseType: 'json',
});

const getVideo = async (videoUrl) => {
  const response = await api.get(Config().TIKTOK_DOWNLOAD_API + videoUrl, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    }
  })
  console.log('request link: ', Config().TIKTOK_DOWNLOAD_API + videoUrl)
  console.log('vide without watermark: ', response)
  return response.data.video_url_no_watermark
}

const getVideoWOWatermark = async (url) => {
  const response = await api.get(url, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    }
  })
  console.log(response)
  return videoBuffer = await response.buffer();
}

module.exports.getVideoWOWatermark = getVideoWOWatermark
module.exports.getVideo = getVideo
