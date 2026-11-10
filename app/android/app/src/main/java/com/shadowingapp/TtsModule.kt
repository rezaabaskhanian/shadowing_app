package com.shadowingapp

import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.util.Locale
import java.util.UUID

class TtsModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), TextToSpeech.OnInitListener {

    private var tts: TextToSpeech? = null
    private var isInitialized = false
    private var pendingSpeak: Pair<String, Promise>? = null

    init {
        tts = TextToSpeech(reactContext, this)
    }

    override fun getName(): String = "SystemTts"

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            val res = tts?.setLanguage(Locale.US)
            if (res == TextToSpeech.LANG_MISSING_DATA || res == TextToSpeech.LANG_NOT_SUPPORTED) {
                tts?.language = Locale.getDefault()
            }
            tts?.setSpeechRate(0.95f)
            isInitialized = true

            pendingSpeak?.let { (text, promise) ->
                pendingSpeak = null
                speak(text, promise)
            }
        } else {
            pendingSpeak?.second?.resolve(false)
            pendingSpeak = null
        }
    }

    @ReactMethod
    fun speak(text: String, promise: Promise) {
        if (text.isBlank()) {
            promise.resolve(true)
            return
        }
        val engine = tts
        if (engine == null) {
            promise.resolve(false)
            return
        }
        if (!isInitialized) {
            pendingSpeak = Pair(text, promise)
            return
        }

        val utteranceId = UUID.randomUUID().toString()
        engine.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
            override fun onStart(utteranceId: String?) {}

            override fun onDone(id: String?) {
                if (id == utteranceId) {
                    promise.resolve(true)
                }
            }

            @Deprecated("Deprecated in Java")
            override fun onError(id: String?) {
                if (id == utteranceId) {
                    promise.resolve(false)
                }
            }

            override fun onError(id: String?, errorCode: Int) {
                if (id == utteranceId) {
                    promise.resolve(false)
                }
            }
        })

        val params = Bundle()
        params.putString(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, utteranceId)
        val result = engine.speak(text, TextToSpeech.QUEUE_FLUSH, params, utteranceId)
        if (result != TextToSpeech.SUCCESS) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun stop(promise: Promise) {
        tts?.stop()
        promise.resolve(true)
    }

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        try {
            tts?.stop()
            tts?.shutdown()
        } catch (_: Exception) {}
        tts = null
    }
}
