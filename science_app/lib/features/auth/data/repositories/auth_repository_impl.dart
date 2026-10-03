import 'dart:async';

import '../../../../core/errors/exceptions.dart';
import '../../domain/entities/app_user.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_remote_data_source.dart';

class AuthRepositoryImpl implements AuthRepository {
  AuthRepositoryImpl(this._remote);

  final AuthRemoteDataSource _remote;

  @override
  Stream<AppUser?> watchCurrentUser() {
    // عند تغيّر حالة الدخول ننتقل لبث ملف المستخدم من Firestore.
    late StreamController<AppUser?> controller;
    StreamSubscription<Object?>? authSub;
    StreamSubscription<AppUser?>? profileSub;

    controller = StreamController<AppUser?>(
      onListen: () {
        authSub = _remote.authStateChanges().listen((firebaseUser) {
          profileSub?.cancel();
          if (firebaseUser == null) {
            controller.add(null);
          } else {
            profileSub = _remote
                .watchProfile(firebaseUser.uid)
                .listen(controller.add, onError: controller.addError);
          }
        }, onError: controller.addError);
      },
      onCancel: () async {
        await profileSub?.cancel();
        await authSub?.cancel();
      },
    );
    return controller.stream;
  }

  @override
  Future<AppUser> signIn({
    required String email,
    required String password,
  }) async {
    _validateEmail(email);
    if (password.isEmpty) {
      throw const AuthException('أدخل كلمة المرور');
    }
    final uid = await _remote.signIn(email, password);
    return _remote.getProfile(uid);
  }

  @override
  Future<AppUser> register({
    required String email,
    required String password,
    required String fullName,
    required UserRole role,
    String? classId,
  }) async {
    _validateEmail(email);
    if (fullName.trim().length < 3) {
      throw const AuthException('أدخل الاسم الكامل');
    }
    if (password.length < 6) {
      throw const AuthException('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    }
    if (role == UserRole.teacher) {
      throw const AuthException('حسابات المعلّمين تُنشأ من قِبل إدارة المدرسة');
    }
    if (role == UserRole.student && (classId == null || classId.isEmpty)) {
      throw const AuthException('اختر الشعبة الدراسية');
    }
    return _remote.register(
      email: email,
      password: password,
      fullName: fullName.trim(),
      role: role,
      classId: classId,
    );
  }

  @override
  Future<void> sendPasswordReset(String email) async {
    _validateEmail(email);
    return _remote.sendPasswordReset(email);
  }

  @override
  Future<void> signOut() => _remote.signOut();

  static final _emailRegex = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');

  void _validateEmail(String email) {
    if (!_emailRegex.hasMatch(email.trim())) {
      throw const AuthException('البريد الإلكتروني غير صحيح');
    }
  }
}
