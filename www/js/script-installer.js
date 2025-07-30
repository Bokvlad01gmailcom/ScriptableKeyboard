// Установщик скриптов через веб-сервер
const ScriptInstaller = {
    
    // Установка скрипта из веб-интерфейса
    installFromWeb(scriptData) {
        Debug.info('=== INSTALLING SCRIPT FROM WEB ===', scriptData);
        
        try {
            // Валидация данных скрипта
            if (!this.validateScript(scriptData)) {
                throw new Error('Invalid script data');
            }
            
            // Создание скрипта
            const script = {
                id: 'web_' + Date.now(),
                name: scriptData.name,
                icon: scriptData.icon || '📜',
                description: scriptData.description || 'Установлен через веб-интерфейс',
                code: scriptData.code,
                userCreated: true,
                installedFrom: 'web',
                installDate: new Date().toISOString()
            };
            
            // Добавление в систему скриптов
            ScriptManager.addScript(script);
            ScriptManager.saveUserScripts();
            
            Debug.info('Script installed successfully', script.name);
            
            // Уведомление пользователя
            KeyboardManager.showNotification(`Скрипт "${script.name}" установлен!`);
            
            return {
                success: true,
                scriptId: script.id,
                message: 'Script installed successfully'
            };
            
        } catch (e) {
            Debug.error('Script installation failed', e.message);
            return {
                success: false,
                error: e.message
            };
        }
    },
    
    // Валидация скрипта
    validateScript(scriptData) {
        if (!scriptData.name || typeof scriptData.name !== 'string') {
            throw new Error('Script name is required');
        }
        
        if (!scriptData.code || typeof scriptData.code !== 'string') {
            throw new Error('Script code is required');
        }
        
        if (scriptData.name.length > 50) {
            throw new Error('Script name too long');
        }
        
        if (scriptData.code.length > 10000) {
            throw new Error('Script code too long');
        }
        
        // Проверка на опасные функции
        const dangerousFunctions = [
            'eval(',
            'Function(',
            'setTimeout(',
            'setInterval(',
            'XMLHttpRequest',
            'fetch(',
            'import(',
            'require('
        ];
        
        const codeUpper = scriptData.code.toUpperCase();
        for (const dangerous of dangerousFunctions) {
            if (codeUpper.includes(dangerous.toUpperCase())) {
                Debug.warn('Script contains potentially dangerous function', dangerous);
                // Не блокируем, но предупреждаем
            }
        }
        
        return true;
    },
    
    // Получение списка установленных скриптов
    getInstalledScripts() {
        const scripts = ScriptManager.getAllScripts();
        return scripts.map(script => ({
            id: script.id,
            name: script.name,
            icon: script.icon,
            description: script.description,
            userCreated: script.userCreated,
            installedFrom: script.installedFrom,
            installDate: script.installDate
        }));
    },
    
    // Удаление скрипта
    uninstallScript(scriptId) {
        Debug.info('Uninstalling script', scriptId);
        
        const success = ScriptManager.deleteScript(scriptId);
        
        if (success) {
            Debug.info('Script uninstalled successfully');
            KeyboardManager.showNotification('Скрипт удален');
            return { success: true };
        } else {
            Debug.error('Failed to uninstall script');
            return { success: false, error: 'Script not found' };
        }
    },
    
    // Экспорт скрипта
    exportScript(scriptId) {
        const scripts = ScriptManager.getAllScripts();
        const script = scripts.find(s => s.id === scriptId);
        
        if (!script) {
            return { success: false, error: 'Script not found' };
        }
        
        return {
            success: true,
            script: {
                name: script.name,
                icon: script.icon,
                description: script.description,
                code: script.code,
                version: '1.0.0',
                author: 'User',
                exportDate: new Date().toISOString()
            }
        };
    },
    
    // Установка скрипта из файла
    installFromFile(fileContent) {
        try {
            const scriptData = JSON.parse(fileContent);
            return this.installFromWeb(scriptData);
        } catch (e) {
            Debug.error('Failed to parse script file', e.message);
            return { success: false, error: 'Invalid script file format' };
        }
    },
    
    // Получение примеров скриптов
    getExampleScripts() {
        return [
            {
                name: 'Текущая дата',
                icon: '📅',
                description: 'Вставляет текущую дату в формате ДД.ММ.ГГГГ',
                code: `
const now = new Date();
const day = String(now.getDate()).padStart(2, '0');
const month = String(now.getMonth() + 1).padStart(2, '0');
const year = now.getFullYear();
const dateString = \`\${day}.\${month}.\${year}\`;
KeyboardManager.typeText(dateString);
KeyboardManager.showNotification('Дата вставлена: ' + dateString);`
            },
            {
                name: 'Случайное число',
                icon: '🎲',
                description: 'Генерирует случайное число от 1 до 100',
                code: `
const randomNum = Math.floor(Math.random() * 100) + 1;
KeyboardManager.typeText(randomNum.toString());
KeyboardManager.showNotification('Случайное число: ' + randomNum);`
            },
            {
                name: 'Lorem Ipsum',
                icon: '📝',
                description: 'Вставляет текст Lorem Ipsum',
                code: `
const lorem = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
KeyboardManager.typeText(lorem);
KeyboardManager.showNotification('Lorem Ipsum вставлен');`
            },
            {
                name: 'Переводчик регистра',
                icon: '🔄',
                description: 'Переключает регистр последнего слова',
                code: `
// Получаем текст из буфера обмена
navigator.clipboard.readText().then(text => {
    if (text) {
        const words = text.split(' ');
        const lastWord = words[words.length - 1];
        const toggledWord = lastWord === lastWord.toUpperCase() ? 
            lastWord.toLowerCase() : lastWord.toUpperCase();
        
        words[words.length - 1] = toggledWord;
        const newText = words.join(' ');
        
        KeyboardManager.typeText(newText);
        KeyboardManager.showNotification('Регистр изменен: ' + toggledWord);
    }
}).catch(() => {
    KeyboardManager.showNotification('Нет текста в буфере обмена');
});`
            }
        ];
    }
};

// Глобальный доступ
window.ScriptInstaller = ScriptInstaller;