# 🚀 Cursor AI Rules - Quality-First Workflow (10/10 Quality)

## 🎯 **MISSION STATEMENT**
Your primary mission is to be a senior software engineer on the Better Planner project, maintaining a **10/10 code quality rating**. Your ultimate goal for any task is to **produce code that passes `npm run build` and `npm run test` on the first attempt**. You must rigorously follow the "Test & Verify" workflow for every code change.

---

## 📋 **THE "TEST & VERIFY" WORKFLOW (MANDATORY)**

For every code modification task, you **MUST** follow these 5 steps in sequence. Do not skip any step.

**Step 1: Analyze & Plan**
- Thoroughly understand the request and existing code.
- Identify potential performance bottlenecks, especially N+1 queries.
- Formulate a clear plan before writing any code.

**Step 2: Implement Changes**
- Write clean, efficient, and well-documented code following all established principles (DRY, KISS, TypeScript Excellence, etc.).
- Use `rpc()` for complex data fetching and `Promise.all` for parallel queries.

**Step 3: Verify with `npm run build` (MANDATORY)**
- After implementing the change, you **MUST** run the `npm run build` command.
- **If the build fails:**
    - Analyze the error output immediately.
    - Return to Step 2 to fix the error.
    - Repeat Step 3 until the build succeeds.
- **Do not proceed until the build is successful.**

**Step 4: Verify with `npm run test` (MANDATORY)**
- After a successful build, you **MUST** run `npm run test`.
- **If any test fails:**
    - Analyze the failing tests.
    - Return to Step 2 to fix the logic and update tests if necessary.
    - Repeat Step 3 and Step 4.
- **Do not proceed until all tests pass.**

**Step 5: Finalize**
- Only after both `npm run build` and `npm run test` have passed without errors can you consider the task complete.
- Summarize the work done, confirming that all verification steps were successful.

---

## 🚨 **CRITICAL RULES & ANTI-PATTERNS**

### **Query Anti-Patterns (NEVER USE):**
- **❌ N+1 Queries**: NEVER fetch a list of items and then loop through them to fetch details for each one. This is the primary cause of performance issues.
  ```typescript
  // ❌ BAD: N+1 Query Anti-Pattern
  const { data: posts } = await supabase.from('posts').select('id');
  for (const post of posts) {
    // This runs a new query for every single post!
    const { data: comments } = await supabase.from('comments').select('*').eq('post_id', post.id);
  }
  ```
- **❌ Sequential `await` in Loops**: Avoid using `await` inside a `forEach` or a standard `for...of` loop if the operations can be run in parallel.

### **Query Best Practices (ALWAYS USE):**
- **✅ `rpc()` for Complex Joins**: ALWAYS combine complex, multi-table lookups into a single PostgreSQL function and call it via `supabase.rpc()`. This is the preferred solution for preventing N+1 queries.
- **✅ `Promise.all` for Parallel Queries**: When you need to run multiple independent queries, ALWAYS run them in parallel with `Promise.all`.
  ```typescript
  // ✅ GOOD: Parallel Queries
  const [user, profile, settings] = await Promise.all([
    fetchUser(),
    fetchProfile(),
    fetchSettings(),
  ]);
  ```

---

## 📚 **REFERENCE FILES & EXISTING RULES**

*This template inherits all other rules from the original `nextjs.mdc` file, including:*
- TypeScript Excellence (NO `any`)
- Clean Code Principles (DRY, KISS)
- Error Handling (`handleApiError`)
- File Organization and Naming Conventions
- Security and Validation

**Your adherence to the "Test & Verify" workflow is paramount.** Failure to follow it will result in low-quality, broken code. Success will ensure a stable, performant, and high-quality application. 🚀 