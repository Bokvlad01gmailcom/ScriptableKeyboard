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

public class KeyboardPlugin extends CordovaPlugin {
    
    private static KeyboardService keyboardService;
    
    public static void setKeyboardService(KeyboardService service) {
        keyboardService = service;
    }
    
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
            if (keyboardService != null) {
                keyboardService.typeText(text);
                callbackContext.success("Text typed: " + text);
            } else {
                callbackContext.error("Keyboard service not available");
            }
        } catch (Exception e) {
            callbackContext.error("Error typing text: " + e.getMessage());
        }
    }
    
    private void sendBackspace(CallbackContext callbackContext) {
        try {
            if (keyboardService != null) {
                keyboardService.sendBackspace();
                callbackContext.success("Backspace sent");
            } else {
                callbackContext.error("Keyboard service not available");
            }
        } catch (Exception e) {
            callbackContext.error("Error sending backspace: " + e.getMessage());
        }
    }
    
    private void sendEnter(CallbackContext callbackContext) {
        try {
            if (keyboardService != null) {
                keyboardService.sendEnter();
                callbackContext.success("Enter sent");
            } else {
                callbackContext.error("Keyboard service not available");
            }
        } catch (Exception e) {
            callbackContext.error("Error sending enter: " + e.getMessage());
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