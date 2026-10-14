# Add project specific ProGuard rules here.

# React Native & Reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }
-keep class com.facebook.react.** { *; }

# Vision Camera & Fast TFLite & Nitro Modules
-keep class com.mrousavy.camera.** { *; }
-keep class com.mrousavy.tflite.** { *; }
-keep class com.worklets.** { *; }
-keep class com.margelo.nitro.** { *; }
-keep class org.tensorflow.lite.** { *; }

# Keep native C++ JNI methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep serializable models
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}
