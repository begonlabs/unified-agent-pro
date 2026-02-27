-- SQL to clean up duplicate Green API channels
-- This script keeps only the most recent channel for each unique user/instance combination.

DELETE FROM communication_channels
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY user_id, channel_type, (channel_config->>'idInstance')
                   ORDER BY created_at DESC
               ) as row_num
        FROM communication_channels
        WHERE channel_type = 'whatsapp_green_api'
    ) t
    WHERE t.row_num > 1
);

-- Optimization: Ensure all current Green API channels have the correct platform_message_id pattern if needed
-- (Optional cleanup for consistency)
