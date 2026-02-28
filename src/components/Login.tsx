import React, { useState } from "react";
import { login, register } from "../api";
import "../styles.css";

interface LoginProps {
    onLogin: (user: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            if (isRegistering) {
                const newUser = await register(username.trim(), password.trim(), name.trim());
                onLogin(newUser);
            } else {
                const user = await login(username.trim(), password.trim());
                onLogin(user);
            }
        } catch (err: any) {
            setError(err.message || (isRegistering ? "Đăng ký thất bại" : "Đăng nhập thất bại"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2 className="login-title">{isRegistering ? "Đăng Ký" : "Đăng Nhập"}</h2>
                <p className="login-subtitle">Hành trình lịch sử Việt Nam</p>

                <form onSubmit={handleSubmit} className="login-form">
                    {isRegistering && (
                        <div className="form-group">
                            <label>Họ và tên</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Nguyễn Văn A"
                                required
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label>Tên đăng nhập</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="username"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Mật khẩu</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="******"
                            required
                        />
                    </div>

                    {error && <div className="login-error">{error}</div>}

                    <button type="submit" className="btn-primary btn-block" disabled={loading}>
                        {loading ? "Đang xử lý..." : (isRegistering ? "Đăng Ký" : "Đăng Nhập")}
                    </button>

                    <div className="login-divider">hoặc</div>

                    <button
                        type="button"
                        className="btn-secondary btn-block"
                        onClick={() => {
                            setIsRegistering(!isRegistering);
                            setError("");
                            setUsername("");
                            setPassword("");
                            setName("");
                        }}
                    >
                        {isRegistering ? "Đã có tài khoản? Đăng nhập" : "Tạo tài khoản mới"}
                    </button>
                </form>
            </div>
        </div>
    );
};
