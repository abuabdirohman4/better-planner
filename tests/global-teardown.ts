// No-op teardown — test user is NEVER deleted (persistent)
// Ephemeral test data (quests, etc.) is cleaned up in afterEach hooks
async function globalTeardown() {
  // intentionally empty
}

export default globalTeardown;
