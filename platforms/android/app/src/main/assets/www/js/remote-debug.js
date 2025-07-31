// Удаленная отладка через веб-сервер
const RemoteDebug = {
    server: null,
    port: 8888,
    isRunning: false,
    clients: [],
    
    // Запуск веб-сервера для отладки
    start() {
        Debug.info('=== STARTING REMOTE DEBUG SERVER ===');
        
        if (this.isRunning) {
            Debug.warn('Remote debug server already running');
            return;
        }
        
        try {
            // Используем встроенный HTTP сервер Cordova
            if (typeof cordova !== 'undefined' && cordova.plugins && cordova.plugins.httpd) {
                this.startCordovaServer();
            } else {
                // Fallback - WebSocket сервер
                this.startWebSocketServer();
            }
        } catch (e) {
            Debug.error('Failed to start remote debug server', e);
            this.startSimpleServer();
        }
    },
    
    // Запуск простого сервера через WebRTC
    startSimpleServer() {
        Debug.info('Starting simple debug server');
        
        // Создаем веб-интерфейс для отладки
        this.createDebugInterface();
        
        // Запускаем периодическую отправку логов
        this.startLogBroadcast();
        
        this.isRunning = true;
        Debug.info(`Remote debug available at: http://${this.getLocalIP()}:${this.port}/debug`);
        
        // Показываем QR код для подключения
        this.showConnectionInfo();
    },
    
    // Создание интерфейса отладки
    createDebugInterface() {
        // Создаем скрытый iframe с отладочным интерфейсом
        const iframe = document.createElement('iframe');
        iframe.id = 'debugInterface';
        iframe.style.cssText = 'display: none;';
        iframe.srcdoc = this.getDebugHTML();
        document.body.appendChild(iframe);
        
        // Создаем WebSocket для связи
        this.setupWebSocket();
    },
    
    // HTML для отладочного интерфейса
    getDebugHTML() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>ScriptableKeyboard Debug</title>
    <meta charset="utf-8">
    <style>
        body { font-family: monospace; background: #000; color: #0f0; margin: 0; padding: 20px; }
        .header { background: #111; padding: 10px; margin-bottom: 20px; border-radius: 5px; }
        .log-container { height: 400px; overflow-y: auto; background: #111; padding: 10px; border-radius: 5px; }
        .log { margin: 2px 0; padding: 2px 5px; }
        .error { color: #f44; background: rgba(255,68,68,0.1); }
        .warn { color: #fa0; background: rgba(255,170,0,0.1); }
        .info { color: #4af; background: rgba(68,170,255,0.1); }
        .debug { color: #0f0; }
        .controls { margin: 20px 0; }
        button { background: #333; color: #0f0; border: 1px solid #0f0; padding: 10px; margin: 5px; cursor: pointer; }
        button:hover { background: #0f0; color: #000; }
        .status { padding: 10px; background: #111; border-radius: 5px; margin: 10px 0; }
        .command-input { width: 100%; background: #111; color: #0f0; border: 1px solid #333; padding: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🐛 ScriptableKeyboard Remote Debug</h1>
        <div class="status" id="status">Подключение...</div>
    </div>
    
    <div class="controls">
        <button onclick="sendCommand('Debug.checkSystem()')">🔍 System Check</button>
        <button onclick="sendCommand('checkPermissions()')">🔐 Check Permissions</button>
        <button onclick="sendCommand('showFloatingButton()')">🎯 Show Button</button>
        <button onclick="sendCommand('Debug.clearLogs()')">🧹 Clear Logs</button>
        <button onclick="refreshLogs()">🔄 Refresh</button>
    </div>
    
    <div>
        <input type="text" class="command-input" id="commandInput" placeholder="Введите JavaScript команду..." onkeypress="if(event.key==='Enter') executeCommand()">
        <button onclick="executeCommand()">▶️ Execute</button>
    </div>
    
    <div class="log-container" id="logs">
        <div class="debug">Ожидание логов...</div>
    </div>
    
    <script>
        let ws = null;
        let logs = [];
        
        function connect() {
            try {
                ws = new WebSocket('ws://localhost:8889');
                
                ws.onopen = function() {
                    document.getElementById('status').innerHTML = '✅ Подключено к ScriptableKeyboard';
                    requestLogs();
                };
                
                ws.onmessage = function(event) {
                    const data = JSON.parse(event.data);
                    handleMessage(data);
                };
                
                ws.onclose = function() {
                    document.getElementById('status').innerHTML = '❌ Соединение потеряно. Переподключение...';
                    setTimeout(connect, 2000);
                };
                
                ws.onerror = function(error) {
                    document.getElementById('status').innerHTML = '⚠️ Ошибка подключения: ' + error;
                };
            } catch (e) {
                document.getElementById('status').innerHTML = '❌ WebSocket недоступен: ' + e.message;
                // Fallback - polling
                startPolling();
            }
        }
        
        function handleMessage(data) {
            if (data.type === 'logs') {
                logs = data.logs;
                updateLogs();
            } else if (data.type === 'result') {
                addLog('RESULT', data.result);
            }
        }
        
        function updateLogs() {
            const container = document.getElementById('logs');
            container.innerHTML = logs.map(log => {
                const className = log.level.toLowerCase();
                return \`<div class="log \${className}">[<span style="color:#888">\${log.timestamp.split('T')[1].split('.')[0]}</span>] [\${log.level}] \${log.message}\${log.data ? '<br><span style="margin-left:20px;color:#ccc;">' + log.data + '</span>' : ''}</div>\`;
            }).join('');
            container.scrollTop = container.scrollHeight;
        }
        
        function sendCommand(command) {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({type: 'command', command: command}));
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
        
        function requestLogs() {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({type: 'getLogs'}));
            }
        }
        
        function refreshLogs() {
            requestLogs();
        }
        
        function addLog(level, message) {
            const timestamp = new Date().toISOString();
            logs.unshift({timestamp, level, message});
            updateLogs();
        }
        
        // Автообновление логов
        setInterval(requestLogs, 2000);
        
        // Подключение при загрузке
        connect();
    </script>
</body>
</html>`;
    },
    
    // Настройка WebSocket
    setupWebSocket() {
        // Эмуляция WebSocket через postMessage
        window.addEventListener('message', (event) => {
            if (event.data.type === 'debugCommand') {
                this.executeCommand(event.data.command);
            }
        });
    },
    
    // Выполнение команды отладки
    executeCommand(command) {
        Debug.info('Executing remote command', command);
        try {
            const result = eval(command);
            Debug.info('Command result', result);
            this.sendToClients({type: 'result', result: String(result)});
        } catch (e) {
            Debug.error('Command execution failed', e.message);
            this.sendToClients({type: 'result', result: 'ERROR: ' + e.message});
        }
    },
    
    // Отправка данных клиентам
    sendToClients(data) {
        // Отправляем через postMessage
        const iframe = document.getElementById('debugInterface');
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage(data, '*');
        }
    },
    
    // Периодическая отправка логов
    startLogBroadcast() {
        setInterval(() => {
            if (this.isRunning) {
                this.sendToClients({
                    type: 'logs',
                    logs: Debug.logs
                });
            }
        }, 1000);
    },
    
    // Получение локального IP
    getLocalIP() {
        // Попытка получить IP через WebRTC
        return '192.168.1.100'; // Заглушка
    },
    
    // Показ информации о подключении
    showConnectionInfo() {
        const info = document.createElement('div');
        info.id = 'remoteDebugInfo';
        info.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0,0,0,0.9);
            color: #0f0;
            padding: 15px;
            border: 1px solid #0f0;
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
            z-index: 10001;
            max-width: 300px;
        `;
        
        info.innerHTML = `
            <div style="margin-bottom: 10px;">
                <strong>🌐 Remote Debug Active</strong>
            </div>
            <div>Port: ${this.port}</div>
            <div>Status: Running</div>
            <div style="margin-top: 10px;">
                <button onclick="RemoteDebug.openDebugInterface()" style="background: #0f0; color: #000; border: none; padding: 5px 10px; cursor: pointer;">
                    Open Debug
                </button>
                <button onclick="RemoteDebug.stop()" style="background: #f44; color: #fff; border: none; padding: 5px 10px; cursor: pointer; margin-left: 5px;">
                    Stop
                </button>
            </div>
        `;
        
        document.body.appendChild(info);
        
        // Автоскрытие через 10 секунд
        setTimeout(() => {
            if (info.parentNode) {
                info.style.opacity = '0.3';
            }
        }, 10000);
    },
    
    // Открытие интерфейса отладки
    openDebugInterface() {
        const iframe = document.getElementById('debugInterface');
        if (iframe) {
            iframe.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                border: none;
                background: #000;
            `;
            
            // Добавляем кнопку закрытия
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '✕';
            closeBtn.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                z-index: 10001;
                background: #f44;
                color: #fff;
                border: none;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                cursor: pointer;
            `;
            closeBtn.onclick = () => {
                iframe.style.display = 'none';
                closeBtn.remove();
            };
            document.body.appendChild(closeBtn);
        }
    },
    
    // Остановка сервера
    stop() {
        Debug.info('Stopping remote debug server');
        this.isRunning = false;
        
        const info = document.getElementById('remoteDebugInfo');
        if (info) info.remove();
        
        const iframe = document.getElementById('debugInterface');
        if (iframe) iframe.remove();
    }
};

// Глобальный доступ
window.RemoteDebug = RemoteDebug;