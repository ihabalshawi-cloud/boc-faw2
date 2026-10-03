import 'package:cloud_firestore/cloud_firestore.dart';

import '../../../../core/constants/firestore_collections.dart';
import '../../../../core/firebase/firestore_service.dart';
import '../../domain/entities/assignment.dart';
import '../../domain/entities/gradebook.dart';
import '../../domain/entities/quiz_submission_outcome.dart';
import '../../domain/entities/submission.dart';
import '../models/assignment_model.dart';
import '../models/gradebook_model.dart';
import '../models/submission_model.dart';

/// الاتصال بمجموعات الواجبات والتسليمات وسجلات الدرجات.
class GradebookRemoteDataSource {
  GradebookRemoteDataSource(this._firestore);

  final FirestoreService _firestore;

  late final CollectionReference<Assignment> assignments =
      _firestore.collection<Assignment>(
    FirestoreCollections.assignments,
    fromJson: (json, id) => AssignmentModel.fromJson(json, id: id),
    toJson: (a) => AssignmentModel.fromEntity(a).toJson(),
  );

  late final CollectionReference<Submission> submissions =
      _firestore.collection<Submission>(
    FirestoreCollections.submissions,
    fromJson: (json, id) => SubmissionModel.fromJson(json, id: id),
    toJson: (s) => SubmissionModel.fromEntity(s).toJson(),
  );

  late final CollectionReference<Gradebook> gradebooks =
      _firestore.collection<Gradebook>(
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

  /// يحفظ نتيجة اختبار مصحَّح آلياً في التسليمات وفي سجل درجات الطالب
  /// ضمن معاملة (transaction) واحدة: إما أن يُحفظ الاثنان معاً أو لا شيء.
  ///
  /// تُحتسب المحاولة الأولى فقط. إذا وُجد تسليم سابق يُعاد بدون تعديل.
  Future<QuizSubmissionOutcome> submitAutoGradedQuiz({
    required Submission submission,
    required String assignmentTitle,
    required String studentName,
  }) {
    final submissionRef = submissions.doc(submission.id);
    final gradebookRef = _firestore.db
        .collection(FirestoreCollections.gradebooks)
        .doc(submission.studentId);

    return _firestore.guard(
      () => _firestore.db.runTransaction((tx) async {
        final existing = (await tx.get(submissionRef)).data();
        if (existing != null) {
          return QuizSubmissionOutcome(
            savedScore: existing.score ?? 0,
            maxScore: existing.maxScore,
            alreadySubmitted: true,
          );
        }

        final gradebookSnap = await tx.get(gradebookRef);
        final previousJson = gradebookSnap.data();
        final previous = previousJson == null
            ? null
            : GradebookModel.fromJson(previousJson, id: gradebookRef.id);

        final score = submission.score ?? 0;
        final entry = GradeEntryModel(
          assignmentId: submission.assignmentId,
          assignmentTitle: assignmentTitle,
          submissionId: submission.id,
          score: score,
          maxScore: submission.maxScore,
          gradedAt: submission.gradedAt ?? DateTime.now(),
        );
        final updated = GradebookModel(
          studentId: submission.studentId,
          studentName: studentName,
          classId: submission.classId,
          entries: [...?previous?.entries, entry],
        );

        // المجاميع = المجاميع المحفوظة + الدرجة الجديدة، بنفس المعادلة التي
        // تتحقق منها قواعد Firestore.
        final previousTotal = (previousJson?['totalScore'] as num?) ?? 0;
        final previousMax = (previousJson?['totalMaxScore'] as num?) ?? 0;

        tx.set(submissionRef, submission);
        tx.set(gradebookRef, {
          ...updated.toJson(),
          'totalScore': previousTotal + score,
          'totalMaxScore': previousMax + submission.maxScore,
          'lastAssignmentId': submission.assignmentId,
          'updatedAt': FieldValue.serverTimestamp(),
        });

        return QuizSubmissionOutcome(
          savedScore: score,
          maxScore: submission.maxScore,
          alreadySubmitted: false,
        );
      }),
    );
  }
}
