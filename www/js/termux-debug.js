// Отправка логов в Termux через HTTP запрос
function sendLogsToTermux() {
    Debug.info('=== SENDING LOGS TO TERMUX ===');
    
    const logs = Debug.logs.slice(0, 50); // Последние 50 логов
    const logData = {
        timestamp: new Date().toISOString(),
        device: navigator.userAgent,
        logs: logs,
        status: {
            floatingButtonVisible: floatingButtonVisible,
            keyboardActive: keyboardActive,
            cordovaReady: typeof cordova !== 'undefined',
            pluginsAvailable: {
                KeyboardPlugin: typeof KeyboardPlugin !== 'undefined',
                device: typeof device !== 'undefined'
            }
        }
    };
    
    // Пытаемся отправить на разные порты Termux
    const termuxPorts = [8080, 8888, 3000, 5000];
    
    termuxPorts.forEach(port => {
        fetch(`http://localhost:${port}/debug-logs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(logData)
        })
        .then(response => {
            if (response.ok) {
                Debug.info(`Logs sent to Termux on port ${port}`);
                KeyboardManager.showNotification(`Логи отправлены на порт ${port}`);
            }
        })
        .catch(error => {
            Debug.debug(`Port ${port} not available`);
        });
    });
    
    // Также пытаемся через Intent
    try {
        if (typeof cordova !== 'undefined' && cordova.plugins && cordova.plugins.intentShim) {
            const intent = {
                action: 'android.intent.action.SEND',
                type: 'text/plain',
                extras: {
                    'android.intent.extra.TEXT': JSON.stringify(logData, null, 2)
                }
            };
            cordova.plugins.intentShim.startActivity(intent);
            Debug.info('Logs sent via Intent');
        }
    } catch (e) {
        Debug.warn('Intent sharing failed', e.message);
    }
}

// Автоматическая отправка логов при критических событиях
function autoSendLogs(event) {
    Debug.info('Auto-sending logs for event', event);
    sendLogsToTermux();
}

// Отправляем логи при ошибках
window.addEventListener('error', (event) => {
    Debug.error('JavaScript error', event.error?.message || event.message);
    setTimeout(() => autoSendLogs('javascript_error'), 1000);
});

// Отправляем логи при выборе клавиатуры
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        Debug.info('App became visible - keyboard might be selected');
        setTimeout(() => autoSendLogs('app_visible'), 2000);
    }
});