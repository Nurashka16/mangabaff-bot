// mangaFinder.js
const { By } = require('selenium-webdriver');
const { delay } = require('./utils');
const config = require('./config');
const { navigateToFirstChapter } = require('./chapterNavigator');

async function findAndSelectRandomManga(driver) {
    console.log('Выбираем случайную мангу со страницы...');

    let mangaItems = [];
    try {
        mangaItems = await driver.findElements(By.css('.cards__item'));
        console.log(`Найдено ${mangaItems.length} карточек манги на странице.`);
    } catch (findError) {
        console.error('❌ Ошибка поиска карточек манги:', findError.message);
        throw findError;
    }

    if (mangaItems.length === 0) {
        console.log('Карточки .cards__item не найдены, пробуем альтернативный способ...');
        return await findMangaAlternativeWay(driver);
    } else {
        const randomIndex = Math.floor(Math.random() * mangaItems.length);
        const randomItem = mangaItems[randomIndex];
        const mangaUrl = await randomItem.getAttribute('href');
        console.log('📖 Открываем страницу манги:', mangaUrl);
        await driver.get(mangaUrl);
        await delay(config.DELAYS.BETWEEN_MANGA);
        return await navigateToFirstChapter(driver);
    }
}

async function findMangaAlternativeWay(driver) {
    try {
        const allLinks = await driver.findElements(By.css('a'));
        let mangaLinks = [];
        for (const link of allLinks) {
            try {
                const href = await link.getAttribute('href');
                if (href && href.startsWith('https://mangabuff.ru/manga/') &&
                    !href.includes('/collections/') &&
                    !href.includes('/chapter/')) {
                    const url = new URL(href);
                    const pathParts = url.pathname.split('/').filter(part => part.length > 0);
                    if (pathParts.length === 2 && pathParts[0] === 'manga' && pathParts[1].length > 0) {
                        mangaLinks.push({ element: link, href: href });
                    }
                }
            } catch (e) {
                // Игнорируем ошибки
            }
        }

        if (mangaLinks.length === 0) {
            throw new Error('Не удалось найти мангу на выбранной странице пагинации (альтернативный способ).');
        }

        const randomLink = mangaLinks[Math.floor(Math.random() * mangaLinks.length)];
        console.log('📖 Открываем страницу манги (альтернативный способ):', randomLink.href);
        await driver.get(randomLink.href);
        await delay(config.DELAYS.BETWEEN_MANGA);
        return await navigateToFirstChapter(driver);

    } catch (altError) {
        console.error('❌ Альтернативный способ поиска манги не удался:', altError.message);
        throw altError;
    }
}

module.exports = { findAndSelectRandomManga };