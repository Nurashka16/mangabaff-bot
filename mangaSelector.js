// mangaSelector.js
const { By, until } = require('selenium-webdriver');
const { delay } = require('./utils');
const config = require('./config');
const { closeSavePasswordPopup } = require('./popupHandler');
const { getMaxPageNumber, navigateToRandomPage } = require('./pagination');
const { findAndSelectRandomManga } = require('./mangaFinder');

async function selectRandomManga(driver, isPopupChecked = false) {
    // Используем новую URL с фильтром type_id[]=1
    const baseUrl = 'https://mangabuff.ru/manga?type_id%5B%5D=1';
    console.log(`Переход к списку всех манг (отфильтрованных): ${baseUrl}`);

    try {
        await driver.get(baseUrl);
        console.log('Страница списка отфильтрованных манги загружена');
        
        // Проверяем и закрываем всплывающее окно сохранения пароля только если еще не проверяли
        if (!isPopupChecked) {
            await closeSavePasswordPopup(driver);
        }
        
    } catch (getError) {
        console.error('❌ Ошибка перехода на страницу списка отфильтрованных манги:', getError.message);
        throw getError;
    }

    await delay(config.DELAYS.MEDIUM);

    // Получаем максимальный номер страницы
    const maxPageNumber = await getMaxPageNumber(driver);

    // Переходим на случайную страницу
    const pageChanged = await navigateToRandomPage(driver, baseUrl, maxPageNumber);

    // Если перешли на другую страницу, проверяем попап снова
    if (pageChanged && !isPopupChecked) {
        await closeSavePasswordPopup(driver);
    }

    // Ищем и выбираем случайную мангу
    return await findAndSelectRandomManga(driver);
}

// Новая функция для перехода к следующей главе
// Новая функция для перехода к следующей главе
async function goToNextChapterIfAvailable(driver) {
    try {
        console.log('Проверяем наличие кнопки "Следующая глава"...');
        
        // Ждем загрузки страницы
        await driver.wait(until.elementLocated(By.css('body')), 5000);
        
        // Ищем кнопку следующей главы по различным селекторам
        const nextChapterSelectors = [
            'a.navigate-button[href*="/chapter/"]', // основной селектор для кнопки навигации
            'a[href*="/chapter/"].navigate-button',
            '.navigate-button[href*="/manga/"]',
            'a.navigate-button i.icon-new-arrow-next',
            'a[href*="/chapter/"]',
            '.chapter-navigation a:not([href*="prev"]):not([href*="пред"])',
            'a:contains("Следующая")',
            'a:contains("Next")'
        ];
        
        let nextChapterButton = null;
        
        for (const selector of nextChapterSelectors) {
            try {
                const elements = await driver.findElements(By.css(selector));
                if (elements.length > 0) {
                    // Проверяем, что элемент видим и кликабелен
                    for (const element of elements) {
                        try {
                            const isDisplayed = await element.isDisplayed();
                            const isEnabled = await element.isEnabled();
                            const href = await element.getAttribute('href');
                            
                            // Проверяем, что это не пустая ссылка и ведет на главу
                            if (isDisplayed && isEnabled && href && href.includes('/chapter/')) {
                                nextChapterButton = element;
                                console.log(`Найдена кнопка следующей главы с href: ${href}`);
                                break;
                            }
                        } catch (e) {
                            // Продолжаем проверку других элементов
                        }
                    }
                    if (nextChapterButton) break;
                }
            } catch (e) {
                // Продолжаем с другими селекторами
            }
        }
        
        // Дополнительный поиск по XPath для иконки стрелки
        if (!nextChapterButton) {
            try {
                const arrowElements = await driver.findElements(By.xpath("//a[contains(@class, 'navigate-button')]//i[contains(@class, 'icon-new-arrow-next')]"));
                if (arrowElements.length > 0) {
                    // Получаем родительский элемент <a>
                    nextChapterButton = await arrowElements[0].findElement(By.xpath("./.."));
                    const href = await nextChapterButton.getAttribute('href');
                    console.log(`Найдена кнопка следующей главы через XPath с href: ${href}`);
                }
            } catch (e) {
                // Продолжаем
            }
        }
        
        if (nextChapterButton) {
            const buttonText = await nextChapterButton.getText();
            const buttonHref = await nextChapterButton.getAttribute('href');
            console.log(`✅ Найдена кнопка следующей главы: "${buttonText}" с ссылкой: ${buttonHref}. Переходим...`);
            await nextChapterButton.click();
            await delay(config.DELAYS.MEDIUM);
            return true; // Успешно перешли к следующей главе
        } else {
            console.log('ℹ️ Кнопка "Следующая глава" не найдена. Будет выбрана новая манга.');
            return false; // Следующей главы нет
        }
        
    } catch (error) {
        console.log('ℹ️ Не удалось найти или перейти к следующей главе. Ошибка:', error.message);
        return false; // В случае ошибки тоже выбираем новую мангу
    }
}

module.exports = { selectRandomManga, goToNextChapterIfAvailable };