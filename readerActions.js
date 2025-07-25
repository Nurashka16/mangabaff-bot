// readerActions.js
const { By, until } = require('selenium-webdriver');
const { delay } = require('./utils');
const config = require('./config');

async function startReadingAndSpeedUp(driver) {
    console.log('🖱️ Настройка и запуск автореада (автоскролла)...');

    try {
        // Ждем немного, чтобы панель управления загрузилась
        await delay(config.DELAYS.READING_ACTIONS);

        // --- РАБОТА С НАСТРОЙКАМИ (если нужно) ---
        // Проверим, есть ли уже элементы управления автоскроллом
        console.log('  Проверяем, нужно ли включать автоскролл...');
        let isControlsVisible = false;
        try {
            const controlsContainer = await driver.wait(
                until.elementLocated(By.css('#controls, .reader-menu-scroll__wrapper-controls')),
                2000 // Очень короткий таймаут
            );
            isControlsVisible = await controlsContainer.isDisplayed();
        } catch (e) {
            // Элемент не найден или не виден - нужно включать
        }

        if (!isControlsVisible) {
            console.log('  ⚙️ Автоскролл, вероятно, выключен. Пытаемся включить...');
            try {
                // 1. Открываем настройки
                console.log('    Открываем настройки...');
                const settingsButton = await driver.wait(
                    until.elementLocated(By.css('button.reader-menu__item--settings')),
                    10000
                );
                await settingsButton.click();
                console.log('    ✅ Настройки открыты');
                await delay(1500); // Ждем, пока попап откроется

                // 2. Включаем автоскролл
                console.log('    Ищем кнопку включения автоскролла...');
                const toggleAutoscrollButton = await driver.wait(
                    until.elementLocated(By.css('button.reader-toggle-autocroll-btn')),
                    10000
                );
                await toggleAutoscrollButton.click();
                console.log('    ✅ Автоскролл включен');
                await delay(1000); // Небольшая пауза

                // 3. Закрываем настройки кликом по центру экрана
                console.log('    Закрываем настройки кликом по центру экрана...');
                try {
                    // Получаем размеры окна браузера
                    const windowRect = await driver.manage().window().getRect();
                    const centerX = Math.floor(windowRect.width / 2);
                    const centerY = Math.floor(windowRect.height / 2);
                    
                    console.log(`      Размеры окна: ${windowRect.width}x${windowRect.height}`);
                    console.log(`      Кликаем в центр: (${centerX}, ${centerY})`);

                    // Используем Actions API для клика в точку
                    const actions = driver.actions({async: true});
                    await actions.move({x: centerX, y: centerY}).click().perform();
                    
                    console.log('    ✅ Клик по центру экрана выполнен');
                } catch (closeError) {
                    console.log('    ⚠️ Ошибка при закрытии настроек кликом по центру:', closeError.message.split('\n')[0]);
                    // Резервный вариант - Escape
                    console.log('    Пробуем закрыть попап нажатием клавиши Escape...');
                    try {
                        const actions = driver.actions({async: true});
                        await actions.sendKeys('\uE00C').perform(); // \uE00C - Escape
                        console.log('    ✅ Попытка закрытия через Escape выполнена');
                    } catch (escError) {
                        console.log('    ⚠️ Не удалось закрыть попап через Escape:', escError.message.split('\n')[0]);
                    }
                }

                // ВАЖНО: Ждем, пока попап действительно исчезнет
                console.log('    Ждем исчезновения попапа...');
                try {
                    await driver.wait(async () => {
                        try {
                            // Проверяем несколько потенциальных элементов попапа
                            const popupElements = await driver.findElements(By.css('.popup, .popup__content, .popup__close'));
                            for (const elem of popupElements) {
                                try {
                                    const isDisplayed = await elem.isDisplayed();
                                    if (isDisplayed) {
                                        return false; // Попап еще виден
                                    }
                                } catch (e) {
                                    // Элемент может быть уже удален из DOM
                                }
                            }
                            return true; // Все элементы попапа невидимы или удалены
                        } catch (e) {
                            // Если не можем найти элементы попапа, считаем его закрытым
                            return true;
                        }
                    }, 10000); // Ждем максимум 10 секунд
                    console.log('    ✅ Попап исчез');
                } catch (waitError) {
                    console.log('    ⚠️ Таймаут ожидания исчезновения попапа, продолжаем...');
                }
                
                await delay(1500); // Дополнительная пауза после закрытия
                console.log('  ⚙️ Настройки обработаны');
                
            } catch (settingsError) {
                console.log('  ⚠️ Ошибка при работе с настройками:', settingsError.message.split('\n')[0]);
                console.log('  ⚠️ Продолжаем без принудительного включения автоскролла...');
                // Пытаемся принудительно закрыть попап
                try {
                    console.log('    Принудительное закрытие попапа через Escape...');
                    const actions = driver.actions({async: true});
                    await actions.sendKeys('\uE00C').perform();
                    await delay(1000);
                } catch (e) {
                    // Игнорируем ошибки
                }
            }
        } else {
            console.log('  ✅ Элементы управления автоскроллом уже видны');
        }

        // Ждем немного ПЕРЕД началом основных действий
        await delay(1500);

        // --- ВСЕГДА пытаемся выполнить действия по управлению автоскроллом ---
        console.log('  Выполняем действия по управлению автоскроллом (ускорение, запуск)...');

        // 1. Найти и нажать кнопку ускорения дважды (icon-plus)
        console.log('  Ищем кнопку ускорения (icon-plus)...');
        try {
            // Ищем кнопку ускорения с несколькими возможными селекторами
            const speedUpSelectors = ['button#fasterBtn', 'i.icon-plus'];
            let speedUpButton = null;
            
            for (const selector of speedUpSelectors) {
                try {
                    console.log(`    Пробуем селектор: ${selector}`);
                    speedUpButton = await driver.wait(
                        until.elementLocated(By.css(selector)),
                        5000 // Короткий таймаут для каждого селектора
                    );
                    // Проверяем, что кнопка видима и кликабельна
                    await driver.wait(until.elementIsVisible(speedUpButton), 2000);
                    await driver.wait(until.elementIsEnabled(speedUpButton), 2000);
                    console.log(`    ✅ Найдена кнопка ускорения с селектором: ${selector}`);
                    break; // Нашли подходящую кнопку, выходим из цикла
                } catch (locateError) {
                    console.log(`      Селектор ${selector} не сработал: ${locateError.message.split('\n')[0]}`);
                    continue;
                }
            }
            
            if (speedUpButton) {
                console.log('  ✅ Найдена кнопка ускорения, нажимаем 1 раз...');
                await speedUpButton.click();
                await delay(500);

                console.log('  ✅ Нажимаем 2 раз...');
                await speedUpButton.click();
                await delay(5000);
                console.log('  ✅ Двойное нажатие на кнопку ускорения выполнено.');
            } else {
                console.log('  ⚠️ Кнопка ускорения не найдена ни по одному селектору.');
            }
        } catch (speedError) {
            console.log('  ⚠️ Не удалось найти или нажать кнопку ускорения:', speedError.message.split('\n')[0]);
        }

        // 2. Найти и нажать кнопку запуска автореада (icon-play)
        console.log('  Ищем кнопку запуска автореада (icon-play)...');
        try {
            // Ищем кнопку запуска с несколькими возможными селекторами
            const playSelectors = ['i.icon-play'];
            let playButtonIcon = null;
            
            for (const selector of playSelectors) {
                try {
                    console.log(`    Пробуем селектор: ${selector}`);
                    playButtonIcon = await driver.wait(
                        until.elementLocated(By.css(selector)),
                        5000 // Короткий таймаут для каждого селектора
                    );
                    // Проверяем, что иконка видима
                    await driver.wait(until.elementIsVisible(playButtonIcon), 2000);
                    console.log(`    ✅ Найдена иконка play с селектором: ${selector}`);
                    break; // Нашли подходящую иконку, выходим из цикла
                } catch (locateError) {
                    console.log(`      Селектор ${selector} не сработал: ${locateError.message.split('\n')[0]}`);
                    continue;
                }
            }
            
            if (playButtonIcon) {
                // Поднимаемся к родительской кнопке
                const playButtonParent = await playButtonIcon.findElement(By.xpath('./..'));
                // Проверяем, что родительская кнопка кликабельна
                await driver.wait(until.elementIsVisible(playButtonParent), 2000);
                await driver.wait(until.elementIsEnabled(playButtonParent), 2000);
                
                console.log('  ✅ Найдена кнопка запуска автореада, нажимаем...');
                await playButtonParent.click();
                console.log('  ✅ Кнопка запуска автореада нажата.');
            } else {
                console.log('  ⚠️ Иконка play не найдена ни по одному селектору.');
            }
        } catch (playError) {
            console.log('  ⚠️ Не удалось найти или нажать кнопку запуска автореада:', playError.message.split('\n')[0]);
        }

        console.log('✅ Настройка и запуск автореада завершены.');

        // Ждем завершения автоскролла, отслеживая номер страницы
        await waitForAutoScrollToFinish(driver);

        return true;
    } catch (error) {
        console.log('  ⚠️ Неожиданная ошибка в startReadingAndSpeedUp:', error.message.split('\n')[0]);
        // Даже при ошибке продолжаем выполнение
        console.log('✅ Настройка и запуск автореада завершены (с возможными ошибками).');
        await waitForAutoScrollToFinish(driver);
        return true;
    }
}

// Функция: ожидание завершения автоскролла по номеру страницы
async function waitForAutoScrollToFinish(driver) {
    console.log('⏳ Ожидание завершения автоскролла (проверка номера страницы)...');

    const maxWaitTimeMs = config.DELAYS.WAIT_FOR_AUTO_SCROLL || 5 * 60 * 1000; // По умолчанию 5 минут
    const checkInterval = 5000; // Проверяем каждые 5 секунд
    const maxChecks = Math.ceil(maxWaitTimeMs / checkInterval);
    let checks = 0;

    while (checks < maxChecks) {
        checks++;
        console.log(`  Проверка ${checks}/${maxChecks}...`);

        try {
            // Ищем элемент с номером страницы
            const pageIndicator = await driver.findElement(By.css('.reader-menu__item--page'));
            const pageText = await pageIndicator.getText();
            
            console.log(`    Индикатор страницы: "${pageText}"`);
            
            // Проверяем формат "число/число"
            const match = pageText.match(/^(\d+)\s*\/\s*(\d+)$/);
            if (match) {
                const currentPage = parseInt(match[1], 10);
                const totalPages = parseInt(match[2], 10);
                
                console.log(`    Текущая страница: ${currentPage}, всего страниц: ${totalPages}`);
                
                // Если текущая страница равна общей - скролл завершен
                if (currentPage === totalPages && totalPages > 0) {
                    console.log('  ✅ Достигнута последняя страница. Автоскролл завершен.');
                    await delay(2000); // Еще немного подождем, чтобы страница "успокоилась"
                    return true;
                } else {
                    console.log(`    Скролл продолжается: ${currentPage} из ${totalPages}`);
                }
            } else {
                console.log(`    Непонятный формат индикатора страницы: "${pageText}"`);
            }
            
        } catch (error) {
            // Элемент может еще не загрузиться или быть невидимым
            console.log(`  Элемент с номером страницы не найден или не виден: ${error.message.split('\n')[0]}`);
        }

        // Ждем перед следующей проверкой
        await delay(checkInterval);
    }

    console.log(`  ⏳ Достигнуто максимальное время ожидания (${maxWaitTimeMs / 1000} секунд). Принудительно завершаем.`);
    // Делаем финальный скролл вниз, на случай если автоскролл "завис"
    try {
        console.log('  Принудительная прокрутка в самый низ...');
        await driver.executeScript('window.scrollTo(0, document.body.scrollHeight);');
        await delay(1000);
    } catch (e) {
        console.log('  Не удалось выполнить принудительную прокрутку.');
    }
    
    return false;
}

module.exports = { startReadingAndSpeedUp };