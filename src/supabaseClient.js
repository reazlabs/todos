import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://jwxqixcmuxqyqtpohwyv.supabase.co"
const supabaseKey = "sb_publishable_zMlBNPizk96SHqVI4EB2qA_38YyEoAX"

export const supabase = createClient(supabaseUrl,supabaseKey);