package com.shadowingapp

import android.os.Bundle
import androidx.core.view.WindowCompat
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "ShadowingApp"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onCreate(savedInstanceState: Bundle?) {
    // بدون این خط، روی اندروید نسخه‌های قدیمی‌تر از ۱۵، پراپ translucent
    // خودِ StatusBar در جاوااسکریپت اثر واقعی ندارد و محتوا هیچ‌وقت زیر نوار
    // وضعیت نمی‌رود — چون تصمیم‌گیری نهایی درباره‌ی edge-to-edge در سطح
    // native و پنجره‌ی اکتیویتی است، نه در RN.
    WindowCompat.setDecorFitsSystemWindows(window, false)
    super.onCreate(null)
  }
}
