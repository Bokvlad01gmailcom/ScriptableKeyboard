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
            ((Button) floatingButton).setBackgroundColor(0x80000000); // Полупрозрачный фон
            
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
                                
                                // Убираем старую кнопку и добавляем на новое место
                                try {
                                    windowManager.removeView(floatingButton);
                                    windowManager.addView(floatingButton, params);
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
            
            // Прямая отправка через system input (более надежно)
            new Thread(() -> {
                try {
                    Process process = Runtime.getRuntime().exec("su -c 'input keyevent 66'");
                    process.waitFor();
                    Log.d(TAG, "Enter sent via su input");
                } catch (Exception e) {
                    Log.w(TAG, "Su input failed, trying regular input");
                    try {
                        Process process = Runtime.getRuntime().exec("input keyevent 66");
                        process.waitFor();
                        Log.d(TAG, "Enter sent via regular input");
                    } catch (Exception e2) {
                        Log.e(TAG, "All input methods failed", e2);
                    }
                }
            }).start();
            
        } catch (Exception e) {
            Log.e(TAG, "Error sending Enter key", e);
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