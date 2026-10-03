import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../../../../core/constants/app_strings.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../domain/entities/quiz_question.dart';
import 'answer_feedback_animator.dart';

/// بطاقتان كرتونيتان كبيرتان لأسئلة صح أو خطأ.
///
/// إذا أضفت صوراً في `assets/images/characters/` بالأسماء
/// `true_character.png` و `false_character.png` ستظهر بدل الوجوه التعبيرية.
class TrueFalseOptions extends StatelessWidget {
  const TrueFalseOptions({
    super.key,
    required this.stateFor,
    required this.onSelected,
  });

  final AnswerVisualState Function(int index) stateFor;
  final ValueChanged<int> onSelected;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: AnswerFeedbackAnimator(
            key: const ValueKey('tf-true'),
            state: stateFor(QuizQuestion.trueIndex),
            onTap: () => onSelected(QuizQuestion.trueIndex),
            child: _CartoonCard(
              label: AppStrings.trueLabel,
              emoji: '😄',
              badge: '👍',
              assetPath: 'assets/images/characters/true_character.png',
              color: AppColors.primary,
              state: stateFor(QuizQuestion.trueIndex),
              bobPhase: 0,
            ),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: AnswerFeedbackAnimator(
            key: const ValueKey('tf-false'),
            state: stateFor(QuizQuestion.falseIndex),
            onTap: () => onSelected(QuizQuestion.falseIndex),
            child: _CartoonCard(
              label: AppStrings.falseLabel,
              emoji: '🙅',
              badge: '👎',
              assetPath: 'assets/images/characters/false_character.png',
              color: AppColors.fun,
              state: stateFor(QuizQuestion.falseIndex),
              bobPhase: math.pi,
            ),
          ),
        ),
      ],
    );
  }
}

/// بطاقة فيها شخصية تتمايل للأعلى والأسفل باستمرار لجذب انتباه الطفل.
class _CartoonCard extends StatefulWidget {
  const _CartoonCard({
    required this.label,
    required this.emoji,
    required this.badge,
    required this.assetPath,
    required this.color,
    required this.state,
    required this.bobPhase,
  });

  final String label;
  final String emoji;
  final String badge;
  final String assetPath;
  final Color color;
  final AnswerVisualState state;

  /// إزاحة زمنية حتى لا تتمايل البطاقتان معاً بنفس الإيقاع.
  final double bobPhase;

  @override
  State<_CartoonCard> createState() => _CartoonCardState();
}

class _CartoonCardState extends State<_CartoonCard>
    with SingleTickerProviderStateMixin {
  late final AnimationController _bob = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1600),
  );

  @override
  void initState() {
    super.initState();
    _syncBobbing();
  }

  @override
  void didUpdateWidget(covariant _CartoonCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.state != widget.state) _syncBobbing();
  }

  /// التمايل فقط أثناء انتظار الإجابة، ويتوقف بعد كشفها.
  void _syncBobbing() {
    if (widget.state == AnswerVisualState.idle) {
      if (!_bob.isAnimating) _bob.repeat();
    } else {
      _bob.stop();
    }
  }

  @override
  void dispose() {
    _bob.dispose();
    super.dispose();
  }

  Color get _color => switch (widget.state) {
        AnswerVisualState.correct => AppColors.correct,
        AnswerVisualState.wrong => AppColors.wrong,
        _ => widget.color,
      };

  String get _face => switch (widget.state) {
        AnswerVisualState.correct => '🤩',
        AnswerVisualState.wrong => '😵',
        _ => widget.emoji,
      };

  @override
  Widget build(BuildContext context) {
    final showResultBadge = widget.state == AnswerVisualState.correct ||
        widget.state == AnswerVisualState.wrong;

    return Semantics(
      button: true,
      label: widget.label,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        height: 230,
        decoration: BoxDecoration(
          color: _color,
          borderRadius: BorderRadius.circular(32),
          border: Border.all(color: Colors.white, width: 5),
          boxShadow: [
            BoxShadow(
              color: Color.lerp(_color, Colors.black, 0.3)!,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Stack(
          children: [
            Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  AnimatedBuilder(
                    animation: _bob,
                    builder: (context, child) => Transform.translate(
                      offset: Offset(
                        0,
                        math.sin(_bob.value * 2 * math.pi + widget.bobPhase) *
                            6,
                      ),
                      child: child,
                    ),
                    child: _buildCharacter(),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    widget.label,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 34,
                      fontWeight: FontWeight.w900,
                      shadows: [
                        Shadow(color: Colors.black26, offset: Offset(0, 3)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            PositionedDirectional(
              top: 10,
              end: 10,
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 300),
                transitionBuilder: (child, animation) =>
                    ScaleTransition(scale: animation, child: child),
                child: Text(
                  showResultBadge
                      ? (widget.state == AnswerVisualState.correct ? '✅' : '❌')
                      : widget.badge,
                  key: ValueKey(showResultBadge ? widget.state : 'badge'),
                  style: const TextStyle(fontSize: 30),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCharacter() {
    return Container(
      width: 110,
      height: 110,
      decoration: const BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
      ),
      alignment: Alignment.center,
      child: widget.state == AnswerVisualState.idle
          ? Image.asset(
              widget.assetPath,
              width: 90,
              height: 90,
              // لا توجد صورة؟ نعرض الوجه التعبيري بدلاً منها.
              errorBuilder: (context, error, stackTrace) => _emojiFace(),
            )
          : _emojiFace(),
    );
  }

  Widget _emojiFace() => Text(_face, style: const TextStyle(fontSize: 64));
}
