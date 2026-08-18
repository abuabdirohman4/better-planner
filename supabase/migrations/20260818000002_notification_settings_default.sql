-- Align user_profiles.notification_settings default with app shape (camelCase, NotificationSettings type)
-- and backfill any row still on the legacy snake_case shape.
ALTER TABLE user_profiles
  ALTER COLUMN notification_settings SET DEFAULT jsonb_build_object(
    'enabled', false,
    'frequencies', jsonb_build_object('daily', false, 'weekly', true, 'monthly', true, 'quarterly', true),
    'aiCharacter', 'BALANCED_MENTOR',
    'preferredTime', '06:00:00',
    'timezone', 'Asia/Jakarta',
    'email', null,
    'language', 'id'
  );

UPDATE user_profiles
SET notification_settings = jsonb_build_object(
    'enabled', COALESCE((notification_settings->>'email_enabled')::boolean, false),
    'frequencies', jsonb_build_object(
      'daily', COALESCE((notification_settings->>'daily_enabled')::boolean, false),
      'weekly', COALESCE((notification_settings->>'weekly_enabled')::boolean, true),
      'monthly', COALESCE((notification_settings->>'monthly_enabled')::boolean, true),
      'quarterly', COALESCE((notification_settings->>'quarterly_enabled')::boolean, true)
    ),
    'aiCharacter', 'BALANCED_MENTOR',
    'preferredTime', '06:00:00',
    'timezone', COALESCE(notification_settings->>'timezone', 'Asia/Jakarta'),
    'email', null,
    'language', 'id'
  )
WHERE notification_settings IS NULL OR NOT (notification_settings ? 'enabled');
