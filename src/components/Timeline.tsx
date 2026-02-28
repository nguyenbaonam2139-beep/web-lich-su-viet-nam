import React, { useState, useEffect } from "react";
import type { TimelineEvent } from "../types";
import { EventEditor } from "./EventEditor";
import { LessonOverlay, LessonSection } from "./LessonOverlay";
import { SectionCompleteScreen } from "./SectionCompleteScreen";
import { ParallaxBackground } from "./ParallaxBackground";
import { TimelineNavigator } from "./TimelineNavigator";
import { AdminControls } from "./admin/AdminControls";
import { EditableText } from "./admin/EditableText";
import { UserProfileTopBar } from "./UserProfileTopBar";
import { BadgeCollectionSidebar } from "./BadgeCollectionSidebar";
import { useAdmin } from "../contexts/AdminContext";

import "../styles.css";

interface TimelineProps {
  events: TimelineEvent[];
  loading: boolean;
  error?: string;
  completedEvents?: number[];
  user?: any;
  // NOTE: onSelect removed — badge logic handled internally via awardBadge()
  onBack?: () => void;
  onCreate?: (event: Omit<TimelineEvent, "id">) => void;
  onUpdate?: (event: TimelineEvent) => void;
  onDelete?: (id: number) => void;
  onUpdateBackground?: (newUrl: string) => void;
  onUpdateBgParams?: (params: any) => void;
  onLogout?: () => void;
}

const iconMap: Record<
  NonNullable<TimelineEvent["icon"]>,
  JSX.Element
> = {
  people: (
    <span className="tl-icon">
      <span className="tl-icon-dot" />
      <span className="tl-icon-dot" />
      <span className="tl-icon-dot" />
    </span>
  ),
  clock: (
    <span className="tl-icon tl-icon-clock">
      <span className="tl-clock-hand tl-clock-hand-short" />
      <span className="tl-clock-hand tl-clock-hand-long" />
    </span>
  ),
  star: <span className="tl-icon tl-icon-star">★</span>,
  gear: <span className="tl-icon tl-icon-gear">⚙</span>,
  globe: <span className="tl-icon tl-icon-globe">🌍</span>
};

export const Timeline: React.FC<TimelineProps> = ({
  events,
  loading,
  error,
  completedEvents = [],
  user,
  onBack,
  onCreate,
  onUpdate,
  onDelete,
  onUpdateBackground,
  onUpdateBgParams,
  onLogout,
}) => {
  const { awardBadge, badges } = useAdmin();
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isBadgeSidebarOpen, setIsBadgeSidebarOpen] = useState(false);

  // New State for Learning Flow
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [activeLesson, setActiveLesson] = useState<{ event: TimelineEvent, section: LessonSection } | null>(null);
  const [sectionJustCompleted, setSectionJustCompleted] = useState<{
    section: LessonSection;
    chapterTitle?: string;
    nextChapterTitle?: string;
  } | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Completion state: track which sections are done for each event
  const [completions, setCompletions] = useState<Record<number, {
    knowledge: boolean;
    quiz: boolean;
    character: boolean;
    completedChapters?: string[]; // New: track specific chapters done
  }>>({});

  // Navigation Persistence — BUG 9 fix: không phụ thuộc vào events.length để set isHydrated
  // Hydrate expanded ID và progress khi user ID có và chưa được hydrate
  useEffect(() => {
    if (user?.id && !isHydrated) {
      const savedExpanded = localStorage.getItem(`hiss_expanded_id_${user.id}`);
      if (savedExpanded) setExpandedId(Number(savedExpanded));

      // Load progress — do NOT restore activeLesson (causes frozen UI on reload)
      const storageKey = `hiss_timeline_progress_${user.id}`;
      const savedProgress = localStorage.getItem(storageKey);
      if (savedProgress) {
        try {
          setCompletions(JSON.parse(savedProgress));
        } catch {
          console.error('Failed to parse timeline progress');
        }
      }

      // Clean up any leftover activeLesson keys from older app versions
      localStorage.removeItem(`hiss_active_lesson_${user.id}`);

      setIsHydrated(true); // Hydration complete regardless of events state
    }
  }, [user?.id, isHydrated]);

  useEffect(() => {
    if (user?.id && isHydrated) {
      if (expandedId) localStorage.setItem(`hiss_expanded_id_${user.id}`, expandedId.toString());
      else localStorage.removeItem(`hiss_expanded_id_${user.id}`);
    }
  }, [expandedId, user?.id, isHydrated]);

  // NOTE: activeLesson is intentionally NOT persisted to localStorage.
  // Lesson state is session-only — persisting it caused a frozen UI on reload.


  // Handle user change reset
  useEffect(() => {
    if (user?.id) {
      setIsHydrated(false); // Trigger re-hydration for new user
    } else {
      setExpandedId(null);
      setActiveLesson(null);
      setCompletions({});
      setIsHydrated(false);
    }
  }, [user?.id]);

  // Save progress to user-specific localStorage
  useEffect(() => {
    if (user?.id && isHydrated) {
      const storageKey = `hiss_timeline_progress_${user.id}`;
      localStorage.setItem(storageKey, JSON.stringify(completions));
    }
  }, [completions, user?.id, isHydrated]);

  // SYNC EFFECT: When events prop changes (after API load), sync the current active lesson event
  useEffect(() => {
    if (activeLesson && events.length > 0) {
      const updatedEvent = events.find(e => e.id === activeLesson.event.id);
      // ONLY update if we found the event. If not (e.g. temporary load state), KEEP the current lesson open.
      if (updatedEvent && JSON.stringify(updatedEvent) !== JSON.stringify(activeLesson.event)) {
        setActiveLesson(prev => prev ? { ...prev, event: updatedEvent } : null);
      }
    }
  }, [events, activeLesson]);

  // OPTIMISTIC UPDATE WRAPPER
  const handleOptimisticUpdate = (updatedEvent: TimelineEvent) => {
    // Update local active lesson immediately so UI doesn't flicker
    if (activeLesson && activeLesson.event.id === updatedEvent.id) {
      setActiveLesson(prev => prev ? { ...prev, event: updatedEvent } : null);
    }
    // Then call the real parent update (App.tsx -> API)
    if (onUpdate) onUpdate(updatedEvent);
  };


  // Calculate completion count for an event (0-n where n is sections/chapters)
  const getCompletionCount = (eventId: number): number => {
    const event = events.find(e => e.id === eventId);
    const eventCompletion = completions[eventId];
    if (!eventCompletion) return 0;

    // New flow: count chapters
    if (event?.chapters && event.chapters.length > 0) {
      const validCompletedIds = (eventCompletion.completedChapters || []).filter(
        id => event.chapters?.some(c => c.id === id)
      );
      return validCompletedIds.length;
    }

    // Legacy flow: count knowledge/quiz/character
    let count = 0;
    if (eventCompletion.knowledge) count++;
    if (eventCompletion.quiz) count++;
    if (eventCompletion.character) count++;
    return count;
  };

  // Check if milestone is fully completed
  const isMilestoneFullyCompleted = (eventId: number): boolean => {
    const event = events.find(e => e.id === eventId);
    if (!event) return false;

    const count = getCompletionCount(eventId);
    if (event.chapters && event.chapters.length > 0) {
      return count === event.chapters.length;
    }
    return count === 3;
  };

  const handleEdit = (event: TimelineEvent) => {
    setEditingEvent(event);
  };

  const handleDelete = (id: number) => {
    if (onDelete) {
      onDelete(id);
    }
  };

  const isAdmin = user?.role === 'admin';

  if (loading) {
    return (
      <div className="tl-state tl-state-loading">
        <div className="tl-spinner" />
        <span>Đang tải dữ liệu bài học...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tl-state tl-state-error">
        <p>Không tải được dữ liệu timeline.</p>
        <p className="tl-state-error-msg">{error}</p>
      </div>
    );
  }

  const toggleExpand = (id: number) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const openLesson = (event: TimelineEvent, section: LessonSection) => {
    setActiveLesson({ event, section });
  };

  // Check if a section is unlocked
  const isSectionUnlocked = (eventId: number, section: LessonSection): boolean => {
    if (user?.role === 'admin') return true; // Admin bypass
    const completion = completions[eventId];

    if (section === 'knowledge') return true; // Always unlocked
    if (section === 'quiz') return completion?.knowledge || false;
    if (section === 'character') return completion?.quiz || false;

    return false;
  };

  // Check if a section is completed
  const isSectionCompleted = (eventId: number, section: LessonSection): boolean => {
    if (section === 'chapter') return false; // Default for check
    return (completions[eventId] as any)?.[section] || false;
  };

  const handleYearSelect = (id: number) => {
    const element = document.getElementById(`event-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="timeline">
      <ParallaxBackground />
      <TimelineNavigator events={events} onYearSelect={handleYearSelect} />

      {/* Lesson Overlay - Rendered on top when active */}
      {activeLesson && (
        <LessonOverlay
          event={activeLesson.event}
          section={activeLesson.section}
          completedChapters={completions[activeLesson.event.id]?.completedChapters || []}
          onBack={() => setActiveLesson(null)}
          onComplete={(section, chapterId) => {
            if (!activeLesson) return;
            const eventId = activeLesson.event.id;

            setCompletions(prev => {
              const current = prev[eventId] || { knowledge: false, quiz: false, character: false, completedChapters: [] };
              let nextCompletions = { ...current };

              if (section === 'chapter' && chapterId) {
                const chapters = current.completedChapters || [];
                if (!chapters.includes(chapterId)) {
                  nextCompletions.completedChapters = [...chapters, chapterId];
                }
              } else if (section !== 'chapter') {
                nextCompletions[section] = true;
              }

              // Evaluate if the entire milestone is done based on chapters or legacy sections
              // BUG FIX: use ||0 not ||1 — a milestone with 0 chapters should NEVER auto-complete
              const totalChapters = activeLesson.event.chapters?.length || 0;
              const isEventFullyComplete =
                (totalChapters > 0 && nextCompletions.completedChapters?.length === totalChapters) ||
                (totalChapters === 0 && nextCompletions.knowledge && nextCompletions.quiz && nextCompletions.character);

              if (isEventFullyComplete) {
                nextCompletions.knowledge = true; // Legacy fallback flag

                // BUG FIX: use badges from AdminContext (always fresh) instead of user.profile?.badges (stale closure)
                if (awardBadge && user?.id) {
                  const badgeId = `milestone-${eventId}-complete`;
                  if (!badges.includes(badgeId)) {
                    setTimeout(() => awardBadge(badgeId), 500);
                  }
                }
              }

              return {
                ...prev,
                [eventId]: nextCompletions
              };
            });

            // Legacy UI still expects one of the 3 main sections completed for effect
            const chapter = activeLesson.event.chapters?.find(c => c.id === chapterId);
            const nextChapterIndex = chapterId
              ? activeLesson.event.chapters?.findIndex(c => c.id === chapterId)! + 1
              : -1;
            const nextChapter = activeLesson.event.chapters?.[nextChapterIndex];

            setSectionJustCompleted({
              section: section === 'chapter' ? 'chapter' : section,
              chapterTitle: chapter?.title,
              nextChapterTitle: nextChapter?.title
            });
          }}
          onUpdate={handleOptimisticUpdate}
        />
      )}

      {/* Section Completion Screen */}
      {sectionJustCompleted && activeLesson && (
        <SectionCompleteScreen
          section={sectionJustCompleted.section}
          chapterTitle={sectionJustCompleted.chapterTitle}
          nextChapterTitle={sectionJustCompleted.nextChapterTitle}
          eventTitle={activeLesson.event.title}
          eventYear={activeLesson.event.year}
          nextSection={
            sectionJustCompleted.section === 'chapter' && sectionJustCompleted.nextChapterTitle ? 'chapter' :
              sectionJustCompleted.section === 'knowledge' ? 'quiz' :
                sectionJustCompleted.section === 'quiz' ? 'character' :
                  null
          }
          onNext={(nextSec: LessonSection) => {
            // BUG 5 fix: Xóa openLesson() thừa — chỉ cần reset section để quay về chapter list
            // openLesson() gọi setActiveLesson rồi bị ghi đè ngay → flicker
            setSectionJustCompleted(null);
            setActiveLesson(prev => prev ? { ...prev, section: nextSec } : null);
          }}
          onReturn={() => {
            const wasChapter = sectionJustCompleted?.section === 'chapter';
            setSectionJustCompleted(null);
            if (!wasChapter) {
              setActiveLesson(null);
            }
          }}
        />
      )}
      <AdminControls
        onUpdateBackground={onUpdateBackground}
        onUpdateBgParams={onUpdateBgParams}
      />

      <div className="timeline__header">
        <div className="timeline__header-actions">
          {onBack && (
            <button
              type="button"
              className="timeline__back-btn"
              onClick={onBack}
            >
              ← Quay lại
            </button>
          )}
        </div>
        <h1 className="timeline__title">Hành Trình Lịch Sử</h1>
        <p className="timeline__subtitle">
          Khám phá những dấu mốc quan trọng của dân tộc Việt Nam.
          <br /><strong>Kì thi tập trung: Kháng chiến chống Pháp (1945-1954)</strong>
        </p>
      </div>

      <div className="timeline__list">
        <div className="timeline__line" />
        {events.map((event, index) => {
          const isTop = event.position === "top";
          const isCompleted = completedEvents.includes(event.id);
          const isDemoActive = event.status === 'active';
          const isComingSoon = event.status === 'coming-soon' && !isAdmin;
          // Fix: coming-soon cards không được glow/expand dù expandedId có trong localStorage
          const isExpanded = expandedId === event.id && !isComingSoon;
          // Fix: coming-soon cards không hiện progress/completed badge
          const completionCount = isComingSoon ? 0 : getCompletionCount(event.id);
          const isFullyComplete = isComingSoon ? false : isMilestoneFullyCompleted(event.id);
          const yearLabel = event.endYear
            ? `${event.year} – ${event.endYear}`
            : `${event.year}`;

          return (
            <div
              key={event.id}
              id={`event-${event.id}`}
              className={`timeline__item timeline__item--${event.color} ${isTop ? "timeline__item--top" : "timeline__item--bottom"
                } ${isCompleted && user?.role !== 'admin' ? "timeline__item--completed" : ""} milestone-progress-${user?.role === 'admin' ? 0 : completionCount} ${isDemoActive ? 'demo-active' : 'under-development'}`}
              style={{ "--delay": `${index * 80}ms` } as React.CSSProperties}
              onClick={() => {
                if (!isComingSoon) {
                  toggleExpand(event.id);
                }
              }}
            >
              {isComingSoon && (
                <div className="dev-overlay">
                  <span>Đang phát triển</span>
                </div>
              )}
              <div className="timeline__year">{yearLabel}</div>
              <div className="timeline__connector" />
              <div className={`timeline__content ${isExpanded ? 'active-glow' : ''}`}>
                {isFullyComplete && user?.role !== 'admin' && <div className="milestone-completed-badge">✓</div>}
                {completionCount > 0 && !isFullyComplete && user?.role !== 'admin' && (
                  <div className="milestone-progress-indicator">
                    {event.chapters && event.chapters.length > 0
                      ? `${completionCount}/${event.chapters.length} chương`
                      : `${completionCount}/3`}
                  </div>
                )}

                {isAdmin && (
                  <div className="admin-controls" onClick={e => e.stopPropagation()}>
                    <button className="btn-edit" onClick={() => setEditingEvent(event)}>✎</button>
                    <button className="btn-delete" onClick={() => onDelete && onDelete(event.id)}>🗑</button>
                  </div>
                )}

                <div className="timeline__card-header">
                  {event.icon && (
                    <div className="timeline__icon">
                      {iconMap[event.icon]}
                    </div>
                  )}
                  <h3 className="timeline__event-title">
                    {isAdmin && isExpanded ? (
                      <EditableText
                        value={event.title}
                        onSave={(newTitle) => {
                          handleOptimisticUpdate({ ...event, title: newTitle });
                        }}
                      />
                    ) : (
                      event.title
                    )}
                  </h3>
                </div>

                {/* Learning Menu - simplified for Demo Integrated Flow */}
                {isExpanded && (
                  <div className="learning-menu">
                    {isDemoActive ? (
                      <div className="demo-entry-container">
                        <button
                          className="btn-start-integrated"
                          onClick={(e) => {
                            e.stopPropagation();
                            openLesson(event, 'knowledge');
                          }}
                        >
                          <span className="btn-icon">🚀</span> Bắt đầu bài học
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="learning-menu-title">Chọn phần học</div>

                        {/* Knowledge - Always unlocked */}
                        <div
                          className={`menu-item ${isSectionCompleted(event.id, 'knowledge') && user?.role !== 'admin' ? 'completed' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            openLesson(event, 'knowledge');
                          }}
                        >
                          <div className="menu-icon">📖</div>
                          <div className="menu-content">
                            <div className="menu-label">Kiến thức Lịch sử</div>
                            <div className="menu-desc">Tìm hiểu chi tiết</div>
                          </div>
                          {isSectionCompleted(event.id, 'knowledge') && user?.role !== 'admin' && (
                            <div className="status-check">✓</div>
                          )}
                        </div>

                        {/* Quiz - Unlocks after Knowledge */}
                        <div
                          className={`menu-item ${!isSectionUnlocked(event.id, 'quiz') ? 'locked' :
                            isSectionCompleted(event.id, 'quiz') && user?.role !== 'admin' ? 'completed' : ''
                            }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isSectionUnlocked(event.id, 'quiz')) {
                              openLesson(event, 'quiz');
                            }
                          }}
                          title={!isSectionUnlocked(event.id, 'quiz') ? 'Hoàn thành Kiến thức để mở khóa' : ''}
                        >
                          <div className="menu-icon">
                            {!isSectionUnlocked(event.id, 'quiz') && user?.role !== 'admin' ? '🔒' : '⚔️'}
                          </div>
                          <div className="menu-content">
                            <div className="menu-label">Kiểm tra</div>
                            <div className="menu-desc">
                              {!isSectionUnlocked(event.id, 'quiz') && user?.role !== 'admin' ? 'Cần mở khóa' : 'Trả lời câu hỏi'}
                            </div>
                          </div>
                          {isSectionCompleted(event.id, 'quiz') && user?.role !== 'admin' && (
                            <div className="status-check">✓</div>
                          )}
                        </div>

                        {/* Character - Unlocks after Quiz */}
                        <div
                          className={`menu-item ${!isSectionUnlocked(event.id, 'character') ? 'locked' :
                            isSectionCompleted(event.id, 'character') && user?.role !== 'admin' ? 'completed' : ''
                            }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isSectionUnlocked(event.id, 'character')) {
                              openLesson(event, 'character');
                            }
                          }}
                          title={!isSectionUnlocked(event.id, 'character') ? 'Hoàn thành Quiz để mở khóa' : ''}
                        >
                          <div className="menu-icon">
                            {!isSectionUnlocked(event.id, 'character') && user?.role !== 'admin' ? '🔒' : '👑'}
                          </div>
                          <div className="menu-content">
                            <div className="menu-label">Nhân vật lịch sử</div>
                            <div className="menu-desc">
                              {!isSectionUnlocked(event.id, 'character') && user?.role !== 'admin' ? 'Cần mở khóa' : 'Khám phá câu chuyện'}
                            </div>
                          </div>
                          {isSectionCompleted(event.id, 'character') && user?.role !== 'admin' && (
                            <div className="status-check">✓</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isAdmin && (
        <button className="timeline-add-btn" onClick={() => setIsCreating(true)} title="Thêm sự kiện mới">
          +
        </button>
      )}

      {(editingEvent || isCreating) && (
        <EventEditor
          initialEvent={editingEvent} // null if creating
          onSave={(event) => {
            if (editingEvent) {
              handleOptimisticUpdate(event);
            } else {
              onCreate && onCreate(event);
            }
            setEditingEvent(null);
            setIsCreating(false);
          }}
          onCancel={() => {
            setEditingEvent(null);
            setIsCreating(false);
          }}
        />
      )}
      <BadgeCollectionSidebar
        isOpen={isBadgeSidebarOpen}
        onClose={() => setIsBadgeSidebarOpen(false)}
        userBadges={user?.profile?.badges || []}
      />
      <UserProfileTopBar onBadgeClick={() => setIsBadgeSidebarOpen(true)} onLogout={onLogout} />
    </div>
  );
};
