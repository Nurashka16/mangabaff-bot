// main.js
const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const config = require('./config');
const { login } = require('./login');
const { selectRandomManga, goToNextChapterIfAvailable } = require('./mangaSelector');
const { closeSavePasswordPopup } = require('./popupHandler');
const { autoScrollPage } = require('./chapterNavigator'); // Убедитесь, что эта функция импортирована

(async () => {
    let driver;
    let consecutiveErrors = 0;
    let isPopupChecked = false;

    try {
        console.log('Запуск браузера...');

        let options = new chrome.Options();
        options.addArguments('--incognito');
        options.addArguments('--disable-save-password-bubble');
        options.addArguments('--disable-password-manager');
        options.addArguments('--password-store=basic');
        options.addArguments('--no-sandbox');
        options.addArguments('--disable-dev-shm-usage');
        options.setUserPreferences({
            'credentials_enable_service': false,
            'profile.password_manager_enabled': false
        });

        driver = new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();

        console.log('🚀 Бот запущен!');
        
        // Авторизация
        await login(driver);
        
        // Проверяем всплывающее окно только один раз после логина
        await closeSavePasswordPopup(driver);
        isPopupChecked = true;
        console.log('✅ Проверка всплывающего окна выполнена');
        
        // Сначала выбираем случайную мангу
        await selectRandomManga(driver, isPopupChecked);
        console.log('✅ Первая манга выбрана и обработана');
        
        // Основной цикл работы бота - переход к следующим главам
        while (consecutiveErrors < config.MAX_CONSECUTIVE_ERRORS) {
            try {
                // Пытаемся перейти к следующей главе
                const hasNextChapter = await goToNextChapterIfAvailable(driver);
                
                if (hasNextChapter) {
                    console.log('✅ Переход к следующей главе выполнен');
                    consecutiveErrors = 0; // Сбрасываем счетчик ошибок
                    
                    // Здесь нужно добавить обработку автоскролла для новой главы
                    console.log('🔄 Начинаем автоскролл новой главы...');
                    await autoScrollPage(driver); // Вызываем функцию автоскролла для новой главы
                    console.log('✅ Автоскролл новой главы завершен');
                    
                } else {
                    console.log('🔄 Следующая глава отсутствует. Выбираем новую мангу...');
                    await selectRandomManga(driver, isPopupChecked);
                    consecutiveErrors = 0; // Сбрасываем счетчик ошибок
                    console.log('✅ Новая манга выбрана и обработана');
                }
                
                // Небольшая пауза между итерациями
                await new Promise(resolve => setTimeout(resolve, 2000));
                
            } catch (error) {
                consecutiveErrors++;
                console.error(`❌ Ошибка при переходе к следующей главе (${consecutiveErrors}/${config.MAX_CONSECUTIVE_ERRORS}):`, error.message);
                
                if (consecutiveErrors >= config.MAX_CONSECUTIVE_ERRORS) {
                    console.log(`\n🏁 Цикл завершен после ${config.MAX_CONSECUTIVE_ERRORS} попыток.`);
                    break;
                }
                
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }

    } catch (err) {
        console.error('❌ Критическая ошибка:', err);
    } finally {
        if (driver) {
            console.log("\n🤖 Бот остановлен. Закрываем браузер...");
            await driver.quit();
        }
    }
})();