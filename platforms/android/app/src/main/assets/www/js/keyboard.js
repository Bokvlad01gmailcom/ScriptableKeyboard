// Менеджер клавиатуры
const KeyboardManager = {
    isVisible: false,
    currentLayout: 'default',
    
    // Показать клавиатуру
    show() {
        Debug.info('=== KEYBOARD SHOW ===');
        if (this.isVisible) {
            Debug.warn('Keyboard already visible');
            return;
        }
        
        this.createKeyboard();
        this.isVisible = true;
        Debug.info('Клавиатура показана');
    },
    
    // Скрыть клавиатуру
    hide() {
        const keyboard = document.getElementById('virtualKeyboard');
        if (keyboard) {
            keyboard.remove();
        }
        this.isVisible = false;
        console.log('Клавиатура скрыта');
    },
    
    // Создать виртуальную клавиатуру
    createKeyboard() {
        const keyboard = document.createElement('div');
        keyboard.id = 'virtualKeyboard';
        keyboard.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(0, 0, 0, 0.9);
            padding: 10px;
            z-index: 9999;
            border-top: 1px solid #333;
        `;
        
        // Создаем ряды клавиш
        const layouts = this.getKeyboardLayout();
        
        layouts.forEach(row => {
            const rowDiv = document.createElement('div');
            rowDiv.style.cssText = `
                display: flex;
                justify-content: center;
                margin: 2px 0;
            `;
            
            row.forEach(key => {
                const button = this.createKey(key);
                rowDiv.appendChild(button);
            });
            
            keyboard.appendChild(rowDiv);
        });
        
        // Добавляем кнопку закрытия
        const closeBtn = this.createKey({
            text: '🔽',
            action: 'close',
            style: 'background: #ff4444; width: 100%;'
        });
        keyboard.appendChild(closeBtn);
        
        document.body.appendChild(keyboard);
    },
    
    // Создать клавишу
    createKey(keyData) {
        const button = document.createElement('button');
        button.textContent = keyData.text || keyData;
        button.style.cssText = `
            margin: 2px;
            padding: 10px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 5px;
            color: white;
            font-size: 16px;
            min-width: 40px;
            cursor: pointer;
            ${keyData.style || ''}
        `;
        
        button.addEventListener('click', () => {
            this.handleKeyPress(keyData);
        });
        
        // Эффект нажатия
        button.addEventListener('touchstart', () => {
            button.style.background = 'rgba(255, 255, 255, 0.3)';
        });
        
        button.addEventListener('touchend', () => {
            button.style.background = 'rgba(255, 255, 255, 0.1)';
        });
        
        return button;
    },
    
    // Обработка нажатия клавиши
    handleKeyPress(keyData) {
        const action = keyData.action || 'type';
        const value = keyData.value || keyData.text || keyData;
        
        Debug.info('Key pressed', { action, value });
        
        switch (action) {
            case 'type':
                this.typeText(value);
                break;
            case 'backspace':
                this.sendBackspace();
                break;
            case 'enter':
                this.sendEnter();
                break;
            case 'space':
                this.typeText(' ');
                break;
            case 'close':
                this.hide();
                break;
            case 'script':
                // Выполнить скрипт
                ScriptManager.executeScript(keyData.script);
                break;
            default:
                this.typeText(value);
        }
    },
    
    // Ввод текста
    typeText(text) {
        // Используем разные методы в зависимости от доступности
        if (typeof cordova !== 'undefined') {
            // Через Cordova плагин
            this.typeTextNative(text);
        } else {
            // Через буфер обмена (fallback)
            this.typeTextClipboard(text);
        }
    },
    
    // Нативный ввод текста
    typeTextNative(text) {
        Debug.info('Trying native text input', text);
        try {
            if (typeof KeyboardPlugin !== 'undefined') {
                KeyboardPlugin.typeText(text,
                    function(success) {
                        Debug.info('Native text input success', success);
                    },
                    function(error) {
                        Debug.warn('Native text input failed, using clipboard', error);
                        KeyboardManager.typeTextClipboard(text);
                    }
                );
            } else {
                Debug.warn('KeyboardPlugin not available, using clipboard');
                this.typeTextClipboard(text);
            }
        } catch (e) {
            Debug.error('Exception in native text input', e);
            this.typeTextClipboard(text);
        }
    },
    
    // Ввод через буфер обмена
    typeTextClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                console.log('Текст скопирован в буфер:', text);
                // Показываем уведомление пользователю
                this.showNotification('Скопировано: ' + text);
            });
        }
    },
    
    // Отправка Backspace
    sendBackspace() {
        Debug.info('Sending backspace');
        try {
            if (typeof KeyboardPlugin !== 'undefined') {
                KeyboardPlugin.sendBackspace(
                    function(success) {
                        Debug.info('Backspace sent successfully', success);
                    },
                    function(error) {
                        Debug.error('Backspace failed', error);
                        KeyboardManager.showNotification('Backspace недоступен');
                    }
                );
            } else {
                Debug.warn('KeyboardPlugin not available for backspace');
                this.showNotification('Backspace недоступен');
            }
        } catch (e) {
            Debug.error('Exception sending backspace', e);
            this.showNotification('Ошибка backspace: ' + e.message);
        }
    },
    
    // Отправка Enter
    sendEnter() {
        Debug.info('Sending enter');
        try {
            if (typeof KeyboardPlugin !== 'undefined') {
                KeyboardPlugin.sendEnter(
                    function(success) {
                        Debug.info('Enter sent successfully', success);
                    },
                    function(error) {
                        Debug.error('Enter failed', error);
                        KeyboardManager.showNotification('Enter недоступен');
                    }
                );
            } else {
                Debug.warn('KeyboardPlugin not available for enter');
                this.showNotification('Enter недоступен');
            }
        } catch (e) {
            Debug.error('Exception sending enter', e);
            this.showNotification('Ошибка enter: ' + e.message);
        }
    },
    
    // Показать уведомление
    showNotification(text) {
        const notification = document.createElement('div');
        notification.textContent = text;
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 10000;
            font-size: 14px;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 2000);
    },
    
    // Получить раскладку клавиатуры
    getKeyboardLayout() {
        // Базовая раскладка - можно расширять через скрипты
        return [
            ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
            ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
            ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
            ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
            [
                { text: '⌫', action: 'backspace', style: 'background: #ff6b6b;' },
                { text: '␣', action: 'space', style: 'flex: 2; background: #4ecdc4;' },
                { text: '⏎', action: 'enter', style: 'background: #45b7d1;' }
            ]
        ];
    }
};