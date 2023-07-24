const fs = require("fs");
const { exit } = require("process");
const { resolve } = require("path");
const { reject } = require("lodash");
const readline = require('readline');
const fetch = require('node-fetch')


//adding useragent to avoid ip bans

const formHeader = async () => {
  const { Headers } = await import('node-fetch');
  const headers = new Headers();
  headers.append('User-Agent', 'TikTok 26.2.0 rv:262018 (iPhone; iOS 14.4.2; en_US) Cronet');

  return headers
}

const getInput = (message) => new Promise((resolve, reject) => {
  const inquirer = import('inquirer')
  inquirer.prompt([
    {
      type: "input",
      name: "input",
      message: message
    }
  ])
    .then(res => resolve(res))
    .catch(err => reject(err));
});

const downloadMediaFromList = async (list) => {
  const folder = "downloads/"
  const downloadPromisesArray = []
  list.forEach((item) => {
    const fileName = `${item.id}.mp4`
    const downloadFile = fetch(item.url)
    const file = fs.createWriteStream(folder + fileName)

    const downloadPromise = new Promise((response, rej) => {
      downloadFile.then(res => {
        res.body.pipe(file)
        file.on("finish", () => {
          console.log(true)
          file.close()
          response()
        });
        file.on("error", (err) => rej(err));
      });
    })
    downloadPromisesArray.push(downloadPromise)
  });
  return await Promise.allSettled(downloadPromisesArray)
}

const getVideoNoWM = async (url) => {


  const idVideo = await getIdVideo(url)
  const API_URL = `https://api16-normal-c-useast1a.tiktokv.com/aweme/v1/feed/?aweme_id=${idVideo}`;
  const request = await fetch(API_URL, {
    method: "GET",
    headers: await formHeader()
  });
  const body = await request.text();
  try {
    var res = JSON.parse(body);
  } catch (err) {
    console.error("Error:", err);
    console.error("Response body:", body);
  }
  const urlMedia = res.aweme_list[0].video.play_addr.url_list[0]
  const data = {
    url: urlMedia,
    id: idVideo
  }
  return data
}

const getRedirectUrl = async (url) => {


  if (url.includes("vm.tiktok.com") || url.includes("vt.tiktok.com")) {
    url = await fetch(url, {
      redirect: "follow",
      follow: 10,
    });
    url = url.url;
  }
  return url;
}

const getIdVideo = (url) => {
  const matching = url.includes("/video/")
  if (!matching) {
    exit();
  }
  const idVideo = url.substring(url.indexOf("/video/") + 7, url.length);
  return (idVideo.length > 19) ? idVideo.substring(0, idVideo.indexOf("?")) : idVideo;
}

const startDownloading = async (urlInput) => {

  const listMedia = []
  const listVideo = []

  const url = await getRedirectUrl(urlInput);
  listVideo.push(url);
  for (var i = 0; i < listVideo.length; i++) {
    var data = await getVideoNoWM(listVideo[i]);

    listMedia.push(data);
  }

  const downloads = await downloadMediaFromList(listMedia)

  console.log(downloads)

  console.log('poshlo')

  return listMedia[0].id
};


module.exports.startDownloading = startDownloading
