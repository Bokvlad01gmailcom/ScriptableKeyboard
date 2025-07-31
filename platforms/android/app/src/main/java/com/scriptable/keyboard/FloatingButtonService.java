package com.scriptable.keyboard;

import android.app.Service;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.os.IBinder;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.util.Log;
import android.provider.Settings;
import android.os.Build;

public class FloatingButtonService extends Service {
    
    private static final String TAG = "FloatingButtonService";
    private WindowManager windowManager;
    private View floatingButton;
    
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "Starting floating button service");
        
        // Проверяем разрешение
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
            Log.e(TAG, "No overlay permission");
            stopSelf();
            return START_NOT_STICKY;
        }
        
        createFloatingButton();
        return START_STICKY;
    }
    
    private void createFloatingButton() {
        try {
            windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
            
            // Создаем кнопку
            floatingButton = new Button(this);
            ((Button) floatingButton).setText("⌨️");
            ((Button) floatingButton).setTextSize(24);
            
            // Параметры окна
            WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                150, 150,
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.O 
                    ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                    : WindowManager.LayoutParams.TYPE_PHONE,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
                PixelFormat.TRANSLUCENT
            );
            
            params.gravity = Gravity.TOP | Gravity.END;
            params.x = 50;
            params.y = 100;
            
            // Обработчик нажатия
            floatingButton.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    Log.d(TAG, "Floating button clicked - sending Enter");
                    sendEnterKey();
                }
            });
            
            // Обработчик перетаскивания
            floatingButton.setOnTouchListener(new View.OnTouchListener() {
                private int initialX, initialY;
                private float initialTouchX, initialTouchY;
                private boolean isDragging = false;
                
                @Override
                public boolean onTouch(View v, MotionEvent event) {
                    switch (event.getAction()) {
                        case MotionEvent.ACTION_DOWN:
                            initialX = params.x;
                            initialY = params.y;
                            initialTouchX = event.getRawX();
                            initialTouchY = event.getRawY();
                            isDragging = false;
                            return true;
                            
                        case MotionEvent.ACTION_MOVE:
                            float deltaX = event.getRawX() - initialTouchX;
                            float deltaY = event.getRawY() - initialTouchY;
                            
                            if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
                                isDragging = true;
                                params.x = initialX - (int) deltaX;
                                params.y = initialY + (int) deltaY;
                                
                                // Принудительно обновляем позицию
                                try {
                                    windowManager.updateViewLayout(floatingButton, params);
                                    // Принудительно перерисовываем
                                    floatingButton.invalidate();
                                } catch (Exception e) {
                                    Log.e(TAG, "Error updating button position", e);
                                }
                            }
                            return true;
                            
                        case MotionEvent.ACTION_UP:
                            if (!isDragging) {
                                v.performClick();
                            } else {
                                // После перетаскивания принудительно обновляем
                                floatingButton.invalidate();
                            }
                            return true;
                    }
                    return false;
                }
            });
            
            // Добавляем кнопку на экран
            windowManager.addView(floatingButton, params);
            Log.d(TAG, "Floating button created and added to screen");
            
        } catch (Exception e) {
            Log.e(TAG, "Error creating floating button", e);
        }
    }
    
    private void sendEnterKey() {
        try {
            Log.d(TAG, "Sending Enter key");
            
            // Получаем активный KeyboardService
            KeyboardService keyboardService = KeyboardService.getInstance();
            if (keyboardService != null) {
                keyboardService.sendEnter();
                Log.d(TAG, "Enter key sent via KeyboardService");
            } else {
                Log.w(TAG, "KeyboardService not available");
                
                // Fallback - отправляем через системные события
                sendEnterViaSystem();
            }
        } catch (Exception e) {
            Log.e(TAG, "Error sending Enter key", e);
        }
    }
    
    private void sendEnterViaSystem() {
        try {
            // Используем Runtime для отправки Enter
            Runtime.getRuntime().exec("input keyevent 66"); // 66 = KEYCODE_ENTER
            Log.d(TAG, "Enter sent via system input");
        } catch (Exception e) {
            Log.e(TAG, "Error sending Enter via system", e);
        }
    }
    
    private void openMainApp() {
        try {
            Intent intent = new Intent(this, MainActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            intent.putExtra("from_floating_button", true);
            startActivity(intent);
        } catch (Exception e) {
            Log.e(TAG, "Error opening main app", e);
        }
    }
    
    @Override
    public void onDestroy() {
        super.onDestroy();
        if (floatingButton != null && windowManager != null) {
            windowManager.removeView(floatingButton);
            Log.d(TAG, "Floating button removed");
        }
    }
}