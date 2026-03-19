export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  nickname: string | null;
  goal: string | null;
  weekly_goal: number;
  weekly_goal_set_at: string | null;
  status: "pending" | "approved" | "rejected";
  is_admin: boolean;
  onboarding_done: boolean;
  created_at: string;
}

/** Returns nickname → full_name → email prefix */
export function displayName(u: UserProfile): string {
  return u.nickname ?? u.full_name?.split(" ")[0] ?? u.email?.split("@")[0] ?? "Member";
}

export interface Topic {
  id: string;
  title_ko: string;
  title_en: string | null;
  difficulty: "easy" | "medium" | "hard";
  is_custom: boolean;
  created_by: string | null;
  active_date: string | null;
  created_at: string;
}

export interface Video {
  id: string;
  user_id: string;
  topic_id: string | null;
  title: string | null;
  storage_path: string;
  recorded_date: string;
  duration_seconds: number | null;
  rating: number | null;
  created_at: string;
  users?: UserProfile;
  topics?: Topic;
}

export interface Fine {
  id: string;
  user_id: string;
  week_start: string;
  missed_count: number;
  amount: number;
  paid: boolean;
  users?: UserProfile;
}

export const FINE_PER_MISS = 2000;
