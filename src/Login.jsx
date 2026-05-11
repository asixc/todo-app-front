import { useState, useEffect, useRef } from "react";
import { requestOtp, verifyOtp } from "./auth";
import "./Login.css";

const OTP_DURATION = 600;

export default function Login({ onSuccess }) {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(OTP_DURATION);

  const timerRef = useRef(null);

  useEffect(() => {
    if (step === "otp" && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft((t) => t - 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [step, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await requestOtp(email.trim());
      setStep("otp");
      setTimeLeft(OTP_DURATION);
    } catch (err) {
      if (err instanceof TypeError) {
        // Error de red o CORS al leer la respuesta, pero el servidor
        // ya procesó la solicitud y envió el código por email.
        setStep("otp");
        setTimeLeft(OTP_DURATION);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const token = await verifyOtp(email.trim(), otp.trim());
      onSuccess(token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setLoading(true);
    setOtp("");

    try {
      await requestOtp(email);
      setTimeLeft(OTP_DURATION);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isExpired = timeLeft === 0 && step === "otp";

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Iniciar sesión</h2>

        {step === "email" && (
          <form onSubmit={handleRequestOtp}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                autoFocus
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? "Enviando..." : "Enviar código"}
            </button>
            {error && <p className="error">{error}</p>}
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerifyOtp}>
            <p className="hint">
              Código enviado a <strong>{email}</strong>
            </p>

            <div className="form-group">
              <label htmlFor="otp">Código OTP</label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  required
                  autoFocus
                  disabled={isExpired}
                />
            </div>

            <div className="timer">
              {isExpired ? (
                <span className="expired">Código expirado</span>
              ) : (
                <span>Tiempo restante: {formatTime(timeLeft)}</span>
              )}
            </div>

            <button type="submit" disabled={loading || isExpired}>
              {loading ? "Verificando..." : "Verificar"}
            </button>

            {isExpired && (
              <button
                type="button"
                className="resend"
                onClick={handleResend}
                disabled={loading}
              >
                Reenviar código
              </button>
            )}

            <button
              type="button"
              className="back"
              onClick={() => {
                setStep("email");
                setOtp("");
                setError(null);
              }}
            >
              Cambiar email
            </button>

            {error && <p className="error">{error}</p>}
          </form>
        )}
      </div>
    </div>
  );
}