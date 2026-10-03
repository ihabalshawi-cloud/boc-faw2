import 'package:flutter/material.dart';

import '../../../../../core/constants/app_strings.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../gradebook/domain/entities/quiz_submission_outcome.dart';
import '../../../domain/entities/quiz_result.dart';

/// حالة إرسال الدرجة إلى سجل المعلّمة.
enum ScoreSaveStatus {
  /// لا يوجد واجب مرتبط، فالاختبار تدريبي فقط.
  practice,
  saving,
  saved,

  /// الطالب حلّ الاختبار سابقاً، فبقيت درجته الأولى.
  alreadySubmitted,
  failed,
}

/// شاشة النتيجة النهائية: النجوم، النقاط، الإحصائيات، وحالة حفظ الدرجة.
class QuizResultView extends StatelessWidget {
  const QuizResultView({
    super.key,
    required this.result,
    required this.saveStatus,
    required this.onPlayAgain,
    required this.onExit,
    this.outcome,
    this.errorMessage,
    this.onRetrySave,
  });

  final QuizResult result;
  final ScoreSaveStatus saveStatus;
  final QuizSubmissionOutcome? outcome;
  final String? errorMessage;
  final VoidCallback? onRetrySave;
  final VoidCallback onPlayAgain;
  final VoidCallback onExit;

  String get _title => switch (result.stars) {
        3 => AppStrings.resultPerfect,
        2 => AppStrings.resultGreat,
        1 => AppStrings.resultGood,
        _ => AppStrings.resultTryAgain,
      };

  String get _trophy => switch (result.stars) {
        3 => '🏆',
        2 => '🥇',
        1 => '🎈',
        _ => '🌱',
      };

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          TweenAnimationBuilder<double>(
            tween: Tween(begin: 0, end: 1),
            duration: const Duration(milliseconds: 900),
            curve: Curves.elasticOut,
            builder: (context, v, child) =>
                Transform.scale(scale: v, child: child),
            child: Text(_trophy, style: const TextStyle(fontSize: 110)),
          ),
          Text(
            _title,
            key: const ValueKey('result-title'),
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w900,
              color: AppColors.textDark,
            ),
          ),
          const SizedBox(height: 12),
          _StarsRow(stars: result.stars),
          const SizedBox(height: 20),
          _buildPointsCard(),
          const SizedBox(height: 16),
          _buildStats(),
          const SizedBox(height: 16),
          _SaveStatusCard(
            status: saveStatus,
            outcome: outcome,
            errorMessage: errorMessage,
            onRetry: onRetrySave,
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: onPlayAgain,
            icon: const Icon(Icons.replay_rounded),
            label: const Text(AppStrings.playAgain),
          ),
          const SizedBox(height: 12),
          TextButton.icon(
            onPressed: onExit,
            icon: const Icon(Icons.menu_book_rounded),
            label: const Text(
              AppStrings.backToLessons,
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPointsCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.secondary, AppColors.fun],
        ),
        borderRadius: BorderRadius.circular(28),
      ),
      child: Column(
        children: [
          const Text(
            AppStrings.pointsEarned,
            style: TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          TweenAnimationBuilder<int>(
            tween: IntTween(begin: 0, end: result.pointsEarned),
            duration: const Duration(milliseconds: 1200),
            builder: (context, value, _) => Text(
              '$value / ${result.totalPoints}',
              key: const ValueKey('result-points'),
              textDirection: TextDirection.ltr,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 44,
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStats() {
    return Row(
      children: [
        Expanded(
          child: _StatTile(
            emoji: '✅',
            label: AppStrings.correctAnswers,
            value: '${result.correctCount} / ${result.totalQuestions}',
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _StatTile(
            emoji: '📊',
            label: AppStrings.percentage,
            value: '${result.percentage.round()}%',
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _StatTile(
            emoji: '🔥',
            label: AppStrings.bestStreak,
            value: '${result.bestStreak}',
          ),
        ),
      ],
    );
  }
}

/// ثلاث نجوم تظهر واحدة تلو الأخرى.
class _StarsRow extends StatelessWidget {
  const _StarsRow({required this.stars});

  final int stars;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        for (var i = 0; i < 3; i++)
          TweenAnimationBuilder<double>(
            tween: Tween(begin: 0, end: 1),
            duration: Duration(milliseconds: 500 + i * 300),
            curve: Curves.elasticOut,
            builder: (context, v, child) =>
                Transform.scale(scale: v, child: child),
            child: Icon(
              Icons.star_rounded,
              size: i == 1 ? 72 : 56,
              color: i < stars ? AppColors.secondary : Colors.grey.shade300,
            ),
          ),
      ],
    );
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({
    required this.emoji,
    required this.label,
    required this.value,
  });

  final String emoji;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        boxShadow: const [
          BoxShadow(color: Colors.black12, blurRadius: 8, offset: Offset(0, 3)),
        ],
      ),
      child: Column(
        children: [
          Text(emoji, style: const TextStyle(fontSize: 28)),
          const SizedBox(height: 4),
          Text(
            value,
            textDirection: TextDirection.ltr,
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w900,
              color: AppColors.textDark,
            ),
          ),
          Text(
            label,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 13, color: AppColors.textDark),
          ),
        ],
      ),
    );
  }
}

class _SaveStatusCard extends StatelessWidget {
  const _SaveStatusCard({
    required this.status,
    this.outcome,
    this.errorMessage,
    this.onRetry,
  });

  final ScoreSaveStatus status;
  final QuizSubmissionOutcome? outcome;
  final String? errorMessage;
  final VoidCallback? onRetry;

  String get _scoreText {
    final o = outcome;
    if (o == null) return '';
    final score = o.savedScore == o.savedScore.roundToDouble()
        ? o.savedScore.toInt().toString()
        : o.savedScore.toStringAsFixed(1);
    return '${AppStrings.score}: $score / ${o.maxScore}';
  }

  @override
  Widget build(BuildContext context) {
    final (Color color, Widget leading, String text) = switch (status) {
      ScoreSaveStatus.practice => (
          AppColors.accent,
          const Text('🎮', style: TextStyle(fontSize: 28)),
          AppStrings.practiceMode,
        ),
      ScoreSaveStatus.saving => (
          AppColors.accent,
          const SizedBox(
            width: 28,
            height: 28,
            child: CircularProgressIndicator(strokeWidth: 3),
          ),
          AppStrings.savingScore,
        ),
      ScoreSaveStatus.saved => (
          AppColors.primary,
          const Text('📒', style: TextStyle(fontSize: 28)),
          AppStrings.scoreSaved,
        ),
      ScoreSaveStatus.alreadySubmitted => (
          AppColors.purple,
          const Text('📌', style: TextStyle(fontSize: 28)),
          AppStrings.scoreAlreadySaved,
        ),
      ScoreSaveStatus.failed => (
          AppColors.wrong,
          const Text('⚠️', style: TextStyle(fontSize: 28)),
          errorMessage ?? AppStrings.scoreSaveFailed,
        ),
    };

    return AnimatedContainer(
      key: const ValueKey('save-status'),
      duration: const Duration(milliseconds: 300),
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: color, width: 2),
      ),
      child: Column(
        children: [
          Row(
            children: [
              leading,
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  text,
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textDark,
                  ),
                ),
              ),
            ],
          ),
          if (outcome != null &&
              (status == ScoreSaveStatus.saved ||
                  status == ScoreSaveStatus.alreadySubmitted)) ...[
            const SizedBox(height: 8),
            Text(
              _scoreText,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w900,
                color: color,
              ),
            ),
          ],
          if (status == ScoreSaveStatus.failed && onRetry != null) ...[
            const SizedBox(height: 10),
            OutlinedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text(AppStrings.retry),
            ),
          ],
        ],
      ),
    );
  }
}
