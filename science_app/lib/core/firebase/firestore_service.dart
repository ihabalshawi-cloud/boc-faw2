import 'package:cloud_firestore/cloud_firestore.dart';

import '../constants/app_strings.dart';
import '../errors/exceptions.dart';

/// نقطة الوصول الوحيدة إلى Firestore.
/// توفّر مجموعات مُنمّطة (typed) وتحويل أخطاء Firebase إلى رسائل عربية.
class FirestoreService {
  FirestoreService({FirebaseFirestore? firestore})
      : _db = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _db;

  FirebaseFirestore get db => _db;

  /// مجموعة مُنمّطة: القراءة والكتابة تتم بالنموذج مباشرة بدل Map.
  CollectionReference<T> collection<T>(
    String path, {
    required T Function(Map<String, dynamic> json, String id) fromJson,
    required Map<String, dynamic> Function(T value) toJson,
  }) {
    return _db.collection(path).withConverter<T>(
          fromFirestore: (snap, _) => fromJson(snap.data() ?? {}, snap.id),
          toFirestore: (value, _) => toJson(value),
        );
  }

  /// ينفّذ عملية Firestore ويحوّل أي خطأ إلى [DatabaseException] برسالة عربية.
  Future<T> guard<T>(Future<T> Function() action) async {
    try {
      return await action();
    } on FirebaseException catch (e) {
      throw DatabaseException(_messageFor(e.code), code: e.code);
    } on AppException {
      rethrow;
    } catch (_) {
      throw const DatabaseException(AppStrings.errorGeneric);
    }
  }

  static String _messageFor(String code) => switch (code) {
        'permission-denied' => AppStrings.errorPermission,
        'not-found' => AppStrings.errorNotFound,
        'unavailable' || 'deadline-exceeded' => AppStrings.errorNetwork,
        _ => AppStrings.errorGeneric,
      };
}
