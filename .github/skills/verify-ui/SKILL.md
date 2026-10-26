---
name: verify-ui
description: 'Verify UI changes in QuickerLinks. Use after changes to HTML, CSS, page rendering, images, search, icons, or dropdowns. Check home, course, and settings pages for spacing, icon alignment, uniform images, long titles, vertical scrolling, and horizontal overflow.'
---

# Verify UI Changes

## Purpose

Check all three pages after a UI change. A change passes only when browser measurements and visual checks pass. A successful syntax check alone is not sufficient.

## 1. Read the Changed Code

- Read the changed page, its styles, and the code that renders its content.
- Check shared styles and the other two pages for related effects.
- Use current element attributes to select controls. Do not depend on old line numbers.
- Keep the current design and Bootstrap CSS. Do not add a UI framework or change unrelated behavior.
- Reuse existing tests when available. Do not install a test framework without approval.

## 2. Prepare the Browser

- Use browser tools with Playwright when available. Reuse a shared test page when suitable.
- Open the local HTML pages directly when that is sufficient. Do not start a server unless needed.
- For local checks, set up test data before page scripts run. Mock the Chrome APIs that the page calls and the Brightspace responses that it needs.
- Set the required storage values explicitly. Include the domain, course visibility, assignment date ranges, and search state when applicable.
- Use a valid course ID and an encoded course name in the course-page URL.
- Do not change real settings, submit coursework, or use credentials without authorization.
- Clearly separate simulated checks from live Brightspace checks. Simulated data does not verify authentication.

## 3. Prepare Test Cases

Use these cases across the pages where they apply:

| Case | Required Data |
| --- | --- |
| Normal content | Several courses, assignments, and recent-content links |
| Vertical scrolling | Enough courses or content links to exceed the viewport height |
| Image proportions | Loaded landscape, portrait, and square source images |
| Long titles | Multi-line course names and long assignment or content-link names |
| Notification counts | No badge, a single digit, and the maximum displayed count |
| Empty content | No courses, no search results, no assignments, and no recent content |

Use deterministic local images or generated bitmap images. Wait for each test image to load. Confirm that `complete` is true and `naturalWidth` is greater than zero. Set a finite timeout and report image failures instead of waiting indefinitely. Broken images are not valid image-layout test data.

## 4. Check Every Page

Check home, course, and settings at viewport widths of 320, 375, 500, and 1024 CSS pixels. Use a viewport height of 601 CSS pixels. Check each page with vertical scrolling present. The wide viewport must not cause a Bootstrap container or a course header to exceed the page width.

For the short settings page, temporarily force a vertical scrollbar in the test browser or use a shorter viewport. Record which method you used. Do not save test-only layout changes in application files.

### Page Width and Scrolling

- Measure the page after data and images load and after each relevant control opens.
- Require `document.documentElement.scrollWidth <= document.documentElement.clientWidth`.
- Confirm that the vertical-scroll test actually has a scrollbar. For long content, require `document.documentElement.scrollHeight > window.innerHeight`.
- Check the body, header, content container, images, and open menus against the available page width.
- Use `clientWidth` for the available width. `window.innerWidth` includes space that a vertical scrollbar can occupy.
- Find the element that causes overflow. Do not hide the problem with `overflow-x: hidden`, clipped content, or smaller text.

### Images and Titles

- On home, compare image rectangles in equal-width columns. Width and height differences must not exceed one CSS pixel.
- Preserve the current 210:87 course-image ratio unless the requested design changes it. Use `object-fit: cover` to avoid stretching.
- Check the course header against its current 3:1 ratio and available width. It must fit after a resize without a reload.
- Confirm that long titles wrap without covering images, badges, icons, or adjacent content.
- Confirm that source images load and that cropping does not distort them.

### Spacing and Icons

- Compare home and settings at the same viewport size. Check outer spacing and header spacing.
- Compare the center lines of the home Search and Settings controls. Their vertical centers must differ by no more than one CSS pixel.
- Compare the home Settings control and settings Close control. Their positions and control dimensions must match within one CSS pixel.
- Check equal spacing around equivalent controls. Keep intentional differences, such as the course Back control.
- Check accessible names, hover text, focus indicators, and the absence of unwanted link underlines on icon controls.
- Confirm that icons stay inside their controls and remain visible on hover and keyboard focus.

### Controls and Page States

- On home, open and close search, enter a long query, clear it, and check the no-results state. Check stored search state after reload when supported.
- Open course-link dropdowns. Check their width, outside-click dismissal, keyboard navigation, Escape, and focus return.
- On course, check the header, navigation links, assignments, and recent content with both populated and empty data.
- On settings, check labels, inputs, radio buttons, selects, the Close control, and the save notification. Test changes only with isolated storage or authorized settings.
- Check that loading, empty, and error messages do not cause horizontal overflow.

## 5. Review and Complete

- Capture and inspect screenshots of all three pages at 500 and 320 pixels wide, including vertical scrolling. Inspect additional screenshots for any failing state.
- Check for overlapping text, unequal image sizes, misplaced icons, clipped controls, and missing assets. Measurements do not replace this visual check.
- Repair defects in the changed code and rerun the checks that failed. Recheck related pages after changes to shared code.
- Run the available focused syntax, lint, or editor checks for the changed files.
- Remove temporary test state. Do not leave mock responses or test content in application code.
- Report the pages, widths, and states checked. State whether data was simulated or live. List failures and checks that could not run.
- Do not report the UI as verified when browser checks are blocked or required cases fail.