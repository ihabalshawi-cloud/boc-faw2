import 'package:flutter/material.dart';

import '../../../../core/constants/app_strings.dart';
import '../../../../core/theme/app_colors.dart';
import '../../domain/entities/app_user.dart';

/// شاشة الترحيب واختيار نوع المستخدم.
class WelcomePage extends StatelessWidget {
  const WelcomePage({super.key});

  static const _roleIcons = {
    UserRole.student: (Icons.backpack_rounded, AppColors.accent),
    UserRole.teacher: (Icons.science_rounded, AppColors.primary),
    UserRole.parent: (Icons.family_restroom_rounded, AppColors.fun),
  };

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                const Icon(
                  Icons.rocket_launch_rounded,
                  size: 96,
                  color: AppColors.secondary,
                ),
                const SizedBox(height: 16),
                Text(AppStrings.appName, style: textTheme.headlineLarge),
                Text(AppStrings.appSubtitle, style: textTheme.bodyLarge),
                const SizedBox(height: 40),
                Text(AppStrings.chooseRole, style: textTheme.titleLarge),
                const SizedBox(height: 16),
                for (final role in UserRole.values)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _roleIcons[role]!.$2,
                        foregroundColor: Colors.white,
                        minimumSize: const Size(260, 64),
                      ),
                      icon: Icon(_roleIcons[role]!.$1, size: 32),
                      label: Text(role.arabicLabel),
                      // يُربط بشاشة تسجيل الدخول في المرحلة القادمة.
                      onPressed: () {},
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
