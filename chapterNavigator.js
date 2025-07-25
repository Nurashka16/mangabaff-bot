// chapterNavigator.js
const { By, until } = require('selenium-webdriver');
const { delay } = require('./utils');
const config = require('./config');
const { startReadingAndSpeedUp } = require('./readerActions');
const { findNextChapterButton } = require('./buttonFinder');

async function navigateToFirstChapter(driver) {
    console.log('🔍 Ищем кнопку "Читать" или ссылки на главы...');

    await delay(config.DELAYS.MEDIUM);

    // Проверяем наличие кнопки "Нет глав"
    try {
        const noChaptersButtons = await driver.findElements(By.css('button.button--primary.mb-2'));
        for (const button of noChaptersButtons) {
            try {
                const text = await button.getText();
                console.log(`  Проверка кнопки: "${text.trim()}"`);
                if (text.trim() === 'Нет глав') {
                    console.log('❌ На странице манги обнаружена кнопка "Нет глав".');
                    return 'NO_CHAPTERS';
                }
            } catch (e) {
                // Игнорируем ошибки
            }
        }
    } catch (e) {
        console.log('  Ошибка при проверке кнопки "Нет глав":', e.message);
    }

    // Ищем кнопку "Читать" с несколькими попытками
    console.log('  Ищем кнопку "Читать" (a.read-btn)...');
    for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`    Попытка ${attempt}/3...`);
        try {
            const readButton = await driver.wait(until.elementLocated(By.css('a.read-btn')), 5000);
            console.log('    ✅ Кнопка "Читать" найдена!');

            await driver.wait(until.elementIsVisible(readButton), 2000);
            console.log('    ✅ Кнопка "Читать" видима!');

            const chapterUrl = await readButton.getAttribute('href');
            console.log('챕тер Найдена кнопка "Читать", открываем первую главу:', chapterUrl);
            await driver.get(chapterUrl);
            await delay(config.DELAYS.MEDIUM);
            await startReadingAndSpeedUp(driver);
            return chapterUrl;
        } catch (e) {
            console.log(`    Попытка ${attempt} не удалась:`, e.message.split('\n')[0]);
            if (attempt < 3) {
                await delay(config.DELAYS.MEDIUM);
            }
        }
    }

    console.log('  Кнопка "Читать" не найдена, ищем ссылки на главы...');

    try {
        const chapterLinks = await driver.findElements(By.css('a[href*="/chapter/"]'));
        console.log(`  Найдено ${chapterLinks.length} ссылок на главы.`);
        if (chapterLinks.length === 0) {
            throw new Error('У манги нет глав или они не загрузились');
        }

        const firstChapter = chapterLinks[0];
        const chapterUrl = await firstChapter.getAttribute('href');
        console.log('챕터 Открываем первую главу (альтернативный способ):', chapterUrl);
        await driver.get(chapterUrl);
        await delay(config.DELAYS.MEDIUM);
        await startReadingAndSpeedUp(driver);
        return chapterUrl;
    } catch (chapterError) {
        console.error('❌ Ошибка при поиске/открытии глав:', chapterError.message);
        throw chapterError;
    }
}

// --- НОВАЯ ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ ОЧИСТКИ URL ---
function normalizeUrl(url) {
    if (!url) return url;
    try {
        console.log(`    [DEBUG] Нормализация URL: "${url}"`);
        // 1. Убираем пробельные символы в начале и конце, включая специальные
        // \s - обычные пробелы, табуляции, новые строки
        // \u00A0 - неразрывный пробел
        // \u200B - zero-width space
        // \uFEFF - byte order mark
        let cleanUrl = url.replace(/^[\s\u00A0\u200B\uFEFF]+|[\s\u00A0\u200B\uFEFF]+$/g, '');
        console.log(`    [DEBUG] После trim: "${cleanUrl}"`);
        // 2. Убираем часть после # (якорь)
        cleanUrl = cleanUrl.split('#')[0];
        console.log(`    [DEBUG] После убранного #: "${cleanUrl}"`);
        // 3. Убираем завершающие слэши
        cleanUrl = cleanUrl.replace(/\/+$/, '');
        console.log(`    [DEBUG] После убранного завершающего /: "${cleanUrl}"`);
        return cleanUrl;
    } catch (e) {
        console.warn('  [WARN] Ошибка при нормализации URL, возвращаем базовую очистку:', e.message);
        // Если нормализация через регулярки сломалась, делаем базовую очистку
        return url ? url.replace(/^[\s\u00A0\u200B\uFEFF]+|[\s\u00A0\u200B\uFEFF]+$/g, '').split('#')[0].replace(/\/+$/, '') : url;
    }
}
// --- КОНЕЦ НОВОЙ ФУНКЦИИ ---

// chapterNavigator.js (фрагмент функции processChapters)
async function processChapters(driver) {
    let hasNextChapter = true;
    let totalChaptersRead = 1; // Уже прочитали первую

    // --- ЭТАП 4: ЧТЕНИЕ ВСЕХ ГЛАВ МАНГИ ---
    while (hasNextChapter) {
        console.log(`\n챕тер Работа с главой ${totalChaptersRead + 1}...`);

        // --- ЭТАП 5: СКРОЛЛИНГ ГЛАВЫ ---
        // await autoScroll(driver);
        // await delay(config.DELAYS.AFTER_SCROLL);

        // --- ЭТАП 6: ПОИСК КНОПКИ СЛЕДУЮЩЕЙ ГЛАВЫ ---
        const nextButton = await findNextChapterButton(driver);

        if (nextButton) {
            try {
                // Получаем URL кнопки
                const nextUrl = await nextButton.getAttribute('href');
                const currentUrl = await driver.getCurrentUrl();
                
                console.log('➡️ Переход на следующую главу:', nextUrl);
                console.log('  Текущая страница:', currentUrl);

                // Простая проверка, что URL существует
                if (nextUrl) {
                    // --- ЭТАП 7: ПЕРЕХОД НА СЛЕДУЮЩУЮ ГЛАВУ ---
                    console.log('  Попытка клика по кнопке...');
                    await nextButton.click();
                    console.log('  Клик выполнен, ожидание навигации...');
                    await delay(config.DELAYS.BETWEEN_CHAPTERS);
                    console.log('  Навигация завершена.');
                    
                    // После перехода на новую главу снова выполняем действия
                    await startReadingAndSpeedUp(driver);
                    totalChaptersRead++;
                    console.log(`  ✅ Успешно перешли к главе ${totalChaptersRead}.`);
                } else {
                    hasNextChapter = false;
                    console.log('⏹️ URL кнопки пуст.');
                }
            } catch (error) {
                console.log('⚠️ Ошибка при работе с кнопкой следующей главы:', error.message.split('\n')[0]);
                hasNextChapter = false;
            }
        } else {
            hasNextChapter = false;
            console.log('🔚 Больше глав нет или кнопка не найдена. Переходим к новой манге.');
        }
    }

    console.log(`\n🏠 Закончили читать мангу. Прочитано глав: ${totalChaptersRead}`);
    return totalChaptersRead;
}

module.exports = { navigateToFirstChapter, processChapters };