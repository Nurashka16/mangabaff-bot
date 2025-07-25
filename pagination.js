// pagination.js
const { By } = require('selenium-webdriver');
const { delay } = require('./utils');
const config = require('./config');

async function getMaxPageNumber(driver) {
    console.log('Определение количества страниц пагинации...');
    
    let maxPageNumber = 1;
    try {
        const pageLinks = await driver.findElements(By.css('.pagination a'));
        console.log(`Найдено ${pageLinks.length} элементов пагинации`);

        for (const link of pageLinks) {
            try {
                const text = await link.getText();
                const pageNum = parseInt(text.trim(), 10);
                if (!isNaN(pageNum) && pageNum > maxPageNumber) {
                    maxPageNumber = pageNum;
                }
            } catch (e) {
                // Игнорируем ошибки
            }
        }
    } catch (paginationError) {
        console.log('Не удалось определить пагинацию, используем только первую страницу. Ошибка:', paginationError.message);
        maxPageNumber = 1;
    }

    console.log(`Найдено ${maxPageNumber} страниц пагинации.`);
    return maxPageNumber;
}

async function navigateToRandomPage(driver, baseUrl, maxPageNumber) {
    const randomPage = Math.floor(Math.random() * maxPageNumber) + 1;
    console.log(`Выбираем случайную страницу: ${randomPage}`);

    if (randomPage > 1) {
        const randomPageUrl = `${baseUrl}&page=${randomPage}`;
        console.log(`Переход на: ${randomPageUrl}`);
        await driver.get(randomPageUrl);
        await delay(config.DELAYS.MEDIUM);
        return true;
    } else {
        console.log('Остаемся на первой странице отфильтрованного списка');
        return false;
    }
}

module.exports = { getMaxPageNumber, navigateToRandomPage };