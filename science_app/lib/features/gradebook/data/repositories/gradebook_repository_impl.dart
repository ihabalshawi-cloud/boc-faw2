import '../../../../core/errors/exceptions.dart';
import '../../../auth/domain/entities/app_user.dart';
import '../../../lessons/domain/entities/quiz_result.dart';
import '../../domain/entities/assignment.dart';
import '../../domain/entities/quiz_submission_outcome.dart';
import '../../domain/entities/submission.dart';
import '../../domain/repositories/gradebook_repository.dart';
import '../datasources/gradebook_remote_data_source.dart';
import '../models/submission_model.dart';

class GradebookRepositoryImpl implements GradebookRepository {
  GradebookRepositoryImpl(this._remote);

  final GradebookRemoteDataSource _remote;

  /// قيمة `gradedBy` للتسليمات المصحَّحة آلياً.
  static const autoGrader = 'auto';

  @override
  Future<QuizSubmissionOutcome> submitQuizResult({
    required Student student,
    required Assignment assignment,
    required QuizResult result,
  }) async {
    if (assignment.type != AssignmentType.quiz) {
      throw const DatabaseException('هذا الواجب ليس اختباراً');
    }
    if (assignment.classId != student.classId) {
      throw const DatabaseException('هذا الاختبار ليس لشعبتك');
    }

    final now = DateTime.now();
    final submission = Submission(
      id: SubmissionModel.buildId(assignment.id, student.id),
      assignmentId: assignment.id,
      studentId: student.id,
      classId: assignment.classId,
      maxScore: assignment.maxScore,
      status: SubmissionStatus.graded,
      quizAnswers: result.answers,
      score: result.scaledScore(assignment.maxScore).toDouble(),
      submittedAt: now,
      gradedAt: now,
      gradedBy: autoGrader,
    );

    return _remote.submitAutoGradedQuiz(
      submission: submission,
      assignmentTitle: assignment.title,
      studentName: student.fullName,
    );
  }
}
