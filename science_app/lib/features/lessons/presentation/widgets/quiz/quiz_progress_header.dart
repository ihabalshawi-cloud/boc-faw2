import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../../../../core/constants/app_strings.dart';
import '../../../../../core/theme/app_colors.dart';

/// الجزء العلوي من شاشة الاختبار: رقم السؤال، النقاط الحية،
/// السلسلة النارية، وشريط التقدّم مع صاروخ يتحرك.
class QuizProgressHeader extends StatefulWidget {
  const QuizProgressHeader({
    super.key,
    required this.questionNumber,
    required this.totalQuestions,
    required this.progress,
    required this.points,
    required this.streak,
  });

  final int questionNumber;
  final int totalQuestions;

  /// من 0 إلى 1.
  final double progress;
  final int points;
  final int streak;

  @override
  State<QuizProgressHeader> createState() => _QuizProgressHeaderState();
}

class _QuizProgressHeaderState extends State<QuizProgressHeader>
    with SingleTickerProviderStateMixin {
  late final AnimationController _bump = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 900),
  );
  int _gained = 0;

  @override
  void didUpdateWidget(covariant QuizProgressHeader oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.points > oldWidget.points) {
      _gained = widget.points - oldWidget.points;
      _bump.forward(from: 0);
    }
  }

  @override
  void dispose() {
    _bump.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(28)),
        boxShadow: [
          BoxShadow(
              color: Colors.black12, blurRadius: 10, offset: Offset(0, 4)),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              _QuestionCounterChip(
                number: widget.questionNumber,
                total: widget.totalQuestions,
              ),
              const SizedBox(width: 8),
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 300),
                transitionBuilder: (child, animation) =>
                    ScaleTransition(scale: animation, child: child),
                child: widget.streak >= 2
                    ? _StreakBadge(
                        key: ValueKey(widget.streak),
                        streak: widget.streak,
                      )
                    : const SizedBox.shrink(),
              ),
              const Spacer(),
              _buildPoints(),
            ],
          ),
          const SizedBox(height: 14),
          _RocketProgressBar(progress: widget.progress),
        ],
      ),
    );
  }

  Widget _buildPoints() {
    return AnimatedBuilder(
      animation: _bump,
      builder: (context, _) {
        final t = _bump.value;
        final active = _bump.isAnimating;
        return Stack(
          clipBehavior: Clip.none,
          alignment: Alignment.center,
          children: [
            Transform.scale(
              scale: 1 + 0.3 * math.sin(math.pi * t),
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppColors.secondary, AppColors.fun],
                  ),
                  borderRadius: BorderRadius.circular(30),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.star_rounded,
                        color: Colors.white, size: 26),
                    const SizedBox(width: 4),
                    // العدّاد يتحرك تصاعدياً حتى القيمة الجديدة.
                    TweenAnimationBuilder<int>(
                      tween: IntTween(begin: 0, end: widget.points),
                      duration: const Duration(milliseconds: 600),
                      builder: (context, value, _) => Text(
                        '$value',
                        key: const ValueKey('quiz-points'),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            if (active)
              Positioned(
                top: -18 - 30 * t,
                child: Opacity(
                  opacity: (1 - t).clamp(0.0, 1.0),
                  child: Text(
                    '+$_gained',
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}

class _QuestionCounterChip extends StatelessWidget {
  const _QuestionCounterChip({required this.number, required this.total});

  final int number;
  final int total;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.accent.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(30),
      ),
      child: Text(
        '${AppStrings.questionOf} $number ${AppStrings.of} $total',
        style: const TextStyle(
          color: AppColors.textDark,
          fontSize: 16,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}

class _StreakBadge extends StatelessWidget {
  const _StreakBadge({super.key, required this.streak});

  final int streak;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.fun.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(30),
      ),
      child: Text(
        '🔥 ×$streak',
        style: const TextStyle(
          color: AppColors.fun,
          fontSize: 16,
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }
}

/// شريط تقدّم عريض بتدرج لوني وصاروخ يسير معه.
class _RocketProgressBar extends StatelessWidget {
  const _RocketProgressBar({required this.progress});

  final double progress;

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: progress),
      duration: const Duration(milliseconds: 500),
      curve: Curves.easeOutCubic,
      builder: (context, value, _) {
        return SizedBox(
          height: 34,
          child: Stack(
            alignment: Alignment.center,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: LinearProgressIndicator(
                  value: value,
                  minHeight: 18,
                  backgroundColor: AppColors.background,
                  valueColor: const AlwaysStoppedAnimation(AppColors.primary),
                  semanticsLabel: AppStrings.questionOf,
                  semanticsValue: '${(value * 100).round()}%',
                ),
              ),
              Align(
                // يبدأ من اليمين في العربية ويتجه يساراً مع التقدّم.
                alignment: AlignmentDirectional(-1 + 2 * value, 0),
                child: Transform.flip(
                  flipX: Directionality.of(context) == TextDirection.rtl,
                  child: const Text('🚀', style: TextStyle(fontSize: 26)),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
