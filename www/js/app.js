// Главный файл приложения
document.addEventListener('deviceready', onDeviceReady, false);

let floatingButtonVisible = false;
let keyboardActive = false;

let debugMode = false;

function onDeviceReady() {
    Debug.info('=== DEVICE READY ===');
    updateStatus('Ready');
    
    // Минимальная инициализация
    ScriptManager.init();
    checkPermissions();
    
    Debug.info('App ready');
}

function toggleDebug() {
    debugMode = !debugMode;
    const btn = document.getElementById('debugToggle');
    
    if (debugMode) {
        btn.textContent = '🔴';
        btn.style.background = 'rgba(255,0,0,0.5)';
        Debug.showDebugPanel();
        updateStatus('Debug ON');
    } else {
        btn.textContent = '🐛';
        btn.style.background = 'rgba(255,255,255,0.2)';
        Debug.hideDebugPanel();
        updateStatus('Debug OFF');
    }
}

// Проверка Intent запуска
function checkLaunchIntent() {
    try {
        if (typeof cordova !== 'undefined' && cordova.plugins && cordova.plugins.intent) {
            cordova.plugins.intent.getIntent((intent) => {
                Debug.info('Launch intent', intent);
                if (intent.extras && intent.extras.show_floating) {
                    Debug.info('Launched from keyboard service - showing floating button');
                    setTimeout(() => forceShowFloatingButton(), 500);
                }
            });
        }
    } catch (e) {
        Debug.warn('Intent check failed', e.message);
    }
}

// Принудительный показ плавающей кнопки
function forceShowFloatingButton() {
    Debug.info('=== FORCE SHOW FLOATING BUTTON ===');
    
    // Проверяем разрешение overlay
    if (typeof cordova !== 'undefined' && cordova.plugins && cordova.plugins.permissions) {
        cordova.plugins.permissions.checkPermission('android.permission.SYSTEM_ALERT_WINDOW', 
            (status) => {
                if (status.hasPermission) {
                    Debug.info('Overlay permission granted - showing button');
                    showFloatingButton();
                    
                    // Дополнительная проверка через 2 секунды
                    setTimeout(() => {
                        if (!floatingButtonVisible) {
                            Debug.warn('Button still not visible - forcing again');
                            showFloatingButton();
                        }
                    }, 2000);
                } else {
                    Debug.error('No overlay permission - requesting');
                    requestOverlayPermission();
                }
            }
        );
    } else {
        // Показываем без проверки
        showFloatingButton();
    }
}

function updateStatus(message) {
    const status = document.getElementById('status');
    if (status) {
        status.textContent = message;
        console.log('Status:', message);
    }
}

function enableKeyboard() {
    Debug.info('=== ENABLE KEYBOARD ===');
    updateStatus('Открываем настройки клавиатуры...');
    
    // Проверяем доступность плагина
    if (typeof KeyboardPlugin === 'undefined') {
        Debug.error('KeyboardPlugin не найден');
        updateStatus('Ошибка: KeyboardPlugin недоступен');
        
        // Fallback - прямое открытие настроек
        try {
            Debug.info('Пытаемся открыть настройки через intent');
            const intent = {
                action: 'android.settings.INPUT_METHOD_SETTINGS',
                flags: ['FLAG_ACTIVITY_NEW_TASK']
            };
            
            if (typeof cordova !== 'undefined' && cordova.plugins && cordova.plugins.intentShim) {
                cordova.plugins.intentShim.startActivity(intent);
            } else {
                // Еще один fallback
                window.open('android-app://com.android.settings/.Settings$InputMethodAndLanguageSettingsActivity', '_system');
            }
            updateStatus('Найдите ScriptableKeyboard в настройках клавиатуры');
        } catch (e) {
            Debug.error('Fallback intent failed', e);
            updateStatus('Откройте Настройки → Язык и ввод → Клавиатуры вручную');
        }
        return;
    }
    
    // Открываем настройки клавиатуры Android
    try {
        Debug.info('Вызываем KeyboardPlugin.openKeyboardSettings');
        KeyboardPlugin.openKeyboardSettings(
            function(success) {
                Debug.info('Настройки клавиатуры открыты', success);
                updateStatus('Выберите ScriptableKeyboard в списке клавиатур');
            },
            function(error) {
                Debug.error('Ошибка открытия настроек', error);
                updateStatus('Ошибка: ' + error);
            }
        );
    } catch (e) {
        Debug.error('Exception при вызове KeyboardPlugin', e);
        updateStatus('Ошибка вызова плагина: ' + e.message);
    }
}

function showFloatingButton() {
    Debug.info('=== SHOW FLOATING BUTTON ===');
    const btn = document.getElementById('floatingBtn');
    
    if (!btn) {
        Debug.error('Floating button element not found');
        updateStatus('Ошибка: кнопка не найдена');
        return;
    }
    
    if (!floatingButtonVisible) {
        Debug.info('Показываем плавающую кнопку');
        btn.style.display = 'block';
        btn.style.position = 'fixed';
        btn.style.zIndex = '9999';
        floatingButtonVisible = true;
        updateStatus('Плавающая кнопка активна');
        
        // Делаем кнопку перетаскиваемой
        makeButtonDraggable(btn);
        
        // Добавляем обработчик клика с логированием
        btn.onclick = function(e) {
            Debug.info('Floating button clicked');
            toggleKeyboard();
            e.preventDefault();
            e.stopPropagation();
        };
        
        Debug.info('Floating button configured');
    } else {
        Debug.info('Скрываем плавающую кнопку');
        btn.style.display = 'none';
        floatingButtonVisible = false;
        updateStatus('Плавающая кнопка скрыта');
    }
}

function toggleKeyboard() {
    if (!keyboardActive) {
        KeyboardManager.show();
        keyboardActive = true;
        updateStatus('Клавиатура активна');
    } else {
        KeyboardManager.hide();
        keyboardActive = false;
        updateStatus('Клавиатура скрыта');
    }
}

function openScriptManager() {
    updateStatus('Открываем менеджер скриптов...');
    // Переходим на страницу менеджера скриптов
    window.location.href = 'scripts.html';
}

function openSettings() {
    updateStatus('Открываем настройки...');
    // Переходим на страницу настроек
    window.location.href = 'settings.html';
}

function makeButtonDraggable(element) {
    let isDragging = false;
    let startX, startY, initialX, initialY;
    let dragThreshold = 10; // Минимальное расстояние для начала перетаскивания
    let hasMoved = false;
    
    element.addEventListener('touchstart', function(e) {
        isDragging = true;
        hasMoved = false;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        initialX = element.offsetLeft;
        initialY = element.offsetTop;
        
        // Убираем призрак - очищаем исходную позицию
        element.style.right = 'auto';
        element.style.bottom = 'auto';
        
        e.preventDefault();
    });
    
    element.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        
        const deltaX = currentX - startX;
        const deltaY = currentY - startY;
        
        // Проверяем, превышен ли порог перетаскивания
        if (Math.abs(deltaX) > dragThreshold || Math.abs(deltaY) > dragThreshold) {
            hasMoved = true;
            
            // Устанавливаем новую позицию
            element.style.left = (initialX + deltaX) + 'px';
            element.style.top = (initialY + deltaY) + 'px';
            
            // Убираем стили исходной позиции чтобы избежать призрака
            element.style.right = 'unset';
            element.style.bottom = 'unset';
        }
        
        e.preventDefault();
    });
    
    element.addEventListener('touchend', function(e) {
        isDragging = false;
        
        // Если кнопка не была перемещена, обрабатываем как клик
        if (!hasMoved) {
            // Позволяем обработчику клика сработать
            return;
        }
        
        // Сохраняем новую позицию
        const rect = element.getBoundingClientRect();
        element.style.left = rect.left + 'px';
        element.style.top = rect.top + 'px';
        
        e.preventDefault();
        e.stopPropagation();
    });
}

function checkPermissions() {
    Debug.info('=== CHECK PERMISSIONS ===');
    
    // Проверяем разрешение на отображение поверх других приложений
    if (typeof cordova !== 'undefined' && cordova.plugins && cordova.plugins.permissions) {
        Debug.info('Permissions plugin available');
        const permissions = cordova.plugins.permissions;
        
        permissions.checkPermission('android.permission.SYSTEM_ALERT_WINDOW', 
            function(status) {
                Debug.info('SYSTEM_ALERT_WINDOW permission', status);
                if (status.hasPermission) {
                    updateStatus('Разрешения OK');
                } else {
                    updateStatus('Нужны разрешения - нажмите для настройки');
                    // Автоматически запрашиваем разрешение
                    requestOverlayPermission();
                }
            },
            function(error) {
                Debug.error('Permission check failed', error);
                updateStatus('Ошибка проверки разрешений');
            }
        );
    } else {
        Debug.warn('Permissions plugin not available');
        // Пытаемся запросить разрешение через наш плагин
        requestOverlayPermission();
    }
}

function requestOverlayPermission() {
    Debug.info('=== REQUEST OVERLAY PERMISSION ===');
    
    if (typeof KeyboardPlugin !== 'undefined') {
        Debug.info('Requesting permissions via KeyboardPlugin');
        KeyboardPlugin.requestPermissions(
            function(success) {
                Debug.info('Permission request success', success);
                updateStatus('Разрешения запрошены. Проверьте настройки.');
            },
            function(error) {
                Debug.error('Permission request failed', error);
                updateStatus('Ошибка запроса разрешений: ' + error);
            }
        );
    } else {
        Debug.warn('KeyboardPlugin not available for permission request');
        updateStatus('Предоставьте разрешение "Поверх других приложений" в настройках');
    }
}