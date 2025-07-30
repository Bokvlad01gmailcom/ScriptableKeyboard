// Менеджер скриптов - система расширений
const ScriptManager = {
    scripts: [],
    
    // Инициализация
    init() {
        this.loadDefaultScripts();
        this.loadUserScripts();
        console.log('ScriptManager инициализирован');
    },
    
    // Загрузить встроенные скрипты
    loadDefaultScripts() {
        // Голосовой ввод
        this.addScript({
            id: 'voice_input',
            name: 'Голосовой ввод',
            icon: '🎤',
            description: 'Распознавание речи',
            code: `
                function voiceInput() {
                    if (typeof navigator.mediaDevices !== 'undefined') {
                        // Используем Web Speech API
                        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
                        recognition.lang = 'ru-RU';
                        recognition.onresult = function(event) {
                            const text = event.results[0][0].transcript;
                            KeyboardManager.typeText(text);
                        };
                        recognition.start();
                    } else {
                        // Fallback - открываем системный голосовой ввод
                        try {
                            cordova.exec(null, null, 'VoicePlugin', 'startVoiceInput', []);
                        } catch (e) {
                            KeyboardManager.showNotification('Голосовой ввод недоступен');
                        }
                    }
                }
                voiceInput();
            `
        });
        
        // Эмодзи
        this.addScript({
            id: 'emoji_panel',
            name: 'Панель эмодзи',
            icon: '😀',
            description: 'Быстрый доступ к эмодзи',
            code: `
                const emojis = ['😀', '😂', '😍', '🤔', '👍', '👎', '❤️', '🔥', '💯', '🎉'];
                const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                KeyboardManager.typeText(randomEmoji);
            `
        });
        
        // Текущее время
        this.addScript({
            id: 'current_time',
            name: 'Текущее время',
            icon: '🕐',
            description: 'Вставить текущее время',
            code: `
                const now = new Date();
                const timeString = now.toLocaleTimeString('ru-RU');
                KeyboardManager.typeText(timeString);
            `
        });
        
        // Генератор паролей
        this.addScript({
            id: 'password_generator',
            name: 'Генератор паролей',
            icon: '🔐',
            description: 'Создать случайный пароль',
            code: `
                function generatePassword(length = 12) {
                    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
                    let password = '';
                    for (let i = 0; i < length; i++) {
                        password += chars.charAt(Math.floor(Math.random() * chars.length));
                    }
                    return password;
                }
                const password = generatePassword();
                KeyboardManager.typeText(password);
                KeyboardManager.showNotification('Пароль сгенерирован: ' + password);
            `
        });
        
        // Калькулятор
        this.addScript({
            id: 'calculator',
            name: 'Калькулятор',
            icon: '🧮',
            description: 'Простой калькулятор',
            code: `
                const expression = prompt('Введите выражение (например: 2+2*3):');
                if (expression) {
                    try {
                        const result = eval(expression);
                        KeyboardManager.typeText(result.toString());
                        KeyboardManager.showNotification(expression + ' = ' + result);
                    } catch (e) {
                        KeyboardManager.showNotification('Ошибка в выражении');
                    }
                }
            `
        });
    },
    
    // Загрузить пользовательские скрипты
    loadUserScripts() {
        // Загружаем из localStorage
        const saved = localStorage.getItem('userScripts');
        if (saved) {
            try {
                const userScripts = JSON.parse(saved);
                userScripts.forEach(script => this.addScript(script));
            } catch (e) {
                console.log('Ошибка загрузки пользовательских скриптов');
            }
        }
    },
    
    // Добавить скрипт
    addScript(script) {
        // Проверяем, что скрипт не дублируется
        const existing = this.scripts.find(s => s.id === script.id);
        if (!existing) {
            this.scripts.push(script);
            console.log('Скрипт добавлен:', script.name);
        }
    },
    
    // Выполнить скрипт
    executeScript(scriptId) {
        const script = this.scripts.find(s => s.id === scriptId);
        if (script) {
            try {
                console.log('Выполняем скрипт:', script.name);
                // Выполняем код скрипта в безопасном контексте
                const func = new Function('KeyboardManager', 'ScriptManager', script.code);
                func(KeyboardManager, ScriptManager);
            } catch (e) {
                console.error('Ошибка выполнения скрипта:', e);
                KeyboardManager.showNotification('Ошибка в скрипте: ' + script.name);
            }
        }
    },
    
    // Получить все скрипты
    getAllScripts() {
        return this.scripts;
    },
    
    // Сохранить пользовательские скрипты
    saveUserScripts() {
        const userScripts = this.scripts.filter(s => s.userCreated);
        localStorage.setItem('userScripts', JSON.stringify(userScripts));
    },
    
    // Создать новый скрипт
    createScript(name, code, icon = '📜') {
        const script = {
            id: 'user_' + Date.now(),
            name: name,
            icon: icon,
            description: 'Пользовательский скрипт',
            code: code,
            userCreated: true
        };
        
        this.addScript(script);
        this.saveUserScripts();
        return script;
    },
    
    // Удалить скрипт
    deleteScript(scriptId) {
        const index = this.scripts.findIndex(s => s.id === scriptId);
        if (index !== -1) {
            this.scripts.splice(index, 1);
            this.saveUserScripts();
            return true;
        }
        return false;
    },
    
    // Добавить скрипты в клавиатуру
    addScriptsToKeyboard() {
        // Добавляем ряд со скриптами в клавиатуру
        const scriptRow = this.scripts.slice(0, 5).map(script => ({
            text: script.icon,
            action: 'script',
            script: script.id,
            style: 'background: #9b59b6; color: white;'
        }));
        
        return scriptRow;
    }
};