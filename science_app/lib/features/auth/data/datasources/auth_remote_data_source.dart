import 'package:firebase_auth/firebase_auth.dart';

import '../../../../core/constants/app_strings.dart';
import '../../../../core/constants/firestore_collections.dart';
import '../../../../core/errors/exceptions.dart';
import '../../../../core/firebase/firestore_service.dart';
import '../../domain/entities/app_user.dart';
import '../models/user_model.dart';

/// الاتصال المباشر بـ Firebase Authentication ومجموعة `users`.
class AuthRemoteDataSource {
  AuthRemoteDataSource({
    FirebaseAuth? auth,
    required FirestoreService firestore,
  })  : _auth = auth ?? FirebaseAuth.instance,
        _firestore = firestore;

  final FirebaseAuth _auth;
  final FirestoreService _firestore;

  late final users = _firestore.collection<AppUser>(
    FirestoreCollections.users,
    fromJson: (json, id) => UserModel.fromJson(json, id: id),
    toJson: UserModel.toJson,
  );

  Stream<User?> authStateChanges() => _auth.authStateChanges();

  Stream<AppUser?> watchProfile(String uid) =>
      users.doc(uid).snapshots().map((s) => s.data());

  Future<AppUser> getProfile(String uid) => _firestore.guard(() async {
        final user = (await users.doc(uid).get()).data();
        if (user == null) {
          throw const DatabaseException(AppStrings.errorNotFound);
        }
        return user;
      });

  Future<String> signIn(String email, String password) => _authGuard(() async {
        final cred = await _auth.signInWithEmailAndPassword(
          email: email.trim(),
          password: password,
        );
        return cred.user!.uid;
      });

  Future<AppUser> register({
    required String email,
    required String password,
    required String fullName,
    required UserRole role,
    String? classId,
  }) async {
    final cred = await _authGuard(
      () => _auth.createUserWithEmailAndPassword(
        email: email.trim(),
        password: password,
      ),
    );
    final firebaseUser = cred.user!;
    await firebaseUser.updateDisplayName(fullName);

    final now = DateTime.now();
    final AppUser profile = switch (role) {
      UserRole.student => Student(
          id: firebaseUser.uid,
          fullName: fullName,
          email: email.trim(),
          createdAt: now,
          classId: classId!,
        ),
      UserRole.parent => Parent(
          id: firebaseUser.uid,
          fullName: fullName,
          email: email.trim(),
          createdAt: now,
        ),
      UserRole.teacher => Teacher(
          id: firebaseUser.uid,
          fullName: fullName,
          email: email.trim(),
          createdAt: now,
        ),
    };

    try {
      await _firestore.guard(() => users.doc(profile.id).set(profile));
    } catch (_) {
      // لا نترك حساباً بلا ملف شخصي.
      await firebaseUser.delete();
      rethrow;
    }
    return profile;
  }

  Future<void> sendPasswordReset(String email) =>
      _authGuard(() => _auth.sendPasswordResetEmail(email: email.trim()));

  Future<void> signOut() => _auth.signOut();

  Future<T> _authGuard<T>(Future<T> Function() action) async {
    try {
      return await action();
    } on FirebaseAuthException catch (e) {
      throw AuthException(_messageFor(e.code), code: e.code);
    }
  }

  static String _messageFor(String code) => switch (code) {
        'invalid-email' => 'البريد الإلكتروني غير صحيح',
        'user-disabled' => 'هذا الحساب موقوف، تواصل مع إدارة المدرسة',
        'user-not-found' ||
        'wrong-password' ||
        'invalid-credential' =>
          'البريد الإلكتروني أو كلمة المرور غير صحيحة',
        'email-already-in-use' => 'هذا البريد مسجّل مسبقاً',
        'weak-password' => 'كلمة المرور ضعيفة، استخدم 6 أحرف على الأقل',
        'too-many-requests' => 'محاولات كثيرة، انتظر قليلاً ثم حاول مجدداً',
        'network-request-failed' => AppStrings.errorNetwork,
        _ => AppStrings.errorGeneric,
      };
}
