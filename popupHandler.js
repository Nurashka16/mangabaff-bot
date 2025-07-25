// popupHandler.js
const { By, until } = require('selenium-webdriver');
const { delay } = require('./utils');
const config = require('./config');

// Функция для закрытия всплывающего окна сохранения пароля
async function closeSavePasswordPopup(driver) {
    try {
        // Ждем появления всплывающего окна сохранения пароля
        await driver.wait(until.elementLocated(
            By.css('div[role="dialog"], .save-password-popup, .password-manager-popup, div[class*="password"]')
        ), 3000);
        
        // Пытаемся найти кнопку "Закрыть" или "Нет" или аналогичную
        const closeButtons = await driver.findElements(By.xpath(
            "//button[contains(translate(text(), 'ЗАКРЫТЬНЕТ', 'закрытьнет'), 'закрыть') or " +
            "contains(translate(text(), 'ЗАКРЫТЬНЕТ', 'закрытьнет'), 'нет') or " +
            "@aria-label='Close' or @aria-label='Закрыть' or @title='Close' or @title='Закрыть']"
        ));
        
        if (closeButtons.length > 0) {
            await closeButtons[0].click();
            console.log('✅ Всплывающее окно сохранения пароля закрыто');
        } else {
            // Если не нашли кнопку по тексту, пытаемся закрыть через ESC
            await driver.actions().sendKeys('\uE00C').perform(); // ESC key
            console.log('🔒 Попытка закрыть окно сохранения пароля клавишей ESC');
        }
        
        await delay(config.DELAYS.SHORT);
        return true;
    } catch (error) {
        // Окно не найдено или уже закрыто
        console.log('ℹ️ Всплывающее окно сохранения пароля не обнаружено или уже закрыто');
        return false;
    }
}

module.exports = { closeSavePasswordPopup };