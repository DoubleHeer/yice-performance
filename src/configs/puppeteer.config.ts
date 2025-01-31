// https://blog.csdn.net/qq_43382853/article/details/103688551

const getPuppeteerConfig = (PORT: number) => {
    return {
        args: ['--no-sandbox', '--disable-setuid-sandbox', `--remote-debugging-port=${PORT}`],
        headless: process.env.USE_HEADLESS !== 'yes', // 是否使用无头浏览器
        defaultViewport: { width: 1440, height: 960 }, // 指定打开页面的宽高
        slowMo: 15, // 使 Puppeteer 操作减速，可以观察到 Puppeteer 的操作
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    };
};

export { getPuppeteerConfig };
