const puppeteer = require('puppeteer');
const ffmpeg = require('fluent-ffmpeg');

const url = 'https://interactly.video';
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: 'domcontentloaded' });

  //total height of the page
  const bodyHandle = await page.$('body');
  const { height } = await bodyHandle.boundingBox();
  await bodyHandle.dispose();

  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const scrollInterval = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(scrollInterval);
          resolve();
        }
      }, 100);
    });
  });

  await page.waitForTimeout(2000);

  const videoPath = 'output.mp4';
  await page.screenshot({ path: 'screenshot.png' });

  const ffmpegCommand = ffmpeg();
  ffmpegCommand.input('screenshot.png')
    .inputFormat('image2')
    .inputFPS(1)
    .inputOptions('-pattern_type glob')
    .videoCodec('libx264')
    .outputOptions('-t 10') 
    .output(videoPath)
    .on('end', () => {
      console.log('Video recording complete.');
      browser.close();
    })
    .run();
})();
