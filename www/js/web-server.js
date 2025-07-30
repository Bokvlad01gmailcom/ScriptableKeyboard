// Простой веб-сервер для удаленной отладки
const WebServer = {
    isRunning: false,
    port: 8888,
    
    // Запуск веб-сервера
    start() {
        Debug.info('=== STARTING WEB SERVER ===');
        
        if (this.isRunning) {
            Debug.warn('Web server already running');
            return;
        }
        
        try {
            // Используем Cordova HTTP сервер плагин если доступен
            if (typeof cordova !== 'undefined' && cordova.plugins && cordova.plugins.httpd) {
                this.startHttpdServer();
            } else {
                // Fallback - создаем простой сервер через Service Worker
                this.startServiceWorkerServer();
            }
        } catch (e) {
            Debug.error('Failed to start web server', e);
            this.createLocalInterface();
        }
    },
    
    // Запуск через Cordova HTTPD плагин
    startHttpdServer() {
        Debug.info('Starting HTTPD server');
        
        const options = {
            www_root: 'www',
            port: this.port,
            localhost_only: false
        };
        
        cordova.plugins.httpd.startServer(options, 
            (url) => {
                Debug.info('HTTPD server started', url);
                this.isRunning = true;
                this.showServerInfo(url);
            },
            (error) => {
                Debug.error('HTTPD server failed', error);
                this.createLocalInterface();
            }
        );
    },
    
    // Fallback - Service Worker сервер
    startServiceWorkerServer() {
        Debug.info('Starting Service Worker server');
        
        // Регистрируем Service Worker для обработки запросов
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/debug-sw.js')
                .then((registration) => {
                    Debug.info('Service Worker registered', registration);
                    this.createServiceWorker();
                    this.isRunning = true;
                    this.showServerInfo(`http://localhost:${this.port}`);
                })
                .catch((error) => {
                    Debug.error('Service Worker registration failed', error);
                    this.createLocalInterface();
                });
        } else {
            this.createLocalInterface();
        }
    },
    
    // Создание Service Worker
    createServiceWorker() {
        const swCode = `
            self.addEventListener('fetch', function(event) {
                if (event.request.url.includes('/debug')) {
                    event.respondWith(
                        new Response(getDebugHTML(), {
                            headers: {'Content-Type': 'text/html'}
                        })
                    );
                } else if (event.request.url.includes('/api/logs')) {
                    event.respondWith(
                        new Response(JSON.stringify(getLogs()), {
                            headers: {'Content-Type': 'application/json'}
                        })
                    );
                }
            });
            
            function getDebugHTML() {
                return \`${this.getDebugPageHTML()}\`;
            }
            
            function getLogs() {
                return {logs: [], status: 'active'};
            }
        `;
        
        // Создаем blob URL для Service Worker
        const blob = new Blob([swCode], {type: 'application/javascript'});
        const swUrl = URL.createObjectURL(blob);
        
        // Сохраняем для очистки
        this.swUrl = swUrl;
    },
    
    // Создание локального интерфейса
    createLocalInterface() {
        Debug.info('Creating local debug interface');
        
        // Создаем кнопку для открытия отладки
        const debugBtn = document.createElement('button');
        debugBtn.innerHTML = '🌐 Open Debug';
        debugBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #0f0;
            color: #000;
            border: none;
            padding: 15px;
            border-radius: 50px;
            font-weight: bold;
            cursor: pointer;
            z-index: 9998;
            box-shadow: 0 4px 12px rgba(0,255,0,0.3);
        `;
        
        debugBtn.onclick = () => this.openLocalDebug();
        document.body.appendChild(debugBtn);
        
        this.isRunning = true;
        this.showServerInfo('Local Interface');
    },
    
    // Открытие локального интерфейса отладки
    openLocalDebug() {
        const debugWindow = window.open('', 'debug', 'width=800,height=600');
        debugWindow.document.write(this.getDebugPageHTML());
        debugWindow.document.close();
        
        // Настраиваем связь с основным окном
        this.setupDebugWindow(debugWindow);
    },
    
    // Настройка связи с окном отладки
    setupDebugWindow(debugWindow) {
        // Отправляем логи в окно отладки
        const sendLogs = () => {
            if (debugWindow && !debugWindow.closed) {
                debugWindow.postMessage({
                    type: 'logs',
                    logs: Debug.logs
                }, '*');
            }
        };
        
        // Периодическая отправка логов
        const interval = setInterval(sendLogs, 1000);
        
        // Обработка команд от окна отладки
        window.addEventListener('message', (event) => {
            if (event.source === debugWindow) {
                if (event.data.type === 'command') {
                    this.executeRemoteCommand(event.data.command, debugWindow);
                }
            }
        });
        
        // Очистка при закрытии окна
        debugWindow.addEventListener('beforeunload', () => {
            clearInterval(interval);
        });
        
        // Отправляем начальные логи
        setTimeout(sendLogs, 500);
    },
    
    // Выполнение удаленной команды
    executeRemoteCommand(command, targetWindow) {
        Debug.info('Executing remote command', command);
        
        try {
            const result = eval(command);
            Debug.info('Remote command result', result);
            
            if (targetWindow && !targetWindow.closed) {
                targetWindow.postMessage({
                    type: 'result',
                    command: command,
                    result: String(result),
                    success: true
                }, '*');
            }
        } catch (e) {
            Debug.error('Remote command failed', e.message);
            
            if (targetWindow && !targetWindow.closed) {
                targetWindow.postMessage({
                    type: 'result',
                    command: command,
                    result: e.message,
                    success: false
                }, '*');
            }
        }
    },
    
    // HTML страница отладки
    getDebugPageHTML() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>ScriptableKeyboard Remote Debug</title>
    <meta charset="utf-8">
    <style>
        body { font-family: monospace; background: #000; color: #0f0; margin: 0; padding: 20px; }
        .header { background: #111; padding: 15px; margin-bottom: 20px; border-radius: 5px; border: 1px solid #333; }
        .controls { background: #111; padding: 15px; margin-bottom: 20px; border-radius: 5px; border: 1px solid #333; }
        .log-container { height: 400px; overflow-y: auto; background: #111; padding: 15px; border-radius: 5px; border: 1px solid #333; }
        .log { margin: 3px 0; padding: 3px 8px; border-radius: 3px; }
        .error { color: #f44; background: rgba(255,68,68,0.1); border-left: 3px solid #f44; }
        .warn { color: #fa0; background: rgba(255,170,0,0.1); border-left: 3px solid #fa0; }
        .info { color: #4af; background: rgba(68,170,255,0.1); border-left: 3px solid #4af; }
        .debug { color: #0f0; background: rgba(0,255,0,0.05); border-left: 3px solid #0f0; }
        button { background: #333; color: #0f0; border: 1px solid #0f0; padding: 8px 12px; margin: 3px; cursor: pointer; border-radius: 3px; }
        button:hover { background: #0f0; color: #000; }
        .command-input { width: 70%; background: #222; color: #0f0; border: 1px solid #333; padding: 10px; border-radius: 3px; }
        .status { padding: 10px; background: #222; border-radius: 3px; margin: 10px 0; border: 1px solid #333; }
        .timestamp { color: #888; font-size: 0.9em; }
        .command-result { background: rgba(0,255,255,0.1); border-left: 3px solid #0ff; color: #0ff; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🐛 ScriptableKeyboard Remote Debug</h1>
        <div class="status" id="status">🔄 Подключение к приложению...</div>
        <div id="deviceInfo"></div>
    </div>
    
    <div class="controls">
        <h3>🔧 Quick Commands:</h3>
        <button onclick="sendCommand('Debug.checkSystem()')">🔍 System Check</button>
        <button onclick="sendCommand('checkPermissions()')">🔐 Permissions</button>
        <button onclick="sendCommand('showFloatingButton()')">🎯 Show Button</button>
        <button onclick="sendCommand('KeyboardManager.show()')">⌨️ Show Keyboard</button>
        <button onclick="sendCommand('Debug.clearLogs()')">🧹 Clear Logs</button>
        <button onclick="refreshLogs()">🔄 Refresh</button>
        
        <div style="margin-top: 15px;">
            <input type="text" class="command-input" id="commandInput" placeholder="Введите JavaScript команду для выполнения в приложении..." onkeypress="if(event.key==='Enter') executeCommand()">
            <button onclick="executeCommand()">▶️ Execute</button>
        </div>
    </div>
    
    <div class="log-container" id="logs">
        <div class="debug">🔄 Ожидание логов от приложения...</div>
    </div>
    
    <script>
        let logs = [];
        let connected = false;
        
        // Обработка сообщений от основного окна
        window.addEventListener('message', function(event) {
            if (event.data.type === 'logs') {
                logs = event.data.logs;
                updateLogs();
                if (!connected) {
                    connected = true;
                    document.getElementById('status').innerHTML = '✅ Подключено к ScriptableKeyboard';
                }
            } else if (event.data.type === 'result') {
                addCommandResult(event.data);
            }
        });
        
        function updateLogs() {
            const container = document.getElementById('logs');
            container.innerHTML = logs.map(log => {
                const className = log.level.toLowerCase();
                const time = log.timestamp.split('T')[1].split('.')[0];
                return \`<div class="log \${className}">
                    <span class="timestamp">[\${time}]</span> 
                    <strong>[\${log.level}]</strong> 
                    \${log.message}
                    \${log.data ? '<br><span style="margin-left:20px;color:#ccc;font-size:0.9em;">' + log.data + '</span>' : ''}
                </div>\`;
            }).join('');
            container.scrollTop = container.scrollHeight;
        }
        
        function addCommandResult(data) {
            const container = document.getElementById('logs');
            const time = new Date().toTimeString().split(' ')[0];
            const resultClass = data.success ? 'info' : 'error';
            const resultIcon = data.success ? '✅' : '❌';
            
            const resultHtml = \`<div class="log command-result">
                <span class="timestamp">[\${time}]</span> 
                <strong>[RESULT]</strong> \${resultIcon}
                <br><span style="color:#ccc;">Command:</span> <code>\${data.command}</code>
                <br><span style="color:#ccc;">Result:</span> <span class="\${resultClass}">\${data.result}</span>
            </div>\`;
            
            container.innerHTML += resultHtml;
            container.scrollTop = container.scrollHeight;
        }
        
        function sendCommand(command) {
            if (window.opener) {
                window.opener.postMessage({type: 'command', command: command}, '*');
                addLog('SENT', 'Command sent: ' + command);
            } else {
                addLog('ERROR', 'No connection to main window');
            }
        }
        
        function executeCommand() {
            const input = document.getElementById('commandInput');
            const command = input.value.trim();
            if (command) {
                sendCommand(command);
                input.value = '';
            }
        }
        
        function refreshLogs() {
            if (window.opener) {
                window.opener.postMessage({type: 'requestLogs'}, '*');
            }
        }
        
        function addLog(level, message) {
            const timestamp = new Date().toISOString();
            logs.unshift({timestamp, level, message});
            updateLogs();
        }
        
        // Автообновление каждые 2 секунды
        setInterval(function() {
            if (connected && window.opener && !window.opener.closed) {
                // Проверяем соединение
            } else if (!window.opener || window.opener.closed) {
                document.getElementById('status').innerHTML = '❌ Соединение с приложением потеряно';
                connected = false;
            }
        }, 2000);
        
        // Показываем информацию о подключении
        setTimeout(function() {
            if (!connected) {
                document.getElementById('status').innerHTML = '⚠️ Убедитесь что приложение ScriptableKeyboard запущено';
            }
        }, 5000);
    </script>
</body>
</html>`;
    },
    
    // Показ информации о сервере
    showServerInfo(url) {
        const info = document.createElement('div');
        info.id = 'webServerInfo';
        info.style.cssText = `
            position: fixed;
            top: 50px;
            right: 10px;
            background: rgba(0,0,0,0.95);
            color: #0f0;
            padding: 15px;
            border: 2px solid #0f0;
            border-radius: 8px;
            font-family: monospace;
            font-size: 12px;
            z-index: 10002;
            max-width: 280px;
            box-shadow: 0 4px 20px rgba(0,255,0,0.3);
        `;
        
        info.innerHTML = `
            <div style="margin-bottom: 10px; font-weight: bold;">
                🌐 Remote Debug Server
            </div>
            <div>Status: <span style="color: #4f4;">Running</span></div>
            <div>URL: ${url}</div>
            <div style="margin: 10px 0; padding: 8px; background: rgba(0,255,0,0.1); border-radius: 4px; font-size: 10px;">
                💡 Откройте Debug Console в браузере на компьютере для удаленной отладки
            </div>
            <div style="margin-top: 10px;">
                <button onclick="WebServer.openLocalDebug()" style="background: #0f0; color: #000; border: none; padding: 5px 8px; cursor: pointer; border-radius: 3px; font-size: 10px;">
                    Open Debug
                </button>
                <button onclick="WebServer.stop()" style="background: #f44; color: #fff; border: none; padding: 5px 8px; cursor: pointer; border-radius: 3px; margin-left: 5px; font-size: 10px;">
                    Stop
                </button>
            </div>
        `;
        
        document.body.appendChild(info);
        
        // Автоскрытие через 15 секунд
        setTimeout(() => {
            if (info.parentNode) {
                info.style.opacity = '0.7';
                info.style.transform = 'scale(0.9)';
            }
        }, 15000);
    },
    
    // Остановка сервера
    stop() {
        Debug.info('Stopping web server');
        
        if (typeof cordova !== 'undefined' && cordova.plugins && cordova.plugins.httpd) {
            cordova.plugins.httpd.stopServer();
        }
        
        if (this.swUrl) {
            URL.revokeObjectURL(this.swUrl);
        }
        
        this.isRunning = false;
        
        const info = document.getElementById('webServerInfo');
        if (info) info.remove();
        
        const debugBtn = document.querySelector('button[onclick*="openLocalDebug"]');
        if (debugBtn && debugBtn.parentNode) debugBtn.parentNode.remove();
    }
};

// Глобальный доступ
window.WebServer = WebServer;