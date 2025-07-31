package com.scriptable.keyboard;

import android.inputmethodservice.InputMethodService;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputConnection;
import android.content.Intent;
import android.util.Log;
import android.view.KeyEvent;

public class KeyboardService extends InputMethodService {
    
    private static final String TAG = "ScriptableKeyboard";
    
    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "KeyboardService created");
        // Регистрируем себя в плагине
        KeyboardPlugin.setKeyboardService(this);
    }
    
    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "KeyboardService destroyed");
        // Отменяем регистрацию
        KeyboardPlugin.clearKeyboardService();
    }
    
    @Override
    public View onCreateInputView() {
        Log.d(TAG, "onCreateInputView called");
        
        // Создаем минимальный view для клавиатуры
        View inputView = getLayoutInflater().inflate(android.R.layout.simple_list_item_1, null);
        
        // Запускаем главное приложение с флагом показа плавающей кнопки
        try {
            Intent intent = new Intent(this, MainActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            intent.putExtra("show_floating", true);
            startActivity(intent);
            Log.d(TAG, "Main activity launched with floating button flag");
        } catch (Exception e) {
            Log.e(TAG, "Error launching main activity", e);
        }
        
        return inputView;
    }
    
    @Override
    public void onStartInput(EditorInfo attribute, boolean restarting) {
        super.onStartInput(attribute, restarting);
        Log.d(TAG, "onStartInput called");
    }
    
    @Override
    public void onStartInputView(EditorInfo info, boolean restarting) {
        super.onStartInputView(info, restarting);
        Log.d(TAG, "onStartInputView called");
        
        // Показываем плавающую кнопку при активации клавиатуры
        try {
            Intent intent = new Intent(this, MainActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            intent.putExtra("show_floating", true);
            startActivity(intent);
        } catch (Exception e) {
            Log.e(TAG, "Error showing floating button", e);
        }
    }
    
    @Override
    public void onFinishInput() {
        super.onFinishInput();
        Log.d(TAG, "onFinishInput called");
    }
    
    // Методы для ввода текста (будут вызываться из JavaScript)
    public void typeText(String text) {
        InputConnection ic = getCurrentInputConnection();
        if (ic != null) {
            ic.commitText(text, 1);
            Log.d(TAG, "Text typed: " + text);
        }
    }
    
    public void sendBackspace() {
        InputConnection ic = getCurrentInputConnection();
        if (ic != null) {
            ic.deleteSurroundingText(1, 0);
            Log.d(TAG, "Backspace sent");
        }
    }
    
    public void sendEnter() {
        InputConnection ic = getCurrentInputConnection();
        if (ic != null) {
            ic.sendKeyEvent(new android.view.KeyEvent(
                android.view.KeyEvent.ACTION_DOWN, 
                android.view.KeyEvent.KEYCODE_ENTER
            ));
            ic.sendKeyEvent(new android.view.KeyEvent(
                android.view.KeyEvent.ACTION_UP, 
                android.view.KeyEvent.KEYCODE_ENTER
            ));
            Log.d(TAG, "Enter sent");
        }
    }
}