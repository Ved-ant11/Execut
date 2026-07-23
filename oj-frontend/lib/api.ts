export const API_BASE_URL =
  typeof window === "undefined"
    ? process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL // server-side
    : process.env.NEXT_PUBLIC_API_BASE_URL; // browser

if (!API_BASE_URL) {
  throw new Error("API_BASE_URL is not defined");
}

export const fetchQuestionById = async (id: string) => {
  const response = await fetch(`${API_BASE_URL}/questions/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Failed to fetch question ${id}`);
  return response.json();
};

export const fetchQuestions = async () => {
  const response = await fetch(`${API_BASE_URL}/questions`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Failed to fetch questions`);
  return response.json();
};

export const submitSolution = async ({
  code,
  language,
  questionId,
}: {
  code: string;
  language: string;
  questionId: string;
}) => {
  const response = await fetch(`${API_BASE_URL}/submissions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      code,
      language,
      questionId,
    }),
  });
  if (!response.ok) {
    throw new Error("Failed to submit solution");
  }
  return response.json();
};

export const fetchSubmissionStatus = async (id: string) => {
  const response = await fetch(`${API_BASE_URL}/submissions/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Failed to fetch submission status ${id}`);
  return response.json();
};

export const fetchProfile = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Failed to fetch profile`);
    return response.json();
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch profile");
  }
};

export const fetchSolvedIds = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/solved`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      cache: "no-store",
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.solvedIds;
  } catch {
    return [];
  }
};

export const fetchAuthStatus = async (): Promise<{
  id: string;
  username: string;
} | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      cache: "no-store",
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
};

export const fetchLeaderboard = async () => {
  const response = await fetch(`${API_BASE_URL}/user/leaderboard`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Failed to fetch leaderboard");
  return response.json();
};

export const fetchSubmissionsByQuestion = async (questionId: string) => {
  const response = await fetch(
    `${API_BASE_URL}/submissions/question/${questionId}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      cache: "no-store",
    },
  );
  if (!response.ok) return [];
  return response.json();
};

export const fetchStreakData = async () => {
  const response = await fetch(`${API_BASE_URL}/user/streak`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Failed to fetch streak data");
  return response.json();
};

export const fetchReview = async (submissionId: string) => {
  const response = await fetch(`${API_BASE_URL}/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    cache: "no-store",
    body: JSON.stringify({ submissionId }),
  });
  if (!response.ok) throw new Error("Failed to fetch review");
  return response.json();
};

export const joinQueue = async () => {
  const response = await fetch(`${API_BASE_URL}/battle/queue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data;
};

export const leaveQueue = async () => {
  const response = await fetch(`${API_BASE_URL}/battle/queue`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Failed to leave queue");
  return response.json();
};

export const getBattle = async (battleId: string) => {
  const response = await fetch(`${API_BASE_URL}/battle/${battleId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Failed to fetch battle");
  return response.json();
};

export const getUserStats = async () => {
  const response = await fetch(`${API_BASE_URL}/user/me`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Failed to fetch user stats");
  return response.json();
};

export const getQueueStatus = async () => {
  const response = await fetch(`${API_BASE_URL}/battle/queue/status`, {
    credentials: "include",
  });
  return response.json();
};

export const getBattleHistory = async () => {
  const response = await fetch(`${API_BASE_URL}/battle/history`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) return [];
  return response.json();
};

export const logout = async () => {
  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
};

export const fetchPublicProfile = async (username: string) => {
  const response = await fetch(`${API_BASE_URL}/user/${username}/public`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!response.ok) {
    if (response.status === 404) throw new Error("User not found");
    throw new Error("Failed to fetch public profile");
  }
  return response.json();
};

export const fetchDiscussion = async (questionId: string) => {
  const response = await fetch(`${API_BASE_URL}/discussion/${questionId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Failed to fetch discussion");
  return response.json();
};

export const postComment = async (questionId: string, content: string) => {
  const response = await fetch(`${API_BASE_URL}/discussion/${questionId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ content }),
  });
  if (!response.ok) throw new Error("Failed to post comment");
  return response.json();
};

export const createRoom = async () => {
  const response = await fetch(`${API_BASE_URL}/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Failed to create room");
  return response.json();
};

export const joinRoom = async (code: string) => {
  const response = await fetch(`${API_BASE_URL}/rooms/${code}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to join room");
  }
  return response.json();
};

export const fetchRoom = async (roomId: string) => {
  const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Failed to fetch room");
  return response.json();
};

export const fetchFeedback = async () => {
  const response = await fetch(`${API_BASE_URL}/feedback`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Failed to fetch feedback");
  return response.json();
};

export const submitFeedback = async ({
  category,
  content,
  rating,
}: {
  category: string;
  content: string;
  rating: number;
}) => {
  const response = await fetch(`${API_BASE_URL}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ category, content, rating }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Failed to submit feedback");
  }
  return response.json();
};

// ==================== PRACTICE / FSRS ====================

export const fetchReviewQueue = async () => {
  const response = await fetch(`${API_BASE_URL}/practice/review-queue`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Failed to fetch review queue");
  return response.json();
};

export const fetchRetryQueue = async () => {
  const response = await fetch(`${API_BASE_URL}/practice/retry-queue`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Failed to fetch retry queue");
  return response.json();
};

export const submitReview = async (questionId: string, rating: string) => {
  const response = await fetch(`${API_BASE_URL}/practice/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ questionId, rating }),
  });
  if (!response.ok) throw new Error("Failed to submit review");
  return response.json();
};

export const fetchPracticeStats = async () => {
  const response = await fetch(`${API_BASE_URL}/practice/stats`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Failed to fetch practice stats");
  return response.json();
};

export const fetchTopicMastery = async () => {
  const response = await fetch(`${API_BASE_URL}/practice/topics`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Failed to fetch topic mastery");
  return response.json();
};

export const dismissRetry = async (questionId: string) => {
  const response = await fetch(`${API_BASE_URL}/practice/retry/${questionId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to dismiss retry");
  return response.json();
};

// ==================== TOPIC LEARNING GUIDES ====================

export const fetchTopicGuides = async () => {
  const response = await fetch(`${API_BASE_URL}/topics`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Failed to fetch topic guides");
  return response.json();
};

export const fetchTopicGuide = async (id: string) => {
  const response = await fetch(`${API_BASE_URL}/topics/${id}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Failed to fetch topic guide");
  return response.json();
};

export const checkUsernameAvailability = async (username: string) => {
  const response = await fetch(`${API_BASE_URL}/auth/check-username?username=${encodeURIComponent(username)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!response.ok) return { available: false };
  return response.json();
};

export const checkEmailAvailability = async (email: string) => {
  const response = await fetch(`${API_BASE_URL}/auth/check-email?email=${encodeURIComponent(email)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!response.ok) return { available: false };
  return response.json();
};

