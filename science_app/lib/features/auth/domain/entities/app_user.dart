import 'package:equatable/equatable.dart';

import '../../../../core/constants/app_strings.dart';

/// دور المستخدم في التطبيق.
enum UserRole {
  student(AppStrings.student),
  teacher(AppStrings.teacher),
  parent(AppStrings.parent);

  const UserRole(this.arabicLabel);

  final String arabicLabel;
}

/// المستخدم الأساسي. لكل دور صنف خاص به يضيف حقوله.
sealed class AppUser extends Equatable {
  const AppUser({
    required this.id,
    required this.fullName,
    required this.email,
    required this.createdAt,
    this.avatarUrl,
    this.fcmTokens = const [],
  });

  final String id;
  final String fullName;
  final String email;
  final String? avatarUrl;
  final DateTime createdAt;

  /// رموز الأجهزة المستخدمة لإرسال الإشعارات (قد يملك المستخدم أكثر من جهاز).
  final List<String> fcmTokens;

  UserRole get role;

  @override
  List<Object?> get props => [
    id,
    fullName,
    email,
    avatarUrl,
    createdAt,
    fcmTokens,
    role,
  ];
}

/// الطالب.
class Student extends AppUser {
  const Student({
    required super.id,
    required super.fullName,
    required super.email,
    required super.createdAt,
    required this.classId,
    super.avatarUrl,
    super.fcmTokens,
    this.gradeLevel = 5,
    this.parentIds = const [],
    this.totalPoints = 0,
    this.completedLessonIds = const [],
    this.avatarCharacter = 'robot',
  });

  /// معرّف الشعبة، مثل: 5A
  final String classId;
  final int gradeLevel;
  final List<String> parentIds;

  /// مجموع النقاط التي جمعها الطالب من الاختبارات.
  final int totalPoints;
  final List<String> completedLessonIds;

  /// اسم الشخصية الكرتونية التي اختارها الطالب.
  final String avatarCharacter;

  @override
  UserRole get role => UserRole.student;

  @override
  List<Object?> get props => [
    ...super.props,
    classId,
    gradeLevel,
    parentIds,
    totalPoints,
    completedLessonIds,
    avatarCharacter,
  ];
}

/// المعلّم.
class Teacher extends AppUser {
  const Teacher({
    required super.id,
    required super.fullName,
    required super.email,
    required super.createdAt,
    super.avatarUrl,
    super.fcmTokens,
    this.classIds = const [],
    this.subject = 'العلوم',
  });

  /// الشعب التي يدرّسها المعلّم.
  final List<String> classIds;
  final String subject;

  @override
  UserRole get role => UserRole.teacher;

  @override
  List<Object?> get props => [...super.props, classIds, subject];
}

/// وليّ الأمر.
class Parent extends AppUser {
  const Parent({
    required super.id,
    required super.fullName,
    required super.email,
    required super.createdAt,
    super.avatarUrl,
    super.fcmTokens,
    this.childrenIds = const [],
    this.phoneNumber,
  });

  /// معرّفات الأبناء (الطلاب) المرتبطين بوليّ الأمر.
  final List<String> childrenIds;
  final String? phoneNumber;

  @override
  UserRole get role => UserRole.parent;

  @override
  List<Object?> get props => [...super.props, childrenIds, phoneNumber];
}
