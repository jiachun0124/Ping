const MAX_DRAFTS = 3;
const getDraftStorageKey = (uid) => `ping:event-drafts:${uid || "unknown"}`;

const makeDraftId = () => `draft_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const normalizeDrafts = (parsed) => {
  if (Array.isArray(parsed)) {
    return parsed
      .filter((item) => item && typeof item === "object" && item.form)
      .map((item) => ({
        id: item.id || makeDraftId(),
        form: item.form,
        updated_at: item.updated_at || new Date().toISOString()
      }));
  }
  if (parsed && typeof parsed === "object" && parsed.form) {
    return [
      {
        id: makeDraftId(),
        form: parsed.form,
        updated_at: parsed.updated_at || new Date().toISOString()
      }
    ];
  }
  return [];
};

const writeDrafts = (uid, drafts) => {
  localStorage.setItem(getDraftStorageKey(uid), JSON.stringify(drafts));
};

export const loadEventDrafts = (uid) => {
  try {
    const raw = localStorage.getItem(getDraftStorageKey(uid));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return normalizeDrafts(parsed).sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  } catch (error) {
    return [];
  }
};

export const loadEventDraftById = (uid, draftId) => {
  if (!draftId) return null;
  return loadEventDrafts(uid).find((draft) => draft.id === draftId) || null;
};

export const saveEventDraft = (uid, form, draftId = null) => {
  const now = new Date().toISOString();
  const drafts = loadEventDrafts(uid);
  if (draftId) {
    const nextDrafts = drafts.map((draft) =>
      draft.id === draftId ? { ...draft, form, updated_at: now } : draft
    );
    const updatedDraft = nextDrafts.find((draft) => draft.id === draftId);
    if (!updatedDraft) {
      return { ok: false, error: "Draft not found." };
    }
    writeDrafts(uid, nextDrafts);
    return { ok: true, draft: updatedDraft, drafts: nextDrafts };
  }

  if (drafts.length >= MAX_DRAFTS) {
    return { ok: false, error: "You can save up to 3 drafts." };
  }
  const createdDraft = {
    id: makeDraftId(),
    form,
    updated_at: now
  };
  const nextDrafts = [createdDraft, ...drafts];
  writeDrafts(uid, nextDrafts);
  return { ok: true, draft: createdDraft, drafts: nextDrafts };
};

export const removeEventDraft = (uid, draftId) => {
  const nextDrafts = loadEventDrafts(uid).filter((draft) => draft.id !== draftId);
  writeDrafts(uid, nextDrafts);
  return nextDrafts;
};

export const clearEventDrafts = (uid) => {
  localStorage.removeItem(getDraftStorageKey(uid));
};
