import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

import '../../firebase_options.dart';
import 'messaging_service.dart';

/// تهيئة Firebase مرة واحدة قبل تشغيل التطبيق.
abstract final class FirebaseBootstrap {
  static Future<void> initialize() async {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );

    // التخزين المحلي يسمح للطالب بمراجعة الدروس حتى بدون إنترنت.
    FirebaseFirestore.instance.settings = const Settings(
      persistenceEnabled: true,
      cacheSizeBytes: Settings.CACHE_SIZE_UNLIMITED,
    );

    // رسائل البريد (استعادة كلمة المرور، التحقق) تصل بالعربية.
    await FirebaseAuth.instance.setLanguageCode('ar');

    // على الويب تُعالج رسائل الخلفية عبر firebase-messaging-sw.js.
    if (!kIsWeb) {
      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
    }
  }
}
