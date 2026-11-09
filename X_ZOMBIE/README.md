# X ZOMBIE - Survival

An original Android-first 3D zombie survival prototype built with Godot 4 and the Mobile/Compatibility renderer.

## Current prototype
- Small 3D survival arena built from original primitive geometry.
- Third-person elevated camera.
- Player movement with WASD (desktop testing) and touch movement on the left half of the screen.
- Attack with Space or by tapping the right half of the screen.
- Seven chasing zombies with health and contact damage.
- Health display, remaining-zombie counter, win/lose state.

## Project principles
- Android first; touch controls are part of the prototype.
- Keep a scalable quality path for low-, mid-, and high-end Android devices.
- Use original placeholder geometry until each replacement asset's commercial-use license is checked.
- Do not include paid or unverified third-party assets.
- Ads are not included in the prototype. Add rewarded ads only after gameplay is stable, using a supported AdMob integration and test ad units first.

## Open in Godot
Open this folder in Godot 4.4 or a compatible Godot 4.x release and run `scenes/main.tscn`.

## Next milestones
1. Verify the scene and scripts in the Godot editor and fix any runtime issues.
2. Add proper touch joystick and attack controls, animations, sound, and mobile UI.
3. Replace placeholders with license-verified environment and character assets.
4. Add Android export preset and cloud APK build.
5. Integrate rewarded ads and test them before release.

This is a prototype foundation, not a finished or store-ready game.


Android APK export is automated through GitHub Actions on this branch.
