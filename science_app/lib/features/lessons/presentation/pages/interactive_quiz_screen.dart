import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../../core/constants/app_strings.dart';
import '../../../../core/errors/exceptions.dart';
import '../../../../core/firebase/firestore_service.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../auth/domain/entities/app_user.dart';
import '../../../gradebook/data/datasources/gradebook_remote_data_source.dart';
import '../../../gradebook/data/repositories/gradebook_repository_impl.dart';
import '../../../gradebook/domain/entities/assignment.dart';
import '../../../gradebook/domain/entities/quiz_submission_outcome.dart';
import '../../../gradebook/domain/repositories/gradebook_repository.dart';
import '../../domain/entities/lesson.dart';
import '../controllers/quiz_controller.dart';
import '../widgets/quiz/answer_feedback_animator.dart';
import '../widgets/quiz/celebration_overlay.dart';
import '../widgets/quiz/multiple_choice_options.dart';
import '../widgets/quiz/question_card.dart';
import '../widgets/quiz/quiz_feedback_panel.dart';
import '../widgets/quiz/quiz_progress_header.dart';
import '../widgets/quiz/quiz_result_view.dart';
import '../widgets/quiz/true_false_options.dart';

/// شاشة الاختبار التفاعلي للأطفال.
///
/// - تعرض أسئلة الدرس واحداً تلو الآخر (اختيار من متعدد أو صح وخطأ).
/// - تزيد النقاط مباشرة وتُظهر احتفالاً كارتونياً عند كل إجابة صحيحة.
/// - في النهاية تعرض النتيجة، وإذا مُرّر [assignment] ترسل الدرجة
///   تلقائياً إلى Firestore لتُحفظ في سجل المعلّمة.
///
/// مثال:
/// ```dart
/// Navigator.of(context).push(MaterialPageRoute(
///   builder: (_) => InteractiveQuizScreen(
///     lesson: lesson,
///     student: currentStudent,
///     assignment: quizAssignment, // اتركه null للاختبار التدريبي
///   ),
/// ));
/// ```
class InteractiveQuizScreen extends StatefulWidget {
  const InteractiveQuizScreen({
    super.key,
    required this.lesson,
    required this.student,
    this.assignment,
    this.gradebookRepository,
  });

  final Lesson lesson;
  final Student student;

  /// واجب من نوع "اختبار قصير" مرتبط بالدرس. إذا كان null فالاختبار تدريبي.
  final Assignment? assignment;

  /// يُمرَّر في الاختبارات أو عند استخدام حاقن تبعيات.
  /// الافتراضي هو المستودع المتصل بـ Firestore.
  final GradebookRepository? gradebookRepository;

  @override
  State<InteractiveQuizScreen> createState() => _InteractiveQuizScreenState();
}

class _InteractiveQuizScreenState extends State<InteractiveQuizScreen> {
  late final QuizController _quiz = QuizController(
    lessonId: widget.lesson.id,
    questions: widget.lesson.quizList,
  );

  // يُنشأ عند أول استخدام فقط، فلا يُلمس Firebase في الاختبار التدريبي.
  late final GradebookRepository _gradebook = widget.gradebookRepository ??
      GradebookRepositoryImpl(GradebookRemoteDataSource(FirestoreService()));

  final _random = math.Random();

  // الاحتفال
  int _celebrationTrigger = 0;
  String _celebrationMessage = '';
  String? _celebrationSubtitle;
  int _celebrationPoints = 0;

  // رسالة التشجيع عند الخطأ
  String _encouragement = '';

  // حفظ الدرجة
  ScoreSaveStatus _saveStatus = ScoreSaveStatus.practice;
  QuizSubmissionOutcome? _outcome;
  String? _saveError;

  @override
  void dispose() {
    _quiz.dispose();
    super.dispose();
  }

  bool get _quizInProgress =>
      !_quiz.isFinished &&
      (_quiz.currentIndex > 0 || _quiz.phase != QuizPhase.answering);

  // ---------------------------------------------------------------------------
  // الأحداث
  // ---------------------------------------------------------------------------

  void _onAnswer(int optionIndex) {
    final question = _quiz.currentQuestion;
    final correct = _quiz.selectAnswer(optionIndex);
    if (correct == null) return;

    if (correct) {
      HapticFeedback.mediumImpact();
      setState(() {
        _celebrationTrigger++;
        _celebrationMessage = _pick(AppStrings.praises);
        _celebrationPoints = question.points;
        _celebrationSubtitle = _quiz.streak >= 3
            ? '${AppStrings.streakBonus} ×${_quiz.streak}'
            : null;
      });
    } else {
      HapticFeedback.heavyImpact();
      setState(() => _encouragement = _pick(AppStrings.encouragements));
    }
  }

  void _onNext() {
    _quiz.next();
    if (_quiz.isFinished) _submitScore();
  }

  Future<void> _submitScore() async {
    final assignment = widget.assignment;
    if (assignment == null) {
      setState(() => _saveStatus = ScoreSaveStatus.practice);
      return;
    }

    setState(() {
      _saveStatus = ScoreSaveStatus.saving;
      _saveError = null;
    });

    try {
      final outcome = await _gradebook.submitQuizResult(
        student: widget.student,
        assignment: assignment,
        result: _quiz.result,
      );
      if (!mounted) return;
      setState(() {
        _outcome = outcome;
        _saveStatus = outcome.alreadySubmitted
            ? ScoreSaveStatus.alreadySubmitted
            : ScoreSaveStatus.saved;
      });
    } on AppException catch (e) {
      if (!mounted) return;
      setState(() {
        _saveStatus = ScoreSaveStatus.failed;
        _saveError = '${AppStrings.scoreSaveFailed}: ${e.message}';
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _saveStatus = ScoreSaveStatus.failed;
        _saveError = AppStrings.scoreSaveFailed;
      });
    }
  }

  void _playAgain() {
    setState(() {
      _encouragement = '';
      _outcome = null;
      _saveError = null;
      _saveStatus = ScoreSaveStatus.practice;
    });
    _quiz.restart();
  }

  void _exit() => Navigator.of(context).maybePop();

  Future<void> _handleBlockedPop() async {
    final leave = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
        title:
            const Text(AppStrings.exitQuizTitle, textAlign: TextAlign.center),
        content: const Text(
          AppStrings.exitQuizBody,
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 17),
        ),
        actionsAlignment: MainAxisAlignment.center,
        actions: [
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(false),
            style: ElevatedButton.styleFrom(minimumSize: const Size(120, 48)),
            child: const Text(AppStrings.stay),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text(
              AppStrings.exit,
              style: TextStyle(color: AppColors.wrong, fontSize: 18),
            ),
          ),
        ],
      ),
    );
    if (leave == true && mounted) Navigator.of(context).pop();
  }

  String _pick(List<String> items) => items[_random.nextInt(items.length)];

  AnswerVisualState _stateFor(int index) {
    if (_quiz.phase != QuizPhase.revealed) return AnswerVisualState.idle;
    if (index == _quiz.currentQuestion.correctAnswerIndex) {
      return AnswerVisualState.correct;
    }
    if (index == _quiz.selectedIndex) return AnswerVisualState.wrong;
    return AnswerVisualState.dimmed;
  }

  // ---------------------------------------------------------------------------
  // الواجهة
  // ---------------------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: _quiz,
      builder: (context, _) => PopScope(
        canPop: !_quizInProgress,
        onPopInvokedWithResult: (didPop, _) {
          if (!didPop) _handleBlockedPop();
        },
        child: Scaffold(
          appBar: AppBar(title: Text(widget.lesson.title)),
          body: DecoratedBox(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [AppColors.background, Color(0xFFE1F5FE)],
              ),
            ),
            child: SafeArea(top: false, child: _buildBody()),
          ),
        ),
      ),
    );
  }

  Widget _buildBody() {
    if (_quiz.questions.isEmpty) return const _EmptyQuiz();

    if (_quiz.isFinished) {
      return QuizResultView(
        result: _quiz.result,
        saveStatus: _saveStatus,
        outcome: _outcome,
        errorMessage: _saveError,
        onRetrySave: _submitScore,
        onPlayAgain: _playAgain,
        onExit: _exit,
      );
    }

    final question = _quiz.currentQuestion;
    return Stack(
      children: [
        Column(
          children: [
            QuizProgressHeader(
              questionNumber: _quiz.currentIndex + 1,
              totalQuestions: _quiz.totalQuestions,
              progress: _quiz.progress,
              points: _quiz.points,
              streak: _quiz.streak,
            ),
            Expanded(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 400),
                transitionBuilder: (child, animation) => FadeTransition(
                  opacity: animation,
                  child: SlideTransition(
                    position: Tween(
                      begin: const Offset(0.15, 0),
                      end: Offset.zero,
                    ).animate(animation),
                    child: child,
                  ),
                ),
                child: SingleChildScrollView(
                  key: ValueKey('question-${question.id}'),
                  padding: const EdgeInsets.fromLTRB(16, 20, 16, 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      QuestionCard(
                        question: question,
                        number: _quiz.currentIndex + 1,
                      ),
                      const SizedBox(height: 24),
                      if (question.isTrueFalse)
                        TrueFalseOptions(
                          stateFor: _stateFor,
                          onSelected: _onAnswer,
                        )
                      else
                        MultipleChoiceOptions(
                          options: question.options,
                          stateFor: _stateFor,
                          onSelected: _onAnswer,
                        ),
                    ],
                  ),
                ),
              ),
            ),
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 300),
              transitionBuilder: (child, animation) => SizeTransition(
                sizeFactor: animation,
                child: child,
              ),
              child: _quiz.phase == QuizPhase.revealed
                  ? QuizFeedbackPanel(
                      key: ValueKey('feedback-${question.id}'),
                      question: question,
                      correct: _quiz.lastAnswerCorrect ?? false,
                      encouragement: _encouragement,
                      isLast: _quiz.isLastQuestion,
                      onNext: _onNext,
                    )
                  : const SizedBox.shrink(),
            ),
          ],
        ),
        Positioned.fill(
          child: CelebrationOverlay(
            // مفتاح لكل سؤال: الانتقال للسؤال التالي يخفي احتفال السابق فوراً.
            key: ValueKey('celebration-${question.id}'),
            trigger: _celebrationTrigger,
            message: _celebrationMessage,
            subtitle: _celebrationSubtitle,
            pointsGained: _celebrationPoints,
          ),
        ),
      ],
    );
  }
}

class _EmptyQuiz extends StatelessWidget {
  const _EmptyQuiz();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Padding(
        padding: EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('🧪', style: TextStyle(fontSize: 90)),
            SizedBox(height: 12),
            Text(
              AppStrings.noQuestions,
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),
    );
  }
}
