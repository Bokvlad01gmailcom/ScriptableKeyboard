var exec = require('cordova/exec');

var KeyboardPlugin = {
    
    // Ввод текста через InputMethodService
    typeText: function(text, success, error) {
        exec(success, error, 'KeyboardPlugin', 'typeText', [text]);
    },
    
    // Отправка Backspace
    sendBackspace: function(success, error) {
        exec(success, error, 'KeyboardPlugin', 'sendBackspace', []);
    },
    
    // Отправка Enter
    sendEnter: function(success, error) {
        exec(success, error, 'KeyboardPlugin', 'sendEnter', []);
    },
    
    // Открыть настройки клавиатуры
    openKeyboardSettings: function(success, error) {
        exec(success, error, 'KeyboardPlugin', 'openKeyboardSettings', []);
    },
    
    // Проверить статус клавиатуры
    isKeyboardEnabled: function(success, error) {
        exec(success, error, 'KeyboardPlugin', 'isKeyboardEnabled', []);
    },
    
    // Запросить разрешения
    requestPermissions: function(success, error) {
        exec(success, error, 'KeyboardPlugin', 'requestPermissions', []);
    }
};

module.exports = KeyboardPlugin;