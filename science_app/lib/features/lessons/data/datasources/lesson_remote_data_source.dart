import 'package:cloud_firestore/cloud_firestore.dart';

import '../../../../core/constants/firestore_collections.dart';
import '../../../../core/firebase/firestore_service.dart';
import '../../domain/entities/lesson.dart';
import '../models/lesson_model.dart';

/// الاتصال بمجموعة `lessons` في Firestore.
class LessonRemoteDataSource {
  LessonRemoteDataSource(this._firestore);

  final FirestoreService _firestore;

  late final CollectionReference<Lesson> lessons =
      _firestore.collection<Lesson>(
    FirestoreCollections.lessons,
    fromJson: (json, id) => LessonModel.fromJson(json, id: id),
    toJson: (lesson) => LessonModel.fromEntity(lesson).toJson(),
  );

  /// الدروس المنشورة مرتبة حسب تسلسلها (للطالب ووليّ الأمر).
  Stream<List<Lesson>> watchPublishedLessons() => lessons
      .where('isPublished', isEqualTo: true)
      .orderBy('order')
      .snapshots()
      .map((q) => q.docs.map((d) => d.data()).toList());

  Future<Lesson?> getLesson(String id) =>
      _firestore.guard(() async => (await lessons.doc(id).get()).data());

  /// إنشاء درس جديد أو تعديله (للمعلّم).
  Future<void> saveLesson(Lesson lesson) =>
      _firestore.guard(() => lessons.doc(lesson.id).set(lesson));
}
