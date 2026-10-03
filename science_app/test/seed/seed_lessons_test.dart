import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:science_kids/features/lessons/data/models/lesson_model.dart';

/// يتأكد أن كل درس في seed/lessons يُقرأ في التطبيق بدون أخطاء
/// قبل رفعه إلى Firebase بسكربت seed_lessons.mjs.
void main() {
  final lessonDirs =
      Directory('seed/lessons').listSync().whereType<Directory>().toList();

  test('يوجد درس واحد على الأقل', () {
    expect(lessonDirs, isNotEmpty);
  });

  for (final dir in lessonDirs) {
    final name = dir.uri.pathSegments.where((s) => s.isNotEmpty).last;

    test('الدرس $name صالح للتطبيق', () {
      final raw = File('${dir.path}/lesson.json').readAsStringSync();
      final json = jsonDecode(raw) as Map<String, dynamic>;
      expect(json['id'], name, reason: '"id" يجب أن يساوي اسم المجلد');

      // كل صورة "upload:..." موجودة فعلاً بجانب lesson.json.
      final uploads = RegExp(r'"upload:([^"]+)"')
          .allMatches(raw)
          .map((m) => m.group(1)!)
          .toSet();
      for (final rel in uploads) {
        expect(File('${dir.path}/$rel').existsSync(), isTrue,
            reason: 'الصورة غير موجودة: $rel');
      }

      // بعد الرفع تصبح روابط https، فنحاكي ذلك ثم نقرأ الدرس بنموذج التطبيق.
      final resolved = jsonDecode(
        raw.replaceAll('"upload:', '"https://storage.example/'),
      ) as Map<String, dynamic>;
      final lesson = LessonModel.fromJson(resolved, id: name);

      expect(lesson.quizList, isNotEmpty);
      expect(lesson.quizList.map((q) => q.id).toSet(),
          hasLength(lesson.quizList.length),
          reason: 'معرّفات الأسئلة يجب ألا تتكرر');
    });
  }
}
