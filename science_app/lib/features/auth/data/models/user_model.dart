import '../../../../core/errors/exceptions.dart';
import '../../../../core/utils/json_utils.dart';
import '../../domain/entities/app_user.dart';

/// تحويل المستخدم من وإلى JSON. شكل المستند في `users/{uid}`:
///
/// ```json
/// {
///   "role": "student",
///   "fullName": "سارة أحمد",
///   "email": "sara@school.iq",
///   "avatarUrl": null,
///   "createdAt": Timestamp,
///   "fcmTokens": ["..."],
///   "classId": "5A", "gradeLevel": 5, "parentIds": [], "totalPoints": 120,
///   "completedLessonIds": [], "avatarCharacter": "robot"
/// }
/// ```
abstract final class UserModel {
  /// ينشئ الصنف المناسب حسب حقل `role`.
  static AppUser fromJson(Map<String, dynamic> json, {String? id}) {
    final roleKey = json['role'];
    final role = UserRole.values.where((r) => r.name == roleKey).firstOrNull;
    if (role == null) {
      throw DataParsingException('دور المستخدم غير معروف: $roleKey');
    }
    return switch (role) {
      UserRole.student => StudentModel.fromJson(json, id: id),
      UserRole.teacher => TeacherModel.fromJson(json, id: id),
      UserRole.parent => ParentModel.fromJson(json, id: id),
    };
  }

  static Map<String, dynamic> toJson(AppUser user) => switch (user) {
    Student s => StudentModel.fromEntity(s).toJson(),
    Teacher t => TeacherModel.fromEntity(t).toJson(),
    Parent p => ParentModel.fromEntity(p).toJson(),
  };

  static Map<String, dynamic> _baseToJson(AppUser u) => {
    'role': u.role.name,
    'fullName': u.fullName,
    'email': u.email,
    'avatarUrl': u.avatarUrl,
    'createdAt': u.createdAt,
    'fcmTokens': u.fcmTokens,
  };

  static String _readId(Map<String, dynamic> json, String? id) =>
      id ?? JsonUtils.requireString(json, 'id');

  static DateTime _readCreatedAt(Map<String, dynamic> json) =>
      JsonUtils.parseDate(json['createdAt']) ?? DateTime.now();
}

class StudentModel extends Student {
  const StudentModel({
    required super.id,
    required super.fullName,
    required super.email,
    required super.createdAt,
    required super.classId,
    super.avatarUrl,
    super.fcmTokens,
    super.gradeLevel,
    super.parentIds,
    super.totalPoints,
    super.completedLessonIds,
    super.avatarCharacter,
  });

  factory StudentModel.fromJson(Map<String, dynamic> json, {String? id}) =>
      StudentModel(
        id: UserModel._readId(json, id),
        fullName: JsonUtils.requireString(json, 'fullName'),
        email: JsonUtils.requireString(json, 'email'),
        avatarUrl: json['avatarUrl'] as String?,
        createdAt: UserModel._readCreatedAt(json),
        fcmTokens: JsonUtils.readStringList(json, 'fcmTokens'),
        classId: JsonUtils.requireString(json, 'classId'),
        gradeLevel: JsonUtils.readInt(json, 'gradeLevel', fallback: 5),
        parentIds: JsonUtils.readStringList(json, 'parentIds'),
        totalPoints: JsonUtils.readInt(json, 'totalPoints'),
        completedLessonIds: JsonUtils.readStringList(
          json,
          'completedLessonIds',
        ),
        avatarCharacter: json['avatarCharacter'] as String? ?? 'robot',
      );

  factory StudentModel.fromEntity(Student s) => StudentModel(
    id: s.id,
    fullName: s.fullName,
    email: s.email,
    avatarUrl: s.avatarUrl,
    createdAt: s.createdAt,
    fcmTokens: s.fcmTokens,
    classId: s.classId,
    gradeLevel: s.gradeLevel,
    parentIds: s.parentIds,
    totalPoints: s.totalPoints,
    completedLessonIds: s.completedLessonIds,
    avatarCharacter: s.avatarCharacter,
  );

  Map<String, dynamic> toJson() => {
    ...UserModel._baseToJson(this),
    'classId': classId,
    'gradeLevel': gradeLevel,
    'parentIds': parentIds,
    'totalPoints': totalPoints,
    'completedLessonIds': completedLessonIds,
    'avatarCharacter': avatarCharacter,
  };
}

class TeacherModel extends Teacher {
  const TeacherModel({
    required super.id,
    required super.fullName,
    required super.email,
    required super.createdAt,
    super.avatarUrl,
    super.fcmTokens,
    super.classIds,
    super.subject,
  });

  factory TeacherModel.fromJson(Map<String, dynamic> json, {String? id}) =>
      TeacherModel(
        id: UserModel._readId(json, id),
        fullName: JsonUtils.requireString(json, 'fullName'),
        email: JsonUtils.requireString(json, 'email'),
        avatarUrl: json['avatarUrl'] as String?,
        createdAt: UserModel._readCreatedAt(json),
        fcmTokens: JsonUtils.readStringList(json, 'fcmTokens'),
        classIds: JsonUtils.readStringList(json, 'classIds'),
        subject: json['subject'] as String? ?? 'العلوم',
      );

  factory TeacherModel.fromEntity(Teacher t) => TeacherModel(
    id: t.id,
    fullName: t.fullName,
    email: t.email,
    avatarUrl: t.avatarUrl,
    createdAt: t.createdAt,
    fcmTokens: t.fcmTokens,
    classIds: t.classIds,
    subject: t.subject,
  );

  Map<String, dynamic> toJson() => {
    ...UserModel._baseToJson(this),
    'classIds': classIds,
    'subject': subject,
  };
}

class ParentModel extends Parent {
  const ParentModel({
    required super.id,
    required super.fullName,
    required super.email,
    required super.createdAt,
    super.avatarUrl,
    super.fcmTokens,
    super.childrenIds,
    super.phoneNumber,
  });

  factory ParentModel.fromJson(Map<String, dynamic> json, {String? id}) =>
      ParentModel(
        id: UserModel._readId(json, id),
        fullName: JsonUtils.requireString(json, 'fullName'),
        email: JsonUtils.requireString(json, 'email'),
        avatarUrl: json['avatarUrl'] as String?,
        createdAt: UserModel._readCreatedAt(json),
        fcmTokens: JsonUtils.readStringList(json, 'fcmTokens'),
        childrenIds: JsonUtils.readStringList(json, 'childrenIds'),
        phoneNumber: json['phoneNumber'] as String?,
      );

  factory ParentModel.fromEntity(Parent p) => ParentModel(
    id: p.id,
    fullName: p.fullName,
    email: p.email,
    avatarUrl: p.avatarUrl,
    createdAt: p.createdAt,
    fcmTokens: p.fcmTokens,
    childrenIds: p.childrenIds,
    phoneNumber: p.phoneNumber,
  );

  Map<String, dynamic> toJson() => {
    ...UserModel._baseToJson(this),
    'childrenIds': childrenIds,
    'phoneNumber': phoneNumber,
  };
}
