// Система отладки для ScriptableKeyboard
const Debug = {
    logs: [],
    maxLogs: 100,
    
    // Добавить лог
    log(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            data: data ? JSON.stringify(data) : null
        };
        
        this.logs.unshift(logEntry);
        if (this.logs.length > this.maxLogs) {
            this.logs.pop();
        }
        
        // Показать в консоли
        console.log(`[${level}] ${message}`, data || '');
        
        // Показать в UI если есть debug панель
        this.updateDebugPanel();
        
        // Сохранить в localStorage
        this.saveLogs();
    },
    
    info(message, data) { this.log('INFO', message, data); },
    warn(message, data) { this.log('WARN', message, data); },
    error(message, data) { this.log('ERROR', message, data); },
    debug(message, data) { this.log('DEBUG', message, data); },
    
    // Показать debug панель
    showDebugPanel() {
        if (document.getElementById('debugPanel')) return;
        
        const panel = document.createElement('div');
        panel.id = 'debugPanel';
        panel.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            width: 90%;
            height: 400px;
            background: rgba(0,0,0,0.9);
            color: #00ff00;
            font-family: monospace;
            font-size: 11px;
            padding: 10px;
            border: 1px solid #333;
            border-radius: 5px;
            z-index: 10000;
            overflow-y: auto;
        `;
        
        const header = document.createElement('div');
        header.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>🐛 Debug Console</span>
                <div>
                    <button onclick="Debug.clearLogs()" style="margin-right: 5px; padding: 3px 6px; font-size: 10px;">Clear</button>
                    <button onclick="sendLogsToTermux()" style="margin-right: 5px; padding: 3px 6px; font-size: 10px;">Send</button>
                    <button onclick="Debug.hideDebugPanel()" style="padding: 3px 6px; font-size: 10px;">✕</button>
                </div>
            </div>
            <div style="margin-bottom: 10px;">
                <input type="text" id="debugCommand" placeholder="Enter command..." style="width: 70%; padding: 3px; background: #222; color: #0f0; border: 1px solid #333; font-size: 10px;">
                <button onclick="Debug.executeCommand()" style="padding: 3px 6px; font-size: 10px;">Run</button>
            </div>
            <div style="margin-bottom: 10px; font-size: 10px;">
                <button onclick="Debug.addScript()" style="margin: 2px; padding: 2px 4px;">+ Script</button>
                <button onclick="Debug.listScripts()" style="margin: 2px; padding: 2px 4px;">List</button>
                <button onclick="Debug.testEnter()" style="margin: 2px; padding: 2px 4px;">Test Enter</button>
                <button onclick="Debug.checkButton()" style="margin: 2px; padding: 2px 4px;">Check Button</button>
            </div>
        `;
        
        const content = document.createElement('div');
        content.id = 'debugContent';
        content.style.height = '250px';
        content.style.overflowY = 'auto';
        
        panel.appendChild(header);
        panel.appendChild(content);
        document.body.appendChild(panel);
        
        // Enter для выполнения команд
        document.getElementById('debugCommand').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.executeCommand();
        });
        
        this.updateDebugPanel();
    },
    
    // Выполнить команду
    executeCommand() {
        const input = document.getElementById('debugCommand');
        const command = input.value.trim();
        if (!command) return;
        
        this.info('> ' + command);
        
        try {
            const result = eval(command);
            this.info('Result: ' + (result !== undefined ? result : 'undefined'));
        } catch (e) {
            this.error('Error: ' + e.message);
        }
        
        input.value = '';
    },
    
    // Добавить скрипт
    addScript() {
        const name = prompt('Script name:');
        if (!name) return;
        
        const code = prompt('Script code:');
        if (!code) return;
        
        const script = ScriptManager.createScript(name, code, '📜');
        this.info('Script created: ' + script.id);
    },
    
    // Список скриптов
    listScripts() {
        const scripts = ScriptManager.getAllScripts();
        this.info('=== SCRIPTS ===');
        scripts.forEach(script => {
            this.info(`${script.icon} ${script.name} (${script.id})`);
        });
    },
    
    // Тест Enter
    testEnter() {
        this.info('Testing Enter key...');
        if (typeof KeyboardPlugin !== 'undefined') {
            KeyboardPlugin.sendEnter(
                () => this.info('Enter sent successfully'),
                (e) => this.error('Enter failed: ' + e)
            );
        } else {
            this.error('KeyboardPlugin not available');
        }
    },
    
    // Проверка кнопки
    checkButton() {
        this.info('Checking floating button...');
        this.info('floatingButtonVisible: ' + floatingButtonVisible);
        this.info('Button element: ' + !!document.getElementById('floatingBtn'));
    },
    
    // Скрыть debug панель
    hideDebugPanel() {
        const panel = document.getElementById('debugPanel');
        if (panel) panel.remove();
    },
    
    // Обновить содержимое debug панели
    updateDebugPanel() {
        const content = document.getElementById('debugContent');
        if (!content) return;
        
        content.innerHTML = this.logs.map(log => {
            const color = {
                'ERROR': '#ff4444',
                'WARN': '#ffaa00', 
                'INFO': '#44ff44',
                'DEBUG': '#4444ff'
            }[log.level] || '#ffffff';
            
            return `
                <div style="color: ${color}; margin-bottom: 2px;">
                    <span style="color: #888;">[${log.timestamp.split('T')[1].split('.')[0]}]</span>
                    <span style="color: ${color};">[${log.level}]</span>
                    ${log.message}
                    ${log.data ? `<br><span style="color: #ccc; margin-left: 20px;">${log.data}</span>` : ''}
                </div>
            `;
        }).join('');
        
        content.scrollTop = 0;
    },
    
    // Очистить логи
    clearLogs() {
        this.logs = [];
        this.updateDebugPanel();
        this.saveLogs();
    },
    
    // Экспорт логов
    exportLogs() {
        const logsText = this.logs.map(log => 
            `[${log.timestamp}] [${log.level}] ${log.message}${log.data ? '\n  Data: ' + log.data : ''}`
        ).join('\n');
        
        const blob = new Blob([logsText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `keyboard-debug-${new Date().toISOString().split('T')[0]}.log`;
        a.click();
        URL.revokeObjectURL(url);
    },
    
    // Сохранить логи в localStorage
    saveLogs() {
        try {
            localStorage.setItem('keyboard_debug_logs', JSON.stringify(this.logs.slice(0, 50)));
        } catch (e) {
            console.warn('Не удалось сохранить логи:', e);
        }
    },
    
    // Загрузить логи из localStorage
    loadLogs() {
        try {
            const saved = localStorage.getItem('keyboard_debug_logs');
            if (saved) {
                this.logs = JSON.parse(saved);
            }
        } catch (e) {
            console.warn('Не удалось загрузить логи:', e);
        }
    },
    
    // Проверка системы
    checkSystem() {
        this.info('=== SYSTEM CHECK ===');
        this.info('User Agent', navigator.userAgent);
        this.info('Platform', navigator.platform);
        this.info('Cordova', typeof cordova !== 'undefined' ? 'Available' : 'Not Available');
        this.info('Device Ready', document.readyState);
        
        // Проверка разрешений
        this.checkPermissions();
        
        // Проверка плагинов
        this.checkPlugins();
    },
    
    // Проверка разрешений
    checkPermissions() {
        this.info('=== PERMISSIONS CHECK ===');
        
        // Проверка overlay permission
        if (typeof cordova !== 'undefined' && cordova.plugins && cordova.plugins.permissions) {
            cordova.plugins.permissions.checkPermission(
                'android.permission.SYSTEM_ALERT_WINDOW',
                (status) => {
                    this.info('SYSTEM_ALERT_WINDOW', status.hasPermission ? 'GRANTED' : 'DENIED');
                },
                (error) => {
                    this.error('Permission check failed', error);
                }
            );
        } else {
            this.warn('Permissions plugin not available');
        }
    },
    
    // Проверка плагинов
    checkPlugins() {
        this.info('=== PLUGINS CHECK ===');
        
        const plugins = [
            'KeyboardPlugin',
            'device',
            'file'
        ];
        
        plugins.forEach(plugin => {
            if (typeof window[plugin] !== 'undefined') {
                this.info(`Plugin ${plugin}`, 'Available');
            } else {
                this.warn(`Plugin ${plugin}`, 'Not Available');
            }
        });
    }
};

// Загрузить логи при старте
Debug.loadLogs();

// Глобальный доступ
window.Debug = Debug;