import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../../../../core/constants/app_strings.dart';
import '../../../../../core/theme/app_colors.dart';

/// إشعار كارتوني يقفز من أعلى الشاشة مع قصاصات ورق ملوّنة (confetti).
///
/// يظهر في كل مرة يتغيّر فيها [trigger] (وليس عند أول بناء)، ثم يختفي وحده.
/// لإخفائه فوراً أعد إنشاءه بمفتاح جديد. لا يمنع الضغط على ما تحته.
class CelebrationOverlay extends StatefulWidget {
  const CelebrationOverlay({
    super.key,
    required this.trigger,
    required this.message,
    this.pointsGained = 0,
    this.subtitle,
  });

  /// رقم يزداد مع كل احتفال جديد.
  final int trigger;
  final String message;
  final int pointsGained;
  final String? subtitle;

  @override
  State<CelebrationOverlay> createState() => _CelebrationOverlayState();
}

class _CelebrationOverlayState extends State<CelebrationOverlay>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 2200),
  );
  final _random = math.Random();
  List<_ConfettiPiece> _pieces = const [];

  @override
  void didUpdateWidget(covariant CelebrationOverlay oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.trigger != oldWidget.trigger && widget.trigger > 0) _play();
  }

  void _play() {
    _pieces = List.generate(40, (_) => _ConfettiPiece.random(_random));
    _controller.forward(from: 0);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, _) {
          if (!_controller.isAnimating) return const SizedBox.shrink();
          final t = _controller.value;
          return Stack(
            children: [
              Positioned.fill(
                child: CustomPaint(
                  painter: _ConfettiPainter(pieces: _pieces, progress: t),
                ),
              ),
              Align(
                alignment: const Alignment(0, -0.35),
                child: Opacity(
                  opacity: _opacity(t),
                  child: Transform.scale(
                    scale: _scale(t),
                    child: _buildBubble(),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  /// يكبر بمرونة في أول 30% من المدة.
  double _scale(double t) {
    if (t >= 0.3) return 1;
    return Curves.elasticOut.transform(t / 0.3);
  }

  /// يختفي تدريجياً في آخر 20% من المدة.
  double _opacity(double t) => t < 0.8 ? 1 : ((1 - t) / 0.2).clamp(0.0, 1.0);

  Widget _buildBubble() {
    return Container(
      key: const ValueKey('celebration-bubble'),
      margin: const EdgeInsets.symmetric(horizontal: 32),
      padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFFFFF176), AppColors.secondary],
        ),
        borderRadius: BorderRadius.circular(36),
        border: Border.all(color: Colors.white, width: 6),
        boxShadow: const [
          BoxShadow(
            color: Colors.black26,
            blurRadius: 16,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text('🏅', style: TextStyle(fontSize: 54)),
          const SizedBox(height: 4),
          Text(
            widget.message,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 30,
              fontWeight: FontWeight.w900,
              color: AppColors.textDark,
            ),
          ),
          if (widget.subtitle != null)
            Text(
              widget.subtitle!,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppColors.fun,
              ),
            ),
          if (widget.pointsGained > 0) ...[
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                '+${widget.pointsGained} ${AppStrings.pointsSuffix}',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _ConfettiPiece {
  const _ConfettiPiece({
    required this.x,
    required this.delay,
    required this.speed,
    required this.drift,
    required this.size,
    required this.spin,
    required this.color,
    required this.isCircle,
  });

  factory _ConfettiPiece.random(math.Random r) => _ConfettiPiece(
        x: r.nextDouble(),
        delay: r.nextDouble() * 0.25,
        speed: 0.8 + r.nextDouble() * 0.7,
        drift: (r.nextDouble() - 0.5) * 0.3,
        size: 8 + r.nextDouble() * 8,
        spin: (r.nextDouble() - 0.5) * 12,
        color: _palette[r.nextInt(_palette.length)],
        isCircle: r.nextBool(),
      );

  static const _palette = [
    AppColors.primary,
    AppColors.secondary,
    AppColors.accent,
    AppColors.fun,
    AppColors.purple,
    Color(0xFFEC407A),
  ];

  /// الموقع الأفقي الابتدائي (0 إلى 1 من عرض الشاشة).
  final double x;
  final double delay;
  final double speed;
  final double drift;
  final double size;
  final double spin;
  final Color color;
  final bool isCircle;
}

class _ConfettiPainter extends CustomPainter {
  _ConfettiPainter({required this.pieces, required this.progress});

  final List<_ConfettiPiece> pieces;
  final double progress;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint();
    for (final p in pieces) {
      final local = ((progress - p.delay) / (1 - p.delay)).clamp(0.0, 1.0);
      if (local <= 0) continue;

      final dx = (p.x + p.drift * local) * size.width;
      final dy = -20 + local * p.speed * size.height;
      paint.color = p.color.withValues(alpha: (1 - local * 0.8));

      canvas.save();
      canvas.translate(dx, dy);
      canvas.rotate(p.spin * local);
      if (p.isCircle) {
        canvas.drawCircle(Offset.zero, p.size / 2, paint);
      } else {
        canvas.drawRect(
          Rect.fromCenter(
            center: Offset.zero,
            width: p.size,
            height: p.size * 0.5,
          ),
          paint,
        );
      }
      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(covariant _ConfettiPainter oldDelegate) =>
      oldDelegate.progress != progress || oldDelegate.pieces != pieces;
}
