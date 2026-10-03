import 'package:cloud_firestore/cloud_firestore.dart';

import '../../../../core/constants/firestore_collections.dart';
import '../../../../core/firebase/firestore_service.dart';
import '../../domain/entities/assignment.dart';
import '../../domain/entities/gradebook.dart';
import '../../domain/entities/submission.dart';
import '../models/assignment_model.dart';
import '../models/gradebook_model.dart';
import '../models/submission_model.dart';

/// الاتصال بمجموعات الواجبات والتسليمات وسجلات الدرجات.
class GradebookRemoteDataSource {
  GradebookRemoteDataSource(this._firestore);

  final FirestoreService _firestore;

  late final CollectionReference<Assignment> assignments = _firestore
      .collection<Assignment>(
        FirestoreCollections.assignments,
        fromJson: (json, id) => AssignmentModel.fromJson(json, id: id),
        toJson: (a) => AssignmentModel.fromEntity(a).toJson(),
      );

  late final CollectionReference<Submission> submissions = _firestore
      .collection<Submission>(
        FirestoreCollections.submissions,
        fromJson: (json, id) => SubmissionModel.fromJson(json, id: id),
        toJson: (s) => SubmissionModel.fromEntity(s).toJson(),
      );

  late final CollectionReference<Gradebook> gradebooks = _firestore
      .collection<Gradebook>(
        FirestoreCollections.gradebooks,
        fromJson: (json, id) => GradebookModel.fromJson(json, id: id),
        toJson: (g) => GradebookModel.fromEntity(g).toJson(),
      );

  /// واجبات الشعبة المنشورة، الأقرب موعداً أولاً.
  Stream<List<Assignment>> watchClassAssignments(String classId) => assignments
      .where('classId', isEqualTo: classId)
      .where('isPublished', isEqualTo: true)
      .orderBy('dueDate')
      .snapshots()
      .map((q) => q.docs.map((d) => d.data()).toList());

  /// تسليم الطالب لواجب معيّن.
  Future<void> submit(Submission submission) =>
      _firestore.guard(() => submissions.doc(submission.id).set(submission));

  /// تسليمات واجب معيّن (لصفحة التصحيح عند المعلّم).
  Stream<List<Submission>> watchAssignmentSubmissions(String assignmentId) =>
      submissions
          .where('assignmentId', isEqualTo: assignmentId)
          .snapshots()
          .map((q) => q.docs.map((d) => d.data()).toList());

  /// سجل درجات الطالب (للطالب ووليّ الأمر).
  Stream<Gradebook?> watchGradebook(String studentId) =>
      gradebooks.doc(studentId).snapshots().map((s) => s.data());
}
