/// أدوات مساعدة لقراءة البيانات القادمة من Firestore بشكل آمن.
///
/// النماذج لا تستورد حزمة cloud_firestore عمداً حتى تبقى طبقة البيانات
/// قابلة للاختبار بـ Dart فقط. لذلك يُقرأ `Timestamp` ديناميكياً عبر
/// الدالة `toDate()`، وتُكتب التواريخ كـ `DateTime` لأن Firestore يحوّلها
/// تلقائياً إلى `Timestamp` عند الحفظ.
library;

import '../errors/exceptions.dart';

abstract final class JsonUtils {
  /// يحوّل Timestamp أو DateTime أو نص ISO أو milliseconds إلى DateTime.
  static DateTime? parseDate(Object? value) {
    if (value == null) return null;
    if (value is DateTime) return value;
    if (value is String) return DateTime.tryParse(value);
    if (value is int) return DateTime.fromMillisecondsSinceEpoch(value);
    try {
      return (value as dynamic).toDate() as DateTime;
    } catch (_) {
      return null;
    }
  }

  /// يقرأ حقلاً نصياً إلزامياً، ويرمي استثناءً واضحاً إذا كان مفقوداً.
  static String requireString(Map<String, dynamic> json, String key) {
    final value = json[key];
    if (value is String && value.trim().isNotEmpty) return value;
    throw DataParsingException('الحقل "$key" مفقود أو غير صالح');
  }

  static int readInt(
    Map<String, dynamic> json,
    String key, {
    int fallback = 0,
  }) {
    final value = json[key];
    if (value is int) return value;
    if (value is num) return value.toInt();
    if (value is String) return int.tryParse(value) ?? fallback;
    return fallback;
  }

  static double readDouble(
    Map<String, dynamic> json,
    String key, {
    double fallback = 0,
  }) {
    final value = json[key];
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? fallback;
    return fallback;
  }

  static List<String> readStringList(Map<String, dynamic> json, String key) {
    final value = json[key];
    if (value is! List) return const [];
    return value.whereType<String>().toList(growable: false);
  }

  static List<Map<String, dynamic>> readMapList(
    Map<String, dynamic> json,
    String key,
  ) {
    final value = json[key];
    if (value is! List) return const [];
    return value
        .whereType<Map>()
        .map((e) => Map<String, dynamic>.from(e))
        .toList(growable: false);
  }

  /// يحوّل قيمة نصية إلى عنصر enum، مع قيمة افتراضية عند عدم التطابق.
  static T readEnum<T extends Enum>(
    Map<String, dynamic> json,
    String key,
    List<T> values,
    T fallback,
  ) {
    final raw = json[key];
    for (final v in values) {
      if (v.name == raw) return v;
    }
    return fallback;
  }
}
