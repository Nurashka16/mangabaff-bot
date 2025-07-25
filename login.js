// login.js
const { By, until } = require('selenium-webdriver');
const { delay } = require('./utils');
const config = require('./config');

async function login(driver) {
    console.log('Переход на страницу входа...');
    try {
        await driver.get(config.BASE_URL + '/login');
        console.log('Страница входа загружена');
    } catch (getError) {
        console.error('❌ Ошибка перехода на страницу входа:', getError.message);
        throw getError;
    }

    console.log('Заполнение формы входа...');
    try {
        await driver.wait(until.elementLocated(By.name('email')), 15000);
        await driver.findElement(By.name('email')).sendKeys(config.USERNAME_OR_EMAIL);
        await driver.findElement(By.name('password')).sendKeys(config.PASSWORD);
        console.log('Email и пароль введены');
    } catch (sendError) {
        console.error('❌ Ошибка ввода данных:', sendError.message);
        throw sendError;
    }

    console.log('Попытка входа...');
    try {
        const loginButton = await driver.wait(until.elementLocated(By.css('button.login-button')), 10000);
        console.log('Кнопка входа найдена');
        await driver.wait(until.elementIsVisible(loginButton), 5000);
        console.log('Кнопка входа видима');
        await loginButton.click();
        console.log('Клик по кнопке входа выполнен');
    } catch (clickError) {
        console.error('❌ Ошибка при клике по кнопке входа:', clickError.message);
        try {
            console.log('Пробуем альтернативный способ клика...');
            await driver.executeScript("document.querySelector('button.login-button').click();");
            console.log('Альтернативный клик выполнен');
        } catch (altClickError) {
            console.error('❌ Альтернативный клик также не удался:', altClickError.message);
            throw clickError;
        }
    }

    console.log('Ожидание после входа...');
    await delay(config.DELAYS.AFTER_LOGIN);
    console.log('✅ Попытка входа завершена (ожидание закончено)');
}

module.exports = { login };