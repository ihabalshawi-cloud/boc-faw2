import 'package:flutter_test/flutter_test.dart';
import 'package:science_kids/features/lessons/presentation/controllers/quiz_controller.dart';

import '../../helpers/quiz_fixtures.dart';

void main() {
  late QuizController quiz;

  setUp(() {
    quiz = QuizController(
      lessonId: 'l1',
      questions: QuizFixtures.lesson.quizList,
    );
  });

  test('الإجابة الصحيحة تزيد النقاط والسلسلة', () {
    expect(quiz.selectAnswer(1), isTrue);
    expect(quiz.points, 10);
    expect(quiz.streak, 1);
    expect(quiz.phase, QuizPhase.revealed);
    expect(quiz.progress, 0.5);
  });

  test('لا يمكن الإجابة مرتين على السؤال نفسه', () {
    quiz.selectAnswer(0);
    expect(quiz.selectAnswer(1), isNull);
    expect(quiz.points, 0);
    expect(quiz.lastAnswerCorrect, isFalse);
  });

  test('يرفض رقم خيار خارج النطاق', () {
    expect(quiz.selectAnswer(9), isNull);
    expect(quiz.phase, QuizPhase.answering);
  });

  test('ينتهي بعد آخر سؤال ويحسب النتيجة', () {
    quiz.selectAnswer(1); // صحيح +10
    quiz.next();
    quiz.selectAnswer(1); // خطأ
    quiz.next();

    expect(quiz.isFinished, isTrue);
    final result = quiz.result;
    expect(result.pointsEarned, 10);
    expect(result.totalPoints, 15);
    expect(result.correctCount, 1);
    expect(result.answers, {'q1': 1, 'q2': 1});
    expect(result.bestStreak, 1);
    expect(result.stars, 1); // 66%
    expect(result.scaledScore(30), 20);
  });

  test('إعادة الاختبار تصفّر كل شيء', () {
    quiz.selectAnswer(1);
    quiz.next();
    quiz.restart();
    expect(quiz.currentIndex, 0);
    expect(quiz.points, 0);
    expect(quiz.result.answers, isEmpty);
    expect(quiz.phase, QuizPhase.answering);
  });

  test('درس بلا أسئلة يبدأ منتهياً', () {
    final empty = QuizController(lessonId: 'x', questions: const []);
    expect(empty.isFinished, isTrue);
    expect(empty.result.percentage, 0);
  });
}
