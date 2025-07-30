// Главный файл приложения
document.addEventListener('deviceready', onDeviceReady, false);

let floatingButtonVisible = false;
let keyboardActive = false;

function onDeviceReady() {
    console.log('Cordova готова!');
    updateStatus('Приложение загружено');
    
    // Проверяем разрешения
    checkPermissions();
    
    // Инициализируем систему скриптов
    ScriptManager.init();
}

function updateStatus(message) {
    const status = document.getElementById('status');
    if (status) {
        status.textContent = message;
        console.log('Status:', message);
    }
}

function enableKeyboard() {
    updateStatus('Открываем настройки клавиатуры...');
    
    // Открываем настройки клавиатуры Android
    try {
        cordova.exec(
            function(success) {
                updateStatus('Выберите ScriptableKeyboard в списке клавиатур');
            },
            function(error) {
                updateStatus('Ошибка: ' + error);
            },
            'KeyboardPlugin',
            'openKeyboardSettings',
            []
        );
    } catch (e) {
        // Fallback - открываем через intent
        window.open('android-app://com.android.settings/.Settings$InputMethodAndLanguageSettingsActivity', '_system');
        updateStatus('Найдите ScriptableKeyboard в настройках');
    }
}

function showFloatingButton() {
    const btn = document.getElementById('floatingBtn');
    if (!floatingButtonVisible) {
        btn.style.display = 'block';
        floatingButtonVisible = true;
        updateStatus('Плавающая кнопка активна');
        
        // Делаем кнопку перетаскиваемой
        makeButtonDraggable(btn);
    } else {
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
    
    element.addEventListener('touchstart', function(e) {
        isDragging = true;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        initialX = element.offsetLeft;
        initialY = element.offsetTop;
        e.preventDefault();
    });
    
    element.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        
        const deltaX = currentX - startX;
        const deltaY = currentY - startY;
        
        element.style.left = (initialX + deltaX) + 'px';
        element.style.top = (initialY + deltaY) + 'px';
        element.style.right = 'auto';
        
        e.preventDefault();
    });
    
    element.addEventListener('touchend', function(e) {
        isDragging = false;
    });
}

function checkPermissions() {
    // Проверяем разрешение на отображение поверх других приложений
    if (typeof cordova !== 'undefined' && cordova.plugins && cordova.plugins.permissions) {
        const permissions = cordova.plugins.permissions;
        
        permissions.checkPermission('android.permission.SYSTEM_ALERT_WINDOW', 
            function(status) {
                if (status.hasPermission) {
                    updateStatus('Разрешения OK');
                } else {
                    updateStatus('Нужны разрешения - нажмите для настройки');
                }
            },
            function() {
                updateStatus('Ошибка проверки разрешений');
            }
        );
    }
}