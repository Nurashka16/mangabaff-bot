// buttonFinder.js
const { By, until } = require('selenium-webdriver');
const { delay } = require('./utils');

async function findNextChapterButton(driver) {
    console.log('🔍 Ищем кнопку следующей главы (по иконке navigate-button)...');
    await delay(1000);

    try {
        // Ищем все кнопки с классом navigate-button
        const navigateButtons = await driver.findElements(By.css('a.navigate-button'));
        console.log(`  Найдено ${navigateButtons.length} кнопок с классом 'navigate-button'`);

        // Проверяем каждую кнопку на наличие иконки icon-new-arrow-next
        for (const button of navigateButtons) {
            try {
                const icon = await button.findElements(By.css('i.icon-new-arrow-next'));
                if (icon.length > 0) {
                    // Нашли кнопку с нужной иконкой
                    const href = await button.getAttribute('href');
                    console.log(`  ✅ Найдена кнопка следующей главы: href="${href}"`);
                    return button;
                }
            } catch (e) {
                console.log(`  Ошибка при проверке кнопки: ${e.message.split('\n')[0]}`);
            }
        }
        
        console.log('  ❌ Кнопка с иконкой icon-new-arrow-next не найдена среди navigate-button');
    } catch (e) {
        console.log('  Ошибка при поиске кнопок navigate-button:', e.message.split('\n')[0]);
    }

    // Если не нашли по иконке, пробуем найти любую кнопку navigate-button
    console.log('  Ищем любую кнопку с классом navigate-button...');
    try {
        const anyNavigateButton = await driver.findElement(By.css('a.navigate-button'));
        const href = await anyNavigateButton.getAttribute('href');
        console.log(`  ✅ Найдена кнопка navigate-button: href="${href}"`);
        return anyNavigateButton;
    } catch (e) {
        console.log('  ❌ Кнопка navigate-button не найдена');
    }

    console.log('❌ Кнопка следующей главы не найдена');
    return null;
}

module.exports = { findNextChapterButton };