import { useState, useEffect } from "react";
import { TimelineEvent } from "../types";
import { checkAnswer, calculateStars, HistoricalCharacter } from "../data/characters";
import { useAdmin } from "../contexts/AdminContext";
import { useContent } from "../contexts/ContentContext";
import { EditableText } from "./admin/EditableText";
import "../character-guess.css";

interface CharacterGuessProps {
    event: TimelineEvent;
    interactionId?: string | number; // Added to isolate character pool
    chapterId?: string;
    pageId?: string;
    onComplete: () => void;
    onBack: () => void;
}

export function CharacterGuess({ event, interactionId, chapterId, pageId, onComplete, onBack }: CharacterGuessProps) {
    const { user, isEditMode, addTokens } = useAdmin();
    const { getCharacters, updateCharacter, addCharacter, deleteCharacter } = useContent();

    // Filter characters by interactionId if provided, otherwise use all from event
    const allCharacters = getCharacters(event.id);
    const characters = interactionId
        ? allCharacters.filter(c => c.id === interactionId)
        : allCharacters;

    // Gameplay state
    const [playingCharIndex, setPlayingCharIndex] = useState(0);
    const [guessedCharIds, setGuessedCharIds] = useState<string[]>([]);
    const [currentHint, setCurrentHint] = useState(0);
    const [userGuess, setUserGuess] = useState("");
    const [isCorrect, setIsCorrect] = useState(false);
    const [finalStars, setFinalStars] = useState(0);
    const [showIntro, setShowIntro] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [isHydrated, setIsHydrated] = useState(false);
    const [tokensAwarded, setTokensAwarded] = useState(false);

    // Admin state
    const [editingCharIndex, setEditingCharIndex] = useState(0);

    // Persist and load state
    useEffect(() => {
        if (!isEditMode && user?.id && event.id && !isHydrated) {
            const storageKey = `hiss_char_state_${user.id}_${event.id}_${chapterId || 'default'}_${pageId || '0'}`;
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const { guessedIds, playingIndex, hint } = JSON.parse(saved);
                setGuessedCharIds(guessedIds || []);
                setPlayingCharIndex(playingIndex || 0);
                setCurrentHint(hint || 0);
                setShowIntro(false); // Resume directly if they were playing
            }
            setIsHydrated(true);
        }
    }, [user?.id, event.id, chapterId, pageId, isEditMode, isHydrated]);

    useEffect(() => {
        if (!isEditMode && user?.id && event.id && isHydrated) {
            const storageKey = `hiss_char_state_${user.id}_${event.id}_${chapterId || 'default'}_${pageId || '0'}`;
            localStorage.setItem(storageKey, JSON.stringify({
                guessedIds: guessedCharIds,
                playingIndex: playingCharIndex,
                hint: currentHint
            }));
        }
    }, [guessedCharIds, playingCharIndex, currentHint, user?.id, event.id, chapterId, pageId, isEditMode, isHydrated]);

    // Select random character for gameplay (modified for pool tracking)
    useEffect(() => {
        if (!isEditMode && characters.length > 0 && showIntro && guessedCharIds.length === 0) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            setPlayingCharIndex(randomIndex);
        }
    }, [characters.length, isEditMode, showIntro, guessedCharIds.length]);

    const character = isEditMode
        ? characters[editingCharIndex]
        : characters[playingCharIndex];

    const remainingCharacters = characters.filter(c => !guessedCharIds.includes(c.id) && c.id !== character?.id);

    // Safety guard: if no characters available, auto-advance instead of trapping user
    useEffect(() => {
        if (!isEditMode && isHydrated && characters.length === 0) {
            onComplete();
        }
    }, [characters.length, isEditMode, isHydrated, onComplete]);

    if (!character && !isEditMode) {
        if (characters.length === 0) return null; // Let useEffect handle auto-advance
        return (
            <div className="character-guess-container">
                <div className="error-state">
                    <p>Chưa có nhân vật lịch sử cho sự kiện này.</p>
                    <button onClick={onBack}>Quay lại</button>
                </div>
            </div>
        );
    }

    const handleUpdateChar = (field: keyof HistoricalCharacter, value: any) => {
        if (!character) return;
        const updated = { ...character, [field]: value };
        updateCharacter(event.id, updated);
    };

    const handleUpdateHint = (index: number, value: string) => {
        if (!character) return;
        const newHints = [...character.hints] as [string, string, string, string, string, string, string];
        newHints[index] = value;
        handleUpdateChar('hints', newHints);
    };

    const handleAddNewCharacter = async () => {
        const newChar: HistoricalCharacter = {
            id: `char-${Date.now()}`,
            name: "Tên nhân vật mới",
            aliases: [],
            milestoneId: event.id,
            hints: [
                "Gợi ý 1", "Gợi ý 2", "Gợi ý 3", "Gợi ý 4", "Gợi ý 5", "Gợi ý 6", "Gợi ý 7"
            ],
            portrait: "👤",
            bio: "Tiểu sử nhân vật...",
            role: "Vai trò..."
        };
        await addCharacter(newChar);
        setEditingCharIndex(characters.length); // Switch to the new one
    };

    const handleDeleteChar = async (id: string) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa nhân vật này?")) {
            await deleteCharacter(event.id, id);
            if (editingCharIndex >= characters.length - 1) {
                setEditingCharIndex(Math.max(0, characters.length - 2));
            }
        }
    };

    const handleStart = () => {
        setShowIntro(false);
    };

    const handleNextHint = () => {
        if (currentHint < 6) {
            setCurrentHint(prev => prev + 1);
            setErrorMessage("");
            setUserGuess("");
        }
    };

    const handleSubmitGuess = () => {
        if (isEditMode || !character) return;
        if (!userGuess.trim()) {
            setErrorMessage("Vui lòng nhập câu trả lời!");
            return;
        }

        const correct = checkAnswer(userGuess, character);

        if (correct) {
            const stars = calculateStars(currentHint);
            setFinalStars(stars);
            setIsCorrect(true);

            // Award tokens (10 per star)
            if (!isEditMode && user?.id && !tokensAwarded) {
                const reward = stars * 10;
                if (addTokens) addTokens(reward);
                setTokensAwarded(true);
            }
            // Don't add to guessedCharIds yet, wait for "Next" or "Complete"
        } else {
            setErrorMessage("Chưa đúng! Hãy thử lại hoặc xem gợi ý tiếp theo.");
        }
    };

    const handleNextCharacter = () => {
        if (!character) return;

        // Mark current as guessed
        setGuessedCharIds(prev => [...prev, character.id]);

        // Pick random from remaining
        if (remainingCharacters.length > 0) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            // Ensure we pick one that's not guessed
            let nextIndex = randomIndex;
            while (guessedCharIds.includes(characters[nextIndex].id) || characters[nextIndex].id === character.id) {
                nextIndex = (nextIndex + 1) % characters.length;
            }

            setPlayingCharIndex(nextIndex);
            // Reset gameplay state
            setCurrentHint(0);
            setUserGuess("");
            setIsCorrect(false);
            setErrorMessage("");
            setTokensAwarded(false); // Reset award lock for next character
        }
    };

    const handleComplete = () => {
        // Clear persistence
        if (user?.id && event.id) {
            localStorage.removeItem(`hiss_char_state_${user.id}_${event.id}_${chapterId || 'default'}_${pageId || '0'}`);
        }
        onComplete();
    };

    const currentStars = calculateStars(currentHint);
    const hintNumber = currentHint + 1;

    // Introduction Screen
    if (showIntro && !isEditMode) {
        return (
            <div className="character-guess-container animate-fade-in">
                <button className="character-back-btn" onClick={onBack}>← Quay lại</button>
                <div className="character-title-section">
                    <div className="character-event-year">{event.year}</div>
                    <h1 className="character-event-title">{event.title}</h1>
                </div>

                <div className="intro-screen">
                    <div className="historian-avatar">👴📚</div>
                    <h2 className="historian-name">Nhà sử học</h2>
                    <div className="intro-message">
                        <p>"Chào bạn! Hãy cùng tôi khám phá nhân vật lịch sử liên quan đến sự kiện này nhé!"</p>
                        <p>"Tôi sẽ cho bạn tối đa 7 gợi ý. Đoán đúng càng sớm, bạn càng nhận được nhiều sao!"</p>
                        {characters.length > 1 && (
                            <p style={{ fontWeight: 'bold', color: '#8b6f47' }}>
                                (Hiện có {characters.length} nhân vật khác nhau để bạn thử sức!)
                            </p>
                        )}
                    </div>
                    <div className="star-info">
                        <div className="star-tier"><span>Gợi ý 1-3:</span> <span className="stars">⭐⭐⭐⭐⭐</span></div>
                        <div className="star-tier"><span>Gợi ý 4:</span> <span className="stars">⭐⭐⭐⭐</span></div>
                        <div className="star-tier"><span>Gợi ý 5:</span> <span className="stars">⭐⭐⭐</span></div>
                        <div className="star-tier"><span>Gợi ý 6:</span> <span className="stars">⭐⭐</span></div>
                        <div className="star-tier"><span>Gợi ý 7:</span> <span className="stars">⭐</span></div>
                    </div>
                    <button className="btn-start-game" onClick={handleStart}>🎯 Bắt đầu đoán</button>
                </div>
            </div>
        );
    }

    // Success Screen
    if (isCorrect && !isEditMode && character) {
        return (
            <div className="character-guess-container animate-fade-in">
                <button className="character-back-btn" onClick={onBack}>← Quay lại</button>
                <div className="character-title-section">
                    <div className="character-event-year">{event.year}</div>
                    <h1 className="character-event-title">{event.title}</h1>
                </div>

                <div className="success-screen">
                    <h2 className="success-title">🎉 CHÍNH XÁC! 🎉</h2>
                    <div className="final-stars">{"⭐".repeat(finalStars)}</div>
                    <div className="star-message">
                        {finalStars === 5 && "Xuất sắc! Kiến thức lịch sử tuyệt vời!"}
                        {finalStars === 4 && "Rất tốt! Bạn hiểu rõ lịch sử!"}
                        {finalStars === 3 && "Tốt! Tiếp tục học hỏi nhé!"}
                        {finalStars === 2 && "Khá! Cần ôn tập thêm một chút!"}
                        {finalStars === 1 && "Cố gắng! Hãy đọc kỹ kiến thức hơn!"}
                    </div>

                    {!isEditMode && (
                        <div className="token-reward animate-fade-in" style={{ margin: '15px 0', color: '#fbbf24', fontWeight: 'bold', fontSize: '20px', textShadow: '0 0 10px rgba(251, 191, 36, 0.4)' }}>
                            🎉 Khen thưởng: {finalStars * 10} Token!
                        </div>
                    )}

                    <div className="character-info">
                        <div className="character-portrait">{character.portrait}</div>
                        <h3 className="character-name">{character.name}</h3>
                        <p className="character-role">{character.role}</p>
                        {character.yearBorn && character.yearDied && (
                            <p className="character-years">({character.yearBorn} - {character.yearDied})</p>
                        )}
                        <p className="character-bio">{character.bio}</p>
                    </div>

                    <div className="success-actions">
                        {remainingCharacters.length > 0 ? (
                            <button className="btn-start-game" onClick={handleNextCharacter}>🎯 Đoán nhân vật tiếp theo ({remainingCharacters.length})</button>
                        ) : (
                            <button className="btn-complete" onClick={handleComplete}>✓ Hoàn thành</button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Main Game Screen / EDIT MODE
    return (
        <div className="character-guess-container animate-fade-in">
            <button className="character-back-btn" onClick={onBack}>← Quay lại</button>
            <div className="character-title-section">
                <div className="character-event-year">{event.year}</div>
                <h1 className="character-event-title">{event.title}</h1>
            </div>

            <div className={`game-screen ${isEditMode ? 'admin-edit-grid' : ''}`}>
                <div className="game-header">
                    <div className="historian-small">
                        <div className="historian-avatar-small">👴</div>
                        <span className="historian-name-small">Nhà sử học</span>
                    </div>
                    {!isEditMode && <div className="hint-progress">Gợi ý: {hintNumber}/7</div>}
                    {isEditMode && (
                        <div className="admin-char-selector">
                            <span className="admin-label">Nhân vật:</span>
                            <div className="admin-tabs">
                                {characters.map((c, i) => (
                                    <button
                                        key={c.id}
                                        className={`admin-tab ${i === editingCharIndex ? 'active' : ''}`}
                                        onClick={() => setEditingCharIndex(i)}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button className="btn-add-char" onClick={handleAddNewCharacter}>+</button>
                            </div>
                        </div>
                    )}
                </div>

                {!isEditMode && guessedCharIds.length > 0 && (
                    <div className="session-progress">Đã đoán: {guessedCharIds.length}/{characters.length} nhân vật</div>
                )}

                {isEditMode ? (
                    <div className="admin-character-editor">
                        {character ? (
                            <>
                                <div className="admin-edit-card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                        <h3>Thông tin chung</h3>
                                        <button className="btn-delete-char" onClick={() => handleDeleteChar(character.id)}>🗑️ Xóa</button>
                                    </div>
                                    <div className="admin-field">
                                        <label>Tên nhân vật:</label>
                                        <EditableText value={character.name} onSave={(v) => handleUpdateChar('name', v)} />
                                    </div>
                                    <div className="admin-field">
                                        <label>Biểu tượng (Portrait):</label>
                                        <EditableText value={character.portrait} onSave={(v) => handleUpdateChar('portrait', v)} />
                                    </div>
                                    <div className="admin-field">
                                        <label>Vai trò:</label>
                                        <EditableText value={character.role} onSave={(v) => handleUpdateChar('role', v)} />
                                    </div>
                                    <div className="admin-field">
                                        <label>Tiểu sử:</label>
                                        <EditableText value={character.bio} onSave={(v) => handleUpdateChar('bio', v)} multiline />
                                    </div>
                                </div>

                                <div className="admin-edit-card">
                                    <h3>Bộ 7 Gợi ý</h3>
                                    <div className="admin-hints-list">
                                        {character.hints.map((hint, idx) => (
                                            <div key={idx} className={`admin-field ${idx === currentHint ? 'current-hint-edit' : ''}`}>
                                                <label>Gợi ý #{idx + 1}:</label>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <button
                                                        className={`btn-jump ${idx === currentHint ? 'active' : ''}`}
                                                        onClick={() => setCurrentHint(idx)}
                                                    >👁️</button>
                                                    <EditableText value={hint} onSave={(v) => handleUpdateHint(idx, v)} multiline />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="admin-no-char">
                                <p>Cần thêm ít nhất một nhân vật để hiển thị.</p>
                                <button className="btn-start-game" onClick={handleAddNewCharacter}>+ Thêm nhân vật đầu tiên</button>
                            </div>
                        )}
                    </div>
                ) : (
                    character && (
                        <>
                            <div className="star-preview">
                                <span className="star-label">Nếu đúng ngay bây giờ:</span>
                                <span className="stars">{"⭐".repeat(currentStars)}</span>
                                <span className="star-count">({currentStars} sao)</span>
                            </div>

                            <div className="hint-display animate-slide-in">
                                <div className="hint-bubble">
                                    <div className="hint-number">Gợi ý #{hintNumber}</div>
                                    <p className="hint-text">{character.hints[currentHint]}</p>
                                </div>
                            </div>

                            <div className="guess-input-section">
                                <input
                                    type="text"
                                    className="guess-input"
                                    placeholder="Nhập tên nhân vật..."
                                    value={userGuess}
                                    onChange={(e) => {
                                        setUserGuess(e.target.value);
                                        setErrorMessage("");
                                    }}
                                    onKeyPress={(e) => { if (e.key === 'Enter') handleSubmitGuess(); }}
                                />
                                {errorMessage && <div className="error-message animate-shake">{errorMessage}</div>}
                            </div>

                            <div className="action-buttons">
                                <button className="btn-submit-guess" onClick={handleSubmitGuess}>✓ Trả lời</button>
                                {currentHint < 6 && (
                                    <button className="btn-next-hint" onClick={handleNextHint}>💡 Gợi ý tiếp theo</button>
                                )}
                            </div>
                        </>
                    )
                )}
            </div>
        </div>
    );
}
