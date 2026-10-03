import 'package:flutter/material.dart';

/// ألوان مشرقة بطابع كرتوني تناسب الأطفال.
abstract final class AppColors {
  static const primary = Color(0xFF4CAF50); // أخضر الطبيعة
  static const secondary = Color(0xFFFFB300); // أصفر الشمس
  static const accent = Color(0xFF29B6F6); // أزرق السماء
  static const fun = Color(0xFFFF7043); // برتقالي المرح
  static const purple = Color(0xFFAB47BC);

  static const background = Color(0xFFFFF8E1); // كريمي دافئ
  static const surface = Colors.white;
  static const textDark = Color(0xFF3E2723);

  static const correct = Color(0xFF66BB6A);
  static const wrong = Color(0xFFEF5350);

  /// ألوان بطاقات الدروس بالتناوب.
  static const lessonCardColors = [accent, fun, purple, primary, secondary];
}
