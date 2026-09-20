# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated & worklets
-keep class com.swmansion.reanimated.** { *; }
-keep class com.swmansion.worklets.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# React Native & JNI reflection
-keepattributes *Annotation*
-keepclassmembers class * {
  @com.facebook.react.uimanager.annotations.ReactProp <methods>;
  @com.facebook.react.uimanager.annotations.ReactPropGroup <methods>;
}
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.jni.** { *; }

# Expo modules core
-keep class expo.modules.** { *; }
-keepclassmembers class * extends expo.modules.kotlin.modules.Module { *; }

# react-native-gesture-handler & screens
-keep class com.swmansion.gesturehandler.** { *; }
-keep class com.swmansion.rnscreens.** { *; }

# SQLite
-keep class io.requery.android.database.sqlite.** { *; }

