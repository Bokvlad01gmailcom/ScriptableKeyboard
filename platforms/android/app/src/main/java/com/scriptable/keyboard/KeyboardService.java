package com.scriptable.keyboard;

import android.inputmethodservice.InputMethodService;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputConnection;
import android.content.Intent;
import android.util.Log;

public class KeyboardService extends InputMethodService {
    
    private static final String TAG = "ScriptableKeyboard";
    
    @Override
    public View onCreateInputView() {
        Log.d(TAG, "onCreateInputView called");
        
        // Создаем минимальный view для InputMethodService
        View view = new View(this);
        view.setMinimumHeight(1); // Минимальная высота
        
        // При активации клавиатуры запускаем главное приложение
        launchMainApp();
        
        return view;
    }
    
    @Override
    public void onStartInputView(EditorInfo info, boolean restarting) {
        super.onStartInputView(info, restarting);
        Log.d(TAG, "onStartInputView called");
        
        // Запускаем главное приложение с плавающей кнопкой
        launchMainApp();
        
        // Скрываем системную клавиатуру (делаем её невидимой)
        hideWindow();
    }
    
    private void launchMainApp() {
        try {
            Log.d(TAG, "Launching main app");
            Intent intent = new Intent(this, MainActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            intent.putExtra("show_floating", true);
            startActivity(intent);
        } catch (Exception e) {
            Log.e(TAG, "Error launching main app", e);
        }
    }
    
    @Override
    public void onFinishInputView(boolean finishingInput) {
        super.onFinishInputView(finishingInput);
        Log.d(TAG, "onFinishInputView called");
    }
    
    // Методы для ввода текста (будут вызываться из JavaScript)
    public void typeText(String text) {
        Log.d(TAG, "typeText: " + text);
        InputConnection ic = getCurrentInputConnection();
        if (ic != null) {
            ic.commitText(text, 1);
        }
    }
    
    public void sendBackspace() {
        Log.d(TAG, "sendBackspace");
        InputConnection ic = getCurrentInputConnection();
        if (ic != null) {
            ic.deleteSurroundingText(1, 0);
        }
    }
    
    public void sendEnter() {
        Log.d(TAG, "sendEnter");
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
        }
    }
}