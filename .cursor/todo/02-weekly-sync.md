# WEEKLY SYNC
- [x] ✅ Optimize code & file
- [x] ✅ In Modal, if the task name was empty, dont show 
- [x] ✅ Debug dan fix masalah uncheck task di Weekly Sync Modal
- [x] ✅ Fix type mismatch antara TASK dan SUBTASK di selection logic
- [x] ✅ Manual cleanup existing duplicates di database
- [x] ✅ Clean up debug logs yang sudah tidak diperlukan
- [ ] Design decision untuk hierarchy selection rule (Task vs Subtask vs Mixed)
- [ ] Implement strict hierarchy validation dengan prevent selection
- [ ] Add UI indicators untuk parent-child relationships
- [ ] Improve anti-duplication logic untuk handle hierarchy

# BUG
- [x] ✅ Task yang sudah ter-checklist tidak bisa di-uncheck
- [x] ✅ Data hilang dari database karena aggressive cleanup logic
- [x] ✅ Duplicate items di multiple goal slots karena hierarchy selection

# REFACTORING
- [x] ✅ remove unused file, component, folder, code

# HIERARCHY SELECTION ISSUES
- [x] ✅ Identified root cause: Parent-child selection conflicts
- [x] ✅ Added hierarchy conflict warnings
- [ ] Implement prevention logic untuk hierarchy conflicts
- [ ] Redesign UI untuk clearer hierarchy indication
- [ ] Add bulk operations untuk manage hierarchy selections