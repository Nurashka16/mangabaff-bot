// scroller.js
const { delay } = require('./utils');

async function autoScroll(driver) {
    console.log('🖱️ Скроллим до конца (медленно)...');

    let lastHeight = await driver.executeScript('return document.body.scrollHeight');

    while (true) {
        await driver.executeScript('window.scrollTo(0, document.body.scrollHeight);');
        await delay(1000);
        let newHeight = await driver.executeScript('return document.body.scrollHeight');
        if (newHeight === lastHeight) {
            break;
        }
        lastHeight = newHeight;
    }

    console.log('✅ Скроллинг завершен');
}

module.exports = { autoScroll };