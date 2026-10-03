// ملف مؤقت. يُستبدل تلقائياً عند تشغيل:
//
//   dart pub global activate flutterfire_cli
//   flutterfire configure --project=<معرّف-مشروع-firebase>
//
// الأمر يولّد هذا الملف بالقيم الحقيقية لكل منصة (Android / iOS / Web)
// ويضيف google-services.json و GoogleService-Info.plist.
import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    throw UnsupportedError(
      'لم يتم إعداد Firebase بعد. شغّل الأمر: flutterfire configure',
    );
  }
}
