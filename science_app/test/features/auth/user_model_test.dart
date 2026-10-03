import 'package:flutter_test/flutter_test.dart';
import 'package:science_kids/core/errors/exceptions.dart';
import 'package:science_kids/features/auth/data/models/user_model.dart';
import 'package:science_kids/features/auth/domain/entities/app_user.dart';

void main() {
  final createdAt = DateTime(2026, 9, 1);

  test('يحوّل الطالب إلى JSON ويعيده كما هو', () {
    final student = Student(
      id: 's1',
      fullName: 'سارة أحمد',
      email: 'sara@school.iq',
      createdAt: createdAt,
      classId: '5A',
      parentIds: const ['p1'],
      totalPoints: 120,
    );

    final json = UserModel.toJson(student);
    expect(json['role'], 'student');

    final restored = UserModel.fromJson(json, id: 's1');
    expect(restored, isA<Student>());
    expect(restored, StudentModel.fromEntity(student));
  });

  test('يقرأ المعلّم ووليّ الأمر حسب الدور', () {
    final teacher = UserModel.fromJson({
      'role': 'teacher',
      'fullName': 'أ. علي',
      'email': 'ali@school.iq',
      'classIds': ['5A', '5B'],
    }, id: 't1');
    expect(teacher, isA<Teacher>());
    expect((teacher as Teacher).classIds, ['5A', '5B']);
    expect(teacher.role.arabicLabel, 'معلّم');

    final parent = UserModel.fromJson({
      'role': 'parent',
      'fullName': 'أحمد',
      'email': 'ahmed@mail.com',
      'childrenIds': ['s1'],
    }, id: 'p1');
    expect((parent as Parent).childrenIds, ['s1']);
  });

  test('يرفض دوراً غير معروف أو حقلاً إلزامياً مفقوداً', () {
    expect(
      () => UserModel.fromJson({'role': 'admin'}, id: 'x'),
      throwsA(isA<DataParsingException>()),
    );
    expect(
      () => UserModel.fromJson({
        'role': 'student',
        'fullName': 'سارة',
        'email': 'a@b.c',
      }, id: 'x'),
      throwsA(isA<DataParsingException>()),
    );
  });
}
