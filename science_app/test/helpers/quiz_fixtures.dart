import 'package:science_kids/features/auth/domain/entities/app_user.dart';
import 'package:science_kids/features/gradebook/domain/entities/assignment.dart';
import 'package:science_kids/features/lessons/domain/entities/lesson.dart';
import 'package:science_kids/features/lessons/domain/entities/quiz_question.dart';

/// بيانات ثابتة مشتركة بين اختبارات شاشة الاختبار.
abstract final class QuizFixtures {
  static const heartQuestion = QuizQuestion(
    id: 'q1',
    questionText: 'ما العضو الذي يضخ الدم في الجسم؟',
    options: ['الرئتان', 'القلب', 'المعدة', 'الكبد'],
    correctAnswerIndex: 1,
    points: 10,
    explanation: 'القلب عضلة تنبض حوالي 100 ألف مرة في اليوم!',
  );

  static const plantsQuestion = QuizQuestion(
    id: 'q2',
    type: QuestionType.trueFalse,
    questionText: 'النباتات تصنع غذاءها بنفسها',
    options: ['صح', 'خطأ'],
    correctAnswerIndex: QuizQuestion.trueIndex,
    points: 5,
  );

  static final lesson = Lesson(
    id: 'l1',
    title: 'جسم الإنسان والنبات',
    videoUrl: 'https://example.com/v.mp4',
    createdAt: DateTime(2026, 9, 1),
    quizList: const [heartQuestion, plantsQuestion],
    isPublished: true,
  );

  static final student = Student(
    id: 's1',
    fullName: 'سارة أحمد',
    email: 'sara@school.iq',
    createdAt: DateTime(2026, 9, 1),
    classId: '5A',
  );

  static final assignment = Assignment(
    id: 'a1',
    title: 'اختبار جسم الإنسان',
    classId: '5A',
    teacherId: 't1',
    type: AssignmentType.quiz,
    lessonId: 'l1',
    maxScore: 30,
    dueDate: DateTime(2026, 10, 30),
    createdAt: DateTime(2026, 10, 1),
    isPublished: true,
  );
}
