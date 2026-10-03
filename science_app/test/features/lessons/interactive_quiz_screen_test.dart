import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:science_kids/core/constants/app_strings.dart';
import 'package:science_kids/core/errors/exceptions.dart';
import 'package:science_kids/features/auth/domain/entities/app_user.dart';
import 'package:science_kids/features/gradebook/domain/entities/assignment.dart';
import 'package:science_kids/features/gradebook/domain/entities/quiz_submission_outcome.dart';
import 'package:science_kids/features/gradebook/domain/repositories/gradebook_repository.dart';
import 'package:science_kids/features/lessons/domain/entities/quiz_result.dart';
import 'package:science_kids/features/lessons/presentation/pages/interactive_quiz_screen.dart';

import '../../helpers/quiz_fixtures.dart';

/// مستودع وهمي يسجّل الاستدعاءات ويرد بالنتائج المحددة مسبقاً.
class FakeGradebookRepository implements GradebookRepository {
  FakeGradebookRepository(this.responses);

  final List<Future<QuizSubmissionOutcome> Function()> responses;
  final List<QuizResult> submitted = [];

  @override
  Future<QuizSubmissionOutcome> submitQuizResult({
    required Student student,
    required Assignment assignment,
    required QuizResult result,
  }) {
    submitted.add(result);
    return responses.removeAt(0)();
  }
}

void main() {
  Future<void> pumpScreen(
    WidgetTester tester, {
    Assignment? assignment,
    GradebookRepository? repo,
  }) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 2.5;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(
      MaterialApp(
        locale: const Locale('ar'),
        supportedLocales: const [Locale('ar')],
        localizationsDelegates: const [
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        home: InteractiveQuizScreen(
          lesson: QuizFixtures.lesson,
          student: QuizFixtures.student,
          assignment: assignment,
          gradebookRepository: repo,
        ),
      ),
    );
    await tester.pump();
  }

  /// إطار أول لتبدأ الحركات، ثم تقديم الوقت حتى تكتمل.
  Future<void> advance(WidgetTester tester, Duration duration) async {
    await tester.pump();
    await tester.pump(duration);
  }

  String pointsText(WidgetTester tester) =>
      tester.widget<Text>(find.byKey(const ValueKey('quiz-points'))).data!;

  /// يجيب السؤال الأول صحيحاً والثاني خطأً، ثم يفتح شاشة النتيجة.
  Future<void> playWholeQuiz(WidgetTester tester) async {
    await tester.tap(find.byKey(const ValueKey('mc-option-1')));
    await advance(tester, const Duration(seconds: 1));
    await tester.tap(find.byKey(const ValueKey('next-button')));
    await advance(tester, const Duration(milliseconds: 600));
    await tester.tap(find.byKey(const ValueKey('tf-false')));
    await advance(tester, const Duration(seconds: 1));
    await tester.tap(find.byKey(const ValueKey('next-button')));
    await advance(tester, const Duration(seconds: 3));
  }

  testWidgets('الإجابة الصحيحة: احتفال كارتوني وزيادة النقاط', (tester) async {
    await pumpScreen(tester);

    expect(find.text(QuizFixtures.heartQuestion.questionText), findsOneWidget);
    expect(find.text('${AppStrings.questionOf} 1 ${AppStrings.of} 2'),
        findsOneWidget);
    expect(pointsText(tester), '0');

    await tester.tap(find.byKey(const ValueKey('mc-option-1')));
    await advance(tester, const Duration(milliseconds: 300));

    expect(find.byKey(const ValueKey('celebration-bubble')), findsOneWidget);
    final praise = AppStrings.praises.where(
      (p) => find.text(p).evaluate().isNotEmpty,
    );
    expect(praise, hasLength(1));
    expect(find.text(AppStrings.correctAnswer), findsOneWidget);
    expect(find.textContaining(AppStrings.didYouKnow), findsOneWidget);

    await advance(tester, const Duration(seconds: 1));
    expect(pointsText(tester), '10');

    // بعد انتهاء الاحتفال يختفي وحده.
    await advance(tester, const Duration(seconds: 2));
    expect(find.byKey(const ValueKey('celebration-bubble')), findsNothing);
  });

  testWidgets('صح أو خطأ: الإجابة الخاطئة تعرض التشجيع والإجابة الصحيحة',
      (tester) async {
    await pumpScreen(tester);
    await tester.tap(find.byKey(const ValueKey('mc-option-1')));
    await advance(tester, const Duration(seconds: 1));
    await tester.tap(find.byKey(const ValueKey('next-button')));
    await advance(tester, const Duration(milliseconds: 600));

    expect(find.text(QuizFixtures.plantsQuestion.questionText), findsOneWidget);
    expect(find.text(AppStrings.trueOrFalse), findsOneWidget);

    await tester.tap(find.byKey(const ValueKey('tf-false')));
    await advance(tester, const Duration(milliseconds: 300));

    final message = tester
        .widget<Text>(find.byKey(const ValueKey('feedback-message')))
        .data;
    expect(AppStrings.encouragements, contains(message));
    expect(
      find.text('${AppStrings.theCorrectAnswerIs} ${AppStrings.trueLabel}'),
      findsOneWidget,
    );
    expect(find.byKey(const ValueKey('celebration-bubble')), findsNothing);
    expect(find.text(AppStrings.showResult), findsOneWidget);

    // النقاط لم تتغير بعد الخطأ.
    await advance(tester, const Duration(seconds: 1));
    expect(pointsText(tester), '10');
  });

  testWidgets('نهاية الاختبار: النتيجة وإرسال الدرجة تلقائياً', (tester) async {
    final repo = FakeGradebookRepository([
      () async => const QuizSubmissionOutcome(
            savedScore: 20,
            maxScore: 30,
            alreadySubmitted: false,
          ),
    ]);
    await pumpScreen(tester, assignment: QuizFixtures.assignment, repo: repo);
    await playWholeQuiz(tester);

    expect(repo.submitted, hasLength(1));
    expect(repo.submitted.single.pointsEarned, 10);
    expect(repo.submitted.single.answers, {'q1': 1, 'q2': 1});

    expect(
      tester.widget<Text>(find.byKey(const ValueKey('result-points'))).data,
      '10 / 15',
    );
    expect(find.text(AppStrings.resultGood), findsOneWidget); // 66% = نجمة
    expect(find.text(AppStrings.scoreSaved), findsOneWidget);
    expect(find.text('${AppStrings.score}: 20 / 30'), findsOneWidget);
  });

  testWidgets('فشل الحفظ يعرض زر إعادة المحاولة', (tester) async {
    final repo = FakeGradebookRepository([
      () async => throw const DatabaseException(AppStrings.errorNetwork),
      () async => const QuizSubmissionOutcome(
            savedScore: 20,
            maxScore: 30,
            alreadySubmitted: false,
          ),
    ]);
    await pumpScreen(tester, assignment: QuizFixtures.assignment, repo: repo);
    await playWholeQuiz(tester);

    expect(
      find.text('${AppStrings.scoreSaveFailed}: ${AppStrings.errorNetwork}'),
      findsOneWidget,
    );

    await tester.tap(find.text(AppStrings.retry));
    await advance(tester, const Duration(milliseconds: 500));

    expect(repo.submitted, hasLength(2));
    expect(find.text(AppStrings.scoreSaved), findsOneWidget);
  });

  testWidgets('الاختبار التدريبي لا يرسل الدرجة', (tester) async {
    final repo = FakeGradebookRepository([]);
    await pumpScreen(tester, repo: repo);
    await playWholeQuiz(tester);

    expect(repo.submitted, isEmpty);
    expect(find.text(AppStrings.practiceMode), findsOneWidget);

    await tester.tap(find.text(AppStrings.playAgain));
    await advance(tester, const Duration(milliseconds: 600));
    expect(find.text(QuizFixtures.heartQuestion.questionText), findsOneWidget);
    expect(pointsText(tester), '0');
  });

  testWidgets('الرجوع أثناء الاختبار يطلب التأكيد', (tester) async {
    await pumpScreen(tester);
    await tester.tap(find.byKey(const ValueKey('mc-option-0')));
    await advance(tester, const Duration(seconds: 1));

    final dynamic state = tester.state(find.byType(Navigator));
    await state.maybePop();
    await advance(tester, const Duration(milliseconds: 500));

    expect(find.text(AppStrings.exitQuizTitle), findsOneWidget);
    await tester.tap(find.text(AppStrings.stay));
    await advance(tester, const Duration(milliseconds: 500));
    expect(find.text(AppStrings.exitQuizTitle), findsNothing);
    expect(find.byType(InteractiveQuizScreen), findsOneWidget);
  });
}
