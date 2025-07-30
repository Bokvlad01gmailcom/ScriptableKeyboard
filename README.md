# 🚀 ScriptableKeyboard - Расширяемая клавиатура Android

## 📋 Описание

**ScriptableKeyboard** - это уникальная клавиатура для Android, которая:

✅ **Попадает в список системных клавиатур** (InputMethodService)  
✅ **Работает как плавающая кнопка** (удобный интерфейс)  
✅ **Поддерживает систему скриптов** (расширяемый функционал)  
✅ **Имеет все нативные возможности** Android клавиатуры  

## 🎯 Особенности

### 🔧 Гибридная архитектура:
- **InputMethodService** - для регистрации в системе как клавиатура
- **Плавающая кнопка** - для удобного управления
- **WebView + JavaScript** - для гибкого функционала
- **Система скриптов** - для расширения возможностей

### 📜 Встроенные скрипты:
- 🎤 **Голосовой ввод** - распознавание речи
- 😀 **Панель эмодзи** - быстрый доступ к эмодзи
- 🕐 **Текущее время** - вставка времени
- 🔐 **Генератор паролей** - создание безопасных паролей
- 🧮 **Калькулятор** - вычисления на лету

### ⚙️ Настройки:
- Размер кнопок клавиатуры
- Прозрачность интерфейса
- Вибрация и звуки
- Управление скриптами
- Экспорт/импорт настроек

## 🏗️ Сборка APK

### Вариант 1: В Termux (рекомендуемый)

```bash
# 1. Установка зависимостей
pkg install openjdk-17 gradle nodejs -y
npm install -g cordova

# 2. Установка Android SDK
./tmp_rovodev_install_android_sdk.sh

# 3. Настройка окружения
source ~/.bashrc
sdkmanager "platforms;android-33"
sdkmanager "build-tools;33.0.0"

# 4. Сборка APK
cd ScriptableKeyboard
cordova build android --debug
```

### Вариант 2: Онлайн сборка

1. Загрузите проект на **GitHub**
2. Используйте **GitHub Actions** для автоматической сборки
3. Или используйте онлайн сервисы типа **PhoneGap Build**

### Вариант 3: Android Studio

1. Откройте папку `platforms/android` в Android Studio
2. Синхронизируйте проект
3. Build → Generate Signed Bundle/APK

## 📱 Установка и использование

### 1. Установка APK
```bash
adb install platforms/android/app/build/outputs/apk/debug/app-debug.apk
```

### 2. Настройка клавиатуры
1. Откройте приложение **ScriptableKeyboard**
2. Нажмите **"Включить клавиатуру в системе"**
3. В настройках Android выберите **ScriptableKeyboard**
4. Нажмите **"Показать плавающую кнопку"**

### 3. Использование
- **Плавающая кнопка ⌨️** - показать/скрыть клавиатуру
- **Перетаскивание** - изменение позиции кнопки
- **Скрипты** - выполнение пользовательских функций

## 🔧 Разработка скриптов

### Создание нового скрипта:

```javascript
// Доступные объекты:
// - KeyboardManager.typeText(text) - ввод текста
// - KeyboardManager.showNotification(text) - уведомление
// - ScriptManager - управление скриптами

// Пример: Вставка текущей даты
const now = new Date();
const dateString = now.toLocaleDateString('ru-RU');
KeyboardManager.typeText(dateString);
KeyboardManager.showNotification('Дата вставлена: ' + dateString);
```

### API для скриптов:

```javascript
// Ввод текста
KeyboardManager.typeText("Привет мир!");

// Специальные клавиши
KeyboardManager.sendBackspace();
KeyboardManager.sendEnter();

// Уведомления
KeyboardManager.showNotification("Скрипт выполнен!");

// Работа с буфером обмена
navigator.clipboard.writeText("Текст в буфер");
```

## 📁 Структура проекта

```
ScriptableKeyboard/
├── www/                          # Веб-интерфейс
│   ├── index.html               # Главная страница
│   ├── scripts.html             # Менеджер скриптов
│   ├── settings.html            # Настройки
│   └── js/
│       ├── app.js              # Главный файл приложения
│       ├── keyboard.js         # Менеджер клавиатуры
│       └── scripts.js          # Система скриптов
├── platforms/android/           # Android проект
│   └── app/src/main/
│       ├── java/               # Java код
│       │   └── KeyboardService.java  # InputMethodService
│       └── res/
│           ├── xml/method.xml  # Конфигурация клавиатуры
│           └── layout/         # Layouts
├── plugins/                     # Cordova плагины
│   └── cordova-plugin-keyboard-native/  # Нативный плагин
└── config.xml                  # Конфигурация Cordova
```

## 🔍 Устранение неполадок

### APK не собирается:
```bash
# Проверьте Java
java -version

# Проверьте Android SDK
echo $ANDROID_HOME

# Очистите проект
cordova clean android
cordova build android --debug --verbose
```

### Клавиатура не появляется в списке:
1. Проверьте AndroidManifest.xml
2. Убедитесь что InputMethodService правильно зарегистрирован
3. Переустановите APK

### Плавающая кнопка не работает:
1. Предоставьте разрешение "Поверх других приложений"
2. Проверьте логи в консоли браузера
3. Перезапустите приложение

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи: `adb logcat | grep ScriptableKeyboard`
2. Откройте DevTools в WebView
3. Проверьте разрешения приложения

## 🎯 Дальнейшее развитие

Планируемые функции:
- ☐ Поддержка тем оформления
- ☐ Синхронизация скриптов через облако
- ☐ Поддержка жестов
- ☐ Интеграция с внешними API
- ☐ Плагины для популярных приложений
- ☐ Машинное обучение для предсказания текста

## 📄 Лицензия

MIT License - используйте свободно для любых целей.

---

**ScriptableKeyboard** - клавиатура будущего! 🚀