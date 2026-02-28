import React, { createContext, useContext, useState, useEffect } from "react";
import { TimelineEvent, KnowledgeSection, Question } from "../types";
import { getCharactersForMilestone, HistoricalCharacter } from "../data/characters";
import { updateTimelineEvent, fetchTimelineEvents, fetchCharacters, updateCharacter as updateCharacterApi } from "../api";

// DEFAULT_KNOWLEDGE_SECTIONS — intentionally empty.
// Knᳰledge cưt đều được lưu trự trong TimelineEvent.chapters (db.json).
// getHeaders() chỉ là legacy fallback, hiện không dùng bởi bất kỳ component nào.
export const DEFAULT_KNOWLEDGE_SECTIONS: KnowledgeSection[] = [];

interface ContentContextType {
    getHeaders: () => KnowledgeSection[];
    getCharacters: (eventId: number) => HistoricalCharacter[];
    getQuiz: (eventId: number) => Question[] | null;
    saveKnowledge: (eventId: number, data: KnowledgeSection[]) => Promise<void>;
    updateCharacter: (eventId: number, character: HistoricalCharacter) => Promise<void>;
    addCharacter: (character: HistoricalCharacter) => Promise<void>;
    deleteCharacter: (eventId: number, charId: string) => Promise<void>;
    updateQuiz: (eventId: number, data: Question[]) => Promise<void>;
}

const ContentContext = createContext<ContentContextType | undefined>(undefined);

export function ContentProvider({ children }: { children: React.ReactNode }) {
    const [characterStore, setCharacterStore] = useState<Record<number, HistoricalCharacter[]>>({});
    const [events, setEvents] = useState<TimelineEvent[]>([]);

    // Initial load from API
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [eventsData, charactersData] = await Promise.all([
                    fetchTimelineEvents(),
                    fetchCharacters()
                ]);

                setEvents(eventsData);

                // Map characters by milestoneId (as arrays)
                const charMap: Record<number, HistoricalCharacter[]> = {};
                charactersData.forEach(char => {
                    if (char.milestoneId) {
                        if (!charMap[char.milestoneId]) charMap[char.milestoneId] = [];
                        charMap[char.milestoneId].push(char);
                    }
                });
                setCharacterStore(charMap);
            } catch (err) {
                console.error("Failed to load initial content data", err);
            }
        };
        loadInitialData();
    }, []);

    const getHeaders = () => {
        return DEFAULT_KNOWLEDGE_SECTIONS;
    };

    const getCharacters = (eventId: number) => {
        const chars = characterStore[eventId] || [];
        // Fallback to initial data if empty and it's milestone 1
        if (chars.length === 0 && eventId === 1) {
            return getCharactersForMilestone(1);
        }
        return chars;
    };

    const getQuiz = (eventId: number) => {
        const event = events.find(e => e.id === eventId);
        return event?.questions || null;
    };

    const saveKnowledge = async (eventId: number, data: KnowledgeSection[]) => {
        try {
            const event = events.find(e => e.id === eventId);
            if (event) {
                const updatedEvent = { ...event, knowledgeSections: data };
                await updateTimelineEvent(updatedEvent);
                setEvents(prev => prev.map(e => e.id === eventId ? updatedEvent : e));
            }
        } catch (error) {
            console.error("Failed to save knowledge sections", error);
            throw error;
        }
    };

    const updateCharacter = async (eventId: number, character: HistoricalCharacter) => {
        try {
            await updateCharacterApi(character);
            setCharacterStore(prev => {
                const milestoneChars = prev[eventId] || [];
                return {
                    ...prev,
                    [eventId]: milestoneChars.map(c => c.id === character.id ? character : c)
                };
            });
        } catch (error) {
            console.error("Failed to update character", error);
            throw error;
        }
    };

    const addCharacter = async (character: HistoricalCharacter) => {
        try {
            const { createCharacter: createCharApi } = await import("../api");
            const newChar = await createCharApi(character);
            setCharacterStore(prev => {
                const milestoneChars = prev[character.milestoneId] || [];
                return {
                    ...prev,
                    [character.milestoneId]: [...milestoneChars, newChar]
                };
            });
        } catch (error) {
            console.error("Failed to add character", error);
            throw error;
        }
    };

    const deleteCharacter = async (eventId: number, charId: string) => {
        try {
            const { deleteCharacter: deleteCharApi } = await import("../api");
            await deleteCharApi(charId);
            setCharacterStore(prev => {
                const milestoneChars = prev[eventId] || [];
                return {
                    ...prev,
                    [eventId]: milestoneChars.filter(c => c.id !== charId)
                };
            });
        } catch (error) {
            console.error("Failed to delete character", error);
            throw error;
        }
    };

    const updateQuiz = async (eventId: number, data: Question[]) => {
        try {
            const event = events.find(e => e.id === eventId);
            if (event) {
                const updatedEvent = { ...event, questions: data };
                await updateTimelineEvent(updatedEvent);
                setEvents(prev => prev.map(e => e.id === eventId ? updatedEvent : e));
            }
        } catch (error) {
            console.error("Failed to update quiz", error);
            throw error;
        }
    };

    return (
        <ContentContext.Provider value={{
            getHeaders,
            getCharacters,
            getQuiz,
            saveKnowledge,
            updateCharacter,
            addCharacter,
            deleteCharacter,
            updateQuiz
        }}>
            {children}
        </ContentContext.Provider>
    );
}

export function useContent() {
    const context = useContext(ContentContext);
    if (context === undefined) {
        throw new Error("useContent must be used within a ContentProvider");
    }
    return context;
}
