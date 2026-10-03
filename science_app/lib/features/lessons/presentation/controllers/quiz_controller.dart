import 'package:flutter/foundation.dart';

import '../../domain/entities/quiz_question.dart';
import '../../domain/entities/quiz_result.dart';

/// مراحل الاختبار.
enum QuizPhase {
  /// الطالب يختار إجابة.
  answering,

  /// ظهرت نتيجة السؤال الحالي وننتظر الضغط على "التالي".
  revealed,

  /// انتهت جميع الأسئلة.
  finished,
}

/// منطق الاختبار منفصل عن الواجهة: الأسئلة، النقاط، السلاسل، والنتيجة.
class QuizController extends ChangeNotifier {
  QuizController({
    required this.lessonId,
    required List<QuizQuestion> questions,
  })  : questions = List.unmodifiable(questions),
        _phase = questions.isEmpty ? QuizPhase.finished : QuizPhase.answering;

  final String lessonId;
  final List<QuizQuestion> questions;

  int _index = 0;
  int? _selectedIndex;
  QuizPhase _phase;
  int _points = 0;
  int _correctCount = 0;
  int _streak = 0;
  int _bestStreak = 0;
  final Map<String, int> _answers = {};

  int get currentIndex => _index;
  int get totalQuestions => questions.length;
  int? get selectedIndex => _selectedIndex;
  QuizPhase get phase => _phase;
  int get points => _points;
  int get correctCount => _correctCount;
  int get streak => _streak;
  int get bestStreak => _bestStreak;

  int get totalPoints => questions.fold(0, (sum, q) => sum + q.points);

  QuizQuestion get currentQuestion => questions[_index];

  bool get isLastQuestion => _index >= questions.length - 1;

  bool get isFinished => _phase == QuizPhase.finished;

  /// هل كانت آخر إجابة صحيحة؟ (null قبل الإجابة على السؤال الحالي)
  bool? get lastAnswerCorrect => _selectedIndex == null
      ? null
      : currentQuestion.isCorrect(_selectedIndex!);

  /// نسبة التقدّم من 0 إلى 1. السؤال المُجاب يُحتسب مكتملاً.
  double get progress {
    if (questions.isEmpty) return 1;
    final answered = _index + (_phase == QuizPhase.answering ? 0 : 1);
    return (answered / questions.length).clamp(0.0, 1.0);
  }

  /// يسجّل إجابة الطالب ويعيد true إذا كانت صحيحة.
  /// يعيد null إذا لم يكن الاختيار مسموحاً (أُجيب السؤال مسبقاً).
  bool? selectAnswer(int optionIndex) {
    if (_phase != QuizPhase.answering) return null;
    final question = currentQuestion;
    if (optionIndex < 0 || optionIndex >= question.options.length) return null;

    _selectedIndex = optionIndex;
    _answers[question.id] = optionIndex;
    _phase = QuizPhase.revealed;

    final correct = question.isCorrect(optionIndex);
    if (correct) {
      _points += question.points;
      _correctCount++;
      _streak++;
      if (_streak > _bestStreak) _bestStreak = _streak;
    } else {
      _streak = 0;
    }
    notifyListeners();
    return correct;
  }

  /// ينتقل إلى السؤال التالي، أو ينهي الاختبار بعد آخر سؤال.
  void next() {
    if (_phase != QuizPhase.revealed) return;
    if (isLastQuestion) {
      _phase = QuizPhase.finished;
    } else {
      _index++;
      _selectedIndex = null;
      _phase = QuizPhase.answering;
    }
    notifyListeners();
  }

  QuizResult get result => QuizResult(
        lessonId: lessonId,
        answers: Map.unmodifiable(_answers),
        pointsEarned: _points,
        totalPoints: totalPoints,
        correctCount: _correctCount,
        totalQuestions: questions.length,
        bestStreak: _bestStreak,
      );

  /// يعيد الاختبار من البداية.
  void restart() {
    _index = 0;
    _selectedIndex = null;
    _phase = questions.isEmpty ? QuizPhase.finished : QuizPhase.answering;
    _points = 0;
    _correctCount = 0;
    _streak = 0;
    _bestStreak = 0;
    _answers.clear();
    notifyListeners();
  }
}
