import 'package:flutter/material.dart';
import '../core/theme.dart';
import 'jobs/job_search_screen.dart';
import 'applications/applications_screen.dart';
import 'settings/settings_screen.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _index = 0;

  static const _screens = [
    JobSearchScreen(),
    ApplicationsScreen(),
    SettingsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _index, children: _screens),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        backgroundColor: OpstapColors.surfaceContainerLowest,
        indicatorColor: OpstapColors.secondaryContainer,
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        destinations: [
          NavigationDestination(
            icon: const Icon(Icons.search_outlined),
            selectedIcon: const Icon(Icons.search_rounded, color: OpstapColors.primary),
            label: 'Zoeken',
          ),
          NavigationDestination(
            icon: const Icon(Icons.send_outlined),
            selectedIcon: const Icon(Icons.send_rounded, color: OpstapColors.primary),
            label: 'Sollicitaties',
          ),
          NavigationDestination(
            icon: const Icon(Icons.settings_outlined),
            selectedIcon: const Icon(Icons.settings_rounded, color: OpstapColors.primary),
            label: 'Instellingen',
          ),
        ],
      ),
    );
  }
}
