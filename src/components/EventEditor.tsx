import React, { useState, useEffect } from "react";
import { TimelineEvent, Question } from "../types";
import "../styles.css";

interface EventEditorProps {
    initialEvent?: TimelineEvent | null;
    onSave: (event: any) => void;
    onCancel: () => void;
}

export const EventEditor: React.FC<EventEditorProps> = ({ initialEvent, onSave, onCancel }) => {
    const [year, setYear] = useState(initialEvent?.year || "");
    const [title, setTitle] = useState(initialEvent?.title || "");
    const [description, setDescription] = useState(initialEvent?.description || "");
    const [detail, setDetail] = useState(initialEvent?.detail || "");
    const [imageUrl, setImageUrl] = useState(initialEvent?.imageUrl || "");
    const [color, setColor] = useState(initialEvent?.color || "blue");
    const [icon, setIcon] = useState(initialEvent?.icon || "star");
    const [position, setPosition] = useState(initialEvent?.position || "top");

    const [questions, setQuestions] = useState<Question[]>(initialEvent?.questions || []);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const eventData = {
            ...initialEvent,
            year,
            title,
            description,
            detail,
            imageUrl,
            color,
            icon,
            position,
            questions
        };
        onSave(eventData);
    };

    const handleAddQuestion = () => {
        setEditingQuestion({
            id: Date.now(),
            question: "",
            options: ["", "", "", ""],
            correctAnswer: 0
        });
    };

    const handleSaveQuestion = (q: Question) => {
        if (questions.find(existing => existing.id === q.id)) {
            setQuestions(questions.map(existing => existing.id === q.id ? q : existing));
        } else {
            setQuestions([...questions, q]);
        }
        setEditingQuestion(null);
    };

    const handleDeleteQuestion = (id: number) => {
        setQuestions(questions.filter(q => q.id !== id));
    };


    return (
        <div className="modal-backdrop">
            <div className="modal" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
                <button className="modal-close" onClick={onCancel}>×</button>
                <div className="modal-header">
                    <h2>{initialEvent ? "Chỉnh sửa sự kiện" : "Thêm sự kiện mới"}</h2>
                </div>

                <form onSubmit={handleSubmit} className="event-form">
                    <div className="form-group">
                        <label>Năm</label>
                        <input value={year} onChange={e => setYear(e.target.value)} required />
                    </div>

                    <div className="form-group">
                        <label>Tiêu đề</label>
                        <input value={title} onChange={e => setTitle(e.target.value)} required />
                    </div>

                    <div className="form-group">
                        <label>Mô tả ngắn</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} required />
                    </div>

                    <div className="form-group">
                        <label>Chi tiết lý thuyết</label>
                        <textarea value={detail} onChange={e => setDetail(e.target.value)} rows={6} required />
                    </div>

                    <div className="form-group">
                        <label>Hình ảnh URL</label>
                        <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
                    </div>

                    <div className="form-group-row">
                        <div className="form-group">
                            <label>Màu sắc</label>
                            <select value={color} onChange={e => setColor(e.target.value as any)}>
                                <option value="blue">Xanh dương</option>
                                <option value="green">Xanh lá</option>
                                <option value="red">Đỏ</option>
                                <option value="orange">Cam</option>
                                <option value="cyan">Cyan</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Icon</label>
                            <select value={icon} onChange={e => setIcon(e.target.value as any)}>
                                <option value="star">Sao</option>
                                <option value="people">Người</option>
                                <option value="clock">Đồng hồ</option>
                                <option value="gear">Bánh răng</option>
                                <option value="globe">Địa cầu</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Vị trí</label>
                            <select value={position} onChange={e => setPosition(e.target.value as any)}>
                                <option value="top">Trên</option>
                                <option value="bottom">Dưới</option>
                            </select>
                        </div>
                    </div>

                    <div className="questions-section">
                        <h3>Danh sách câu hỏi ({questions.length})</h3>
                        <div className="questions-list">
                            {questions.map((q, idx) => (
                                <div key={q.id} className="question-item">
                                    <span>{idx + 1}. {q.question}</span>
                                    <div className="question-actions">
                                        <button type="button" onClick={() => setEditingQuestion(q)}>Sửa</button>
                                        <button type="button" onClick={() => handleDeleteQuestion(q.id)} style={{ color: 'red' }}>Xóa</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button type="button" className="btn-secondary" onClick={handleAddQuestion}>+ Thêm câu hỏi</button>
                    </div>

                    <div className="form-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button type="button" className="btn-secondary" onClick={onCancel}>Hủy</button>
                        <button type="submit" className="btn-primary">Lưu thay đổi</button>
                    </div>
                </form>

                {editingQuestion && (
                    <QuestionEditor
                        question={editingQuestion}
                        onSave={handleSaveQuestion}
                        onCancel={() => setEditingQuestion(null)}
                    />
                )}
            </div>
        </div>
    );
};

const QuestionEditor = ({ question, onSave, onCancel }: { question: Question, onSave: (q: Question) => void, onCancel: () => void }) => {
    const [text, setText] = useState(question.question);
    const [options, setOptions] = useState(question.options);
    const [correctAnswer, setCorrectAnswer] = useState(question.correctAnswer);

    const handleOptionChange = (idx: number, val: string) => {
        const newOptions = [...options];
        newOptions[idx] = val;
        setOptions(newOptions);
    };

    return (
        <div className="modal-backdrop" style={{ zIndex: 100 }}>
            <div className="modal" style={{ maxWidth: '500px' }}>
                <h3>{question.id ? "Sửa câu hỏi" : "Thêm câu hỏi"}</h3>
                <div className="form-group">
                    <label>Nội dung câu hỏi</label>
                    <input value={text} onChange={e => setText(e.target.value)} required />
                </div>

                {options.map((opt, idx) => (
                    <div key={idx} className="form-group">
                        <label>Đáp án {idx + 1} {idx === correctAnswer && "(Đúng)"}</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input type="radio" name="correct" checked={idx === correctAnswer} onChange={() => setCorrectAnswer(idx)} />
                            <input value={opt} onChange={e => handleOptionChange(idx, e.target.value)} required />
                        </div>
                    </div>
                ))}

                <div className="form-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={onCancel}>Hủy</button>
                    <button type="button" className="btn-primary" onClick={() => onSave({ ...question, question: text, options, correctAnswer })}>Lưu</button>
                </div>
            </div>
        </div>
    );
};
