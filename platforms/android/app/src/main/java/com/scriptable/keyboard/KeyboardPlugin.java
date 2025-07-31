package com.scriptable.keyboard;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;
import org.json.JSONArray;
import org.json.JSONException;

import android.content.Intent;
import android.provider.Settings;
import android.view.inputmethod.InputMethodManager;
import android.content.Context;
import android.net.Uri;
import android.view.KeyEvent;
import android.view.inputmethod.InputConnection;
import java.io.IOException;

public class KeyboardPlugin extends CordovaPlugin {
    
    // Removed KeyboardService dependency for now - will implement direct input methods
    
    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        
        if (action.equals("typeText")) {
            String text = args.getString(0);
            this.typeText(text, callbackContext);
            return true;
        }
        
        if (action.equals("sendBackspace")) {
            this.sendBackspace(callbackContext);
            return true;
        }
        
        if (action.equals("sendEnter")) {
            this.sendEnter(callbackContext);
            return true;
        }
        
        if (action.equals("openKeyboardSettings")) {
            this.openKeyboardSettings(callbackContext);
            return true;
        }
        
        if (action.equals("isKeyboardEnabled")) {
            this.isKeyboardEnabled(callbackContext);
            return true;
        }
        
        if (action.equals("requestPermissions")) {
            this.requestPermissions(callbackContext);
            return true;
        }
        
        return false;
    }
    
    private void typeText(String text, CallbackContext callbackContext) {
        try {
            // For now, just copy to clipboard - can be enhanced later
            android.content.ClipboardManager clipboard = (android.content.ClipboardManager) 
                cordova.getActivity().getSystemService(android.content.Context.CLIPBOARD_SERVICE);
            android.content.ClipData clip = android.content.ClipData.newPlainText("keyboard_text", text);
            clipboard.setPrimaryClip(clip);
            callbackContext.success("Text copied to clipboard: " + text);
        } catch (Exception e) {
            callbackContext.error("Error typing text: " + e.getMessage());
        }
    }
    
    private void sendBackspace(CallbackContext callbackContext) {
        try {
            // Отправляем реальный Backspace через InputConnection
            InputConnection ic = getCurrentInputConnection();
            if (ic != null) {
                ic.sendKeyEvent(new KeyEvent(KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_DEL));
                ic.sendKeyEvent(new KeyEvent(KeyEvent.ACTION_UP, KeyEvent.KEYCODE_DEL));
                callbackContext.success("Backspace sent successfully");
            } else {
                // Fallback - через команду shell
                Runtime.getRuntime().exec("input keyevent " + KeyEvent.KEYCODE_DEL);
                callbackContext.success("Backspace sent via shell");
            }
        } catch (Exception e) {
            callbackContext.error("Error sending backspace: " + e.getMessage());
        }
    }
    
    private void sendEnter(CallbackContext callbackContext) {
        try {
            // Отправляем реальный Enter через InputConnection
            InputConnection ic = getCurrentInputConnection();
            if (ic != null) {
                ic.sendKeyEvent(new KeyEvent(KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_ENTER));
                ic.sendKeyEvent(new KeyEvent(KeyEvent.ACTION_UP, KeyEvent.KEYCODE_ENTER));
                callbackContext.success("Enter sent successfully");
            } else {
                // Fallback - через команду shell
                Runtime.getRuntime().exec("input keyevent " + KeyEvent.KEYCODE_ENTER);
                callbackContext.success("Enter sent via shell");
            }
        } catch (Exception e) {
            callbackContext.error("Error sending enter: " + e.getMessage());
        }
    }
    
    // Получаем InputConnection (нужно будет связать с KeyboardService)
    private InputConnection getCurrentInputConnection() {
        try {
            // Это будет работать только если мы в контексте InputMethodService
            // Пока возвращаем null, используем fallback через shell команды
            return null;
        } catch (Exception e) {
            return null;
        }
    }
    
    private void openKeyboardSettings(CallbackContext callbackContext) {
        try {
            Intent intent = new Intent(Settings.ACTION_INPUT_METHOD_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            cordova.getActivity().startActivity(intent);
            callbackContext.success("Keyboard settings opened");
        } catch (Exception e) {
            callbackContext.error("Error opening keyboard settings: " + e.getMessage());
        }
    }
    
    private void isKeyboardEnabled(CallbackContext callbackContext) {
        try {
            InputMethodManager imm = (InputMethodManager) cordova.getActivity().getSystemService(Context.INPUT_METHOD_SERVICE);
            String packageName = cordova.getActivity().getPackageName();
            
            // Проверяем, включена ли наша клавиатура
            boolean isEnabled = Settings.Secure.getString(
                cordova.getActivity().getContentResolver(),
                Settings.Secure.ENABLED_INPUT_METHODS
            ).contains(packageName);
            
            callbackContext.success(isEnabled ? 1 : 0);
        } catch (Exception e) {
            callbackContext.error("Error checking keyboard status: " + e.getMessage());
        }
    }
    
    private void requestPermissions(CallbackContext callbackContext) {
        try {
            // Запрос разрешения на отображение поверх других приложений
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                if (!Settings.canDrawOverlays(cordova.getActivity())) {
                    Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:" + cordova.getActivity().getPackageName()));
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    cordova.getActivity().startActivity(intent);
                }
            }
            callbackContext.success("Permissions requested");
        } catch (Exception e) {
            callbackContext.error("Error requesting permissions: " + e.getMessage());
        }
    }
}