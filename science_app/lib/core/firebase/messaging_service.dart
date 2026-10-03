import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

import '../../features/auth/domain/entities/app_user.dart';
import '../../firebase_options.dart';
import '../constants/firestore_collections.dart';

/// يُستدعى عند وصول إشعار والتطبيق مغلق أو في الخلفية.
/// يجب أن تكون دالة عامة (top-level) حتى يستطيع النظام تشغيلها في Isolate منفصل.
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  debugPrint('إشعار في الخلفية: ${message.messageId}');
}

/// إدارة إشعارات Firebase Cloud Messaging:
/// طلب الإذن، حفظ رمز الجهاز في ملف المستخدم، والاشتراك في المواضيع حسب الدور.
class MessagingService {
  MessagingService({
    FirebaseMessaging? messaging,
    FirebaseFirestore? firestore,
    this.webVapidKey,
  })  : _messaging = messaging ?? FirebaseMessaging.instance,
        _db = firestore ?? FirebaseFirestore.instance;

  final FirebaseMessaging _messaging;
  final FirebaseFirestore _db;

  /// مفتاح VAPID من إعدادات Cloud Messaging (مطلوب على الويب فقط).
  final String? webVapidKey;

  StreamSubscription<String>? _tokenRefreshSub;

  /// الإشعارات التي تصل والتطبيق مفتوح (لعرضها داخل الواجهة).
  Stream<RemoteMessage> get onForegroundMessage => FirebaseMessaging.onMessage;

  /// عند ضغط المستخدم على إشعار والتطبيق في الخلفية.
  Stream<RemoteMessage> get onNotificationTap =>
      FirebaseMessaging.onMessageOpenedApp;

  /// الإشعار الذي فتح التطبيق وهو مغلق تماماً (إن وجد).
  Future<RemoteMessage?> getInitialMessage() => _messaging.getInitialMessage();

  Future<bool> requestPermission() async {
    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
    // على iOS: إظهار الإشعار حتى والتطبيق مفتوح.
    await _messaging.setForegroundNotificationPresentationOptions(
      alert: true,
      badge: true,
      sound: true,
    );
    return settings.authorizationStatus == AuthorizationStatus.authorized ||
        settings.authorizationStatus == AuthorizationStatus.provisional;
  }

  /// يُستدعى بعد تسجيل الدخول: يحفظ رمز الجهاز ويشترك في مواضيع المستخدم.
  Future<void> registerUser(AppUser user) async {
    final granted = await requestPermission();
    if (!granted) return;

    final token = await _messaging.getToken(vapidKey: webVapidKey);
    if (token != null) await _saveToken(user.id, token);

    await _tokenRefreshSub?.cancel();
    _tokenRefreshSub = _messaging.onTokenRefresh.listen(
      (t) => _saveToken(user.id, t),
    );

    // الاشتراك في المواضيع غير مدعوم على الويب.
    if (!kIsWeb) {
      for (final topic in _topicsFor(user)) {
        await _messaging.subscribeToTopic(topic);
      }
    }
  }

  /// يُستدعى قبل تسجيل الخروج حتى لا تصل إشعارات المستخدم لهذا الجهاز.
  Future<void> unregisterUser(AppUser user) async {
    await _tokenRefreshSub?.cancel();
    _tokenRefreshSub = null;

    final token = await _messaging.getToken(vapidKey: webVapidKey);
    if (token != null) {
      await _userDoc(user.id).update({
        'fcmTokens': FieldValue.arrayRemove([token]),
      });
    }
    if (!kIsWeb) {
      for (final topic in _topicsFor(user)) {
        await _messaging.unsubscribeFromTopic(topic);
      }
    }
    await _messaging.deleteToken();
  }

  Future<void> _saveToken(String uid, String token) => _userDoc(uid).update({
        'fcmTokens': FieldValue.arrayUnion([token]),
      });

  DocumentReference<Map<String, dynamic>> _userDoc(String uid) =>
      _db.collection(FirestoreCollections.users).doc(uid);

  static List<String> _topicsFor(AppUser user) => switch (user) {
        final Student s => [
            MessagingTopics.allStudents,
            MessagingTopics.forClass(s.classId),
          ],
        final Teacher t => [
            MessagingTopics.allTeachers,
            ...t.classIds.map(MessagingTopics.forClass),
          ],
        Parent _ => [MessagingTopics.allParents],
      };

  void dispose() => _tokenRefreshSub?.cancel();
}
