# WEEKLY SYNC
- [x] ✅ Optimize code & file
- [x] ✅ In Modal, if the task name was empty, dont show 
- [x] ✅ Debug dan fix masalah uncheck task di Weekly Sync Modal
- [x] ✅ Fix type mismatch antara TASK dan SUBTASK di selection logic
- [x] ✅ Manual cleanup existing duplicates di database
- [x] ✅ Clean up debug logs yang sudah tidak diperlukan
- [x] ✅ Design decision untuk hierarchy selection rule (Task vs Subtask vs Mixed)
- [x] ✅ Implement strict hierarchy validation dengan prevent selection
- [x] ✅ Add UI indicators untuk parent-child relationships

# BUG
- [x] ✅ Task yang sudah ter-checklist tidak bisa di-uncheck
- [x] ✅ Data hilang dari database karena aggressive cleanup logic
- [x] ✅ Duplicate items di multiple goal slots karena hierarchy selection

# REFACTORING
- [x] ✅ remove unused file, component, folder, code

# HIERARCHY SELECTION ISSUES
- [x] ✅ Identified root cause: Parent-child selection conflicts
- [x] ✅ Added hierarchy conflict warnings
- [x] ✅ Implement prevention logic untuk hierarchy conflicts
- [x] ✅ Redesign UI untuk clearer hierarchy indication