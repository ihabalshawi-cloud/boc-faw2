/// الاستثناء الأساسي في التطبيق. الرسالة دائماً بالعربية وجاهزة للعرض.
sealed class AppException implements Exception {
  const AppException(this.message, {this.code});

  final String message;
  final String? code;

  @override
  String toString() => '$runtimeType(${code ?? '-'}): $message';
}

/// خطأ في قراءة البيانات القادمة من الخادم.
class DataParsingException extends AppException {
  const DataParsingException(super.message);
}

/// أخطاء تسجيل الدخول وإنشاء الحسابات.
class AuthException extends AppException {
  const AuthException(super.message, {super.code});
}

/// أخطاء قاعدة البيانات (صلاحيات، عدم وجود مستند، انقطاع...).
class DatabaseException extends AppException {
  const DatabaseException(super.message, {super.code});
}

/// أخطاء الإشعارات.
class MessagingException extends AppException {
  const MessagingException(super.message, {super.code});
}
