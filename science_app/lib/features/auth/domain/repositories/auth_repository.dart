import '../entities/app_user.dart';

/// عقد المصادقة في طبقة المجال. الواجهات تعتمد عليه وليس على Firebase مباشرة.
abstract interface class AuthRepository {
  /// يبث ملف المستخدم الحالي، أو null عند تسجيل الخروج.
  Stream<AppUser?> watchCurrentUser();

  Future<AppUser> signIn({required String email, required String password});

  /// إنشاء حساب طالب أو وليّ أمر. حسابات المعلّمين تُنشأ من لوحة الإدارة.
  Future<AppUser> register({
    required String email,
    required String password,
    required String fullName,
    required UserRole role,
    String? classId,
  });

  Future<void> sendPasswordReset(String email);

  Future<void> signOut();
}
