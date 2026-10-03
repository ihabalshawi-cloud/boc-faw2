import 'package:fake_cloud_firestore/fake_cloud_firestore.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:science_kids/core/errors/exceptions.dart';
import 'package:science_kids/core/firebase/firestore_service.dart';
import 'package:science_kids/features/gradebook/data/datasources/gradebook_remote_data_source.dart';
import 'package:science_kids/features/gradebook/data/repositories/gradebook_repository_impl.dart';
import 'package:science_kids/features/gradebook/domain/entities/assignment.dart';
import 'package:science_kids/features/lessons/domain/entities/quiz_result.dart';

import '../../helpers/quiz_fixtures.dart';

void main() {
  late FakeFirebaseFirestore db;
  late GradebookRepositoryImpl repo;

  const result = QuizResult(
    lessonId: 'l1',
    answers: {'q1': 1, 'q2': 0},
    pointsEarned: 10,
    totalPoints: 15,
    correctCount: 1,
    totalQuestions: 2,
    bestStreak: 1,
  );

  setUp(() {
    db = FakeFirebaseFirestore();
    repo = GradebookRepositoryImpl(
      GradebookRemoteDataSource(FirestoreService(firestore: db)),
    );
  });

  test('يحفظ التسليم وسجل الدرجات معاً', () async {
    final outcome = await repo.submitQuizResult(
      student: QuizFixtures.student,
      assignment: QuizFixtures.assignment,
      result: result,
    );

    expect(outcome.alreadySubmitted, isFalse);
    expect(outcome.savedScore, 20); // 10/15 × 30
    expect(outcome.maxScore, 30);

    final sub = (await db.doc('submissions/a1_s1').get()).data()!;
    expect(sub['status'], 'graded');
    expect(sub['gradedBy'], 'auto');
    expect(sub['score'], 20);
    expect(sub['quizAnswers'], {'q1': 1, 'q2': 0});

    final gb = (await db.doc('gradebooks/s1').get()).data()!;
    expect(gb['totalScore'], 20);
    expect(gb['totalMaxScore'], 30);
    expect(gb['lastAssignmentId'], 'a1');
    expect(gb['studentName'], 'سارة أحمد');
    expect((gb['entries'] as Map)['a1']['score'], 20);
  });

  test('المحاولة الثانية لا تغيّر الدرجة الأولى', () async {
    await repo.submitQuizResult(
      student: QuizFixtures.student,
      assignment: QuizFixtures.assignment,
      result: result,
    );
    final second = await repo.submitQuizResult(
      student: QuizFixtures.student,
      assignment: QuizFixtures.assignment,
      result: const QuizResult(
        lessonId: 'l1',
        answers: {'q1': 1, 'q2': 0},
        pointsEarned: 15,
        totalPoints: 15,
        correctCount: 2,
        totalQuestions: 2,
        bestStreak: 2,
      ),
    );

    expect(second.alreadySubmitted, isTrue);
    expect(second.savedScore, 20);
    final gb = (await db.doc('gradebooks/s1').get()).data()!;
    expect(gb['totalScore'], 20);
  });

  test('اختبار ثانٍ يُضاف إلى المجاميع السابقة', () async {
    await repo.submitQuizResult(
      student: QuizFixtures.student,
      assignment: QuizFixtures.assignment,
      result: result,
    );
    final other = Assignment(
      id: 'a2',
      title: 'اختبار النبات',
      classId: '5A',
      teacherId: 't1',
      type: AssignmentType.quiz,
      maxScore: 10,
      dueDate: DateTime(2026, 11, 1),
      createdAt: DateTime(2026, 10, 2),
    );
    await repo.submitQuizResult(
      student: QuizFixtures.student,
      assignment: other,
      result: result,
    );

    final gb = (await db.doc('gradebooks/s1').get()).data()!;
    expect(gb['totalScore'], 20 + 7); // 10/15 × 10 = 6.67 ← 7
    expect(gb['totalMaxScore'], 40);
    expect((gb['entries'] as Map).keys, containsAll(['a1', 'a2']));
  });

  test('يرفض واجباً ليس اختباراً أو لشعبة أخرى', () async {
    final homework = Assignment(
      id: 'h1',
      title: 'واجب',
      classId: '5A',
      teacherId: 't1',
      dueDate: DateTime(2026, 11, 1),
      createdAt: DateTime(2026, 10, 2),
    );
    expect(
      () => repo.submitQuizResult(
        student: QuizFixtures.student,
        assignment: homework,
        result: result,
      ),
      throwsA(isA<DatabaseException>()),
    );

    final otherClass = Assignment(
      id: 'a9',
      title: 'اختبار',
      classId: '5B',
      teacherId: 't1',
      type: AssignmentType.quiz,
      dueDate: DateTime(2026, 11, 1),
      createdAt: DateTime(2026, 10, 2),
    );
    expect(
      () => repo.submitQuizResult(
        student: QuizFixtures.student,
        assignment: otherClass,
        result: result,
      ),
      throwsA(isA<DatabaseException>()),
    );
  });
}
