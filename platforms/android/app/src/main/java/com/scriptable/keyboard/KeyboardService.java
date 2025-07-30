package com.scriptable.keyboard;

import android.inputmethodservice.InputMethodService;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputConnection;
import android.content.Intent;
import android.net.Uri;
import android.provider.Settings;

public class KeyboardService extends InputMethodService {
    
    @Override
    public View onCreateInputView() {
        // Создаем минимальный view для InputMethodService
        View view = getLayoutInflater().inflate(R.layout.keyboard_layout, null);
        
        // При активации клавиатуры запускаем главное приложение
        launchMainApp();
        
        return view;
    }
    
    @Override
    public void onStartInputView(EditorInfo info, boolean restarting) {
        super.onStartInputView(info, restarting);
        
        // Запускаем главное приложение с плавающей кнопкой
        launchMainApp();
        
        // Скрываем системную клавиатуру (делаем её невидимой)
        hideWindow();
    }
    
    private void launchMainApp() {
        try {
            Intent intent = new Intent(this, MainActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            intent.putExtra("show_floating", true);
            startActivity(intent);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    @Override
    public void onFinishInputView(boolean finishingInput) {
        super.onFinishInputView(finishingInput);
        // Можно добавить логику при закрытии клавиатуры
    }
    
    // Методы для ввода текста (будут вызываться из JavaScript)
    public void typeText(String text) {
        InputConnection ic = getCurrentInputConnection();
        if (ic != null) {
            ic.commitText(text, 1);
        }
    }
    
    public void sendBackspace() {
        InputConnection ic = getCurrentInputConnection();
        if (ic != null) {
            ic.deleteSurroundingText(1, 0);
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
        }
    }
}