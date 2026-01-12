import React, { useState, useEffect } from "react";
import "./SmsPlatform.scss";

// Mock Data
const senderIds = [
  { id: 1, value: "COMPNY", label: "COMPNY - Company Name" },
  { id: 2, value: "ALERTS", label: "ALERTS - Alert Messages" },
  { id: 3, value: "NOTIFY", label: "NOTIFY - Notifications" },
  { id: 4, value: "MARKET", label: "MARKET - Marketing" },
];

const templates = [
  {
    id: 1,
    name: "Welcome Message",
    content: "Welcome to our service! We are glad to have you with us.",
    category: "Transactional",
  },
  {
    id: 2,
    name: "OTP Verification",
    content:
      "Your OTP is {OTP}. Valid for 10 minutes. Do not share with anyone.",
    category: "Security",
  },
  {
    id: 3,
    name: "Promotional Offer",
    content:
      "Special offer! Get 50% off on all products. Use code: SAVE50 | Shop now at www.example.com",
    category: "Marketing",
  },
  {
    id: 4,
    name: "Appointment Reminder",
    content:
      "Reminder: Your appointment is scheduled for {DATE} at {TIME}. Please arrive 10 minutes early.",
    category: "Transactional",
  },
  {
    id: 5,
    name: "Order Confirmation",
    content:
      "Order #{ORDER_ID} confirmed! Expected delivery: {DATE}. Track at www.example.com/track",
    category: "Transactional",
  },
];

// GSM Characters
const GSM_CHARSET =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
const GSM_EXTENDED = "|^€{}[~]\\";

const SMSPlatform = () => {
  // Form State
  const [senderId, setSenderId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [mobileNumbers, setMobileNumbers] = useState("");
  const [message, setMessage] = useState("");

  // UI State
  const [errors, setErrors] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // SMS Stats
  const [stats, setStats] = useState({
    encoding: "GSM",
    charCount: 0,
    smsParts: 0,
    totalSMS: 0,
    charsPerSMS: 160,
    remaining: 160,
  });

  // Check if character is GSM
  const isGSMChar = (char: any) => {
    return GSM_CHARSET.includes(char) || GSM_EXTENDED.includes(char);
  };

  // Detect encoding
  const detectEncoding = (text: any) => {
    for (let char of text) {
      if (!isGSMChar(char)) return "Unicode";
    }
    return "GSM";
  };

  // Count characters
  const countChars = (text: any, encoding: any) => {
    if (encoding === "Unicode") return text.length;

    let count = 0;
    for (let char of text) {
      count += GSM_EXTENDED.includes(char) ? 2 : 1;
    }
    return count;
  };

  // Calculate SMS parts
  const calculateParts = (charCount: any, encoding: any) => {
    if (charCount === 0) return 0;

    if (encoding === "GSM") {
      if (charCount <= 160) return 1;
      return Math.ceil(charCount / 153);
    } else {
      if (charCount <= 70) return 1;
      return Math.ceil(charCount / 67);
    }
  };

  const getValidNumbers = (text: any) => {
    const numbers = text.split(/[,\n\s]+/).filter((n: any) => n.trim());
    const unique = Array.from(new Set(numbers));
    return unique.filter((num: any) => /^[6-9]\d{9}$/.test(num));
  };

  // Update stats when message or numbers change
  useEffect(() => {
    const encoding = detectEncoding(message);
    const charCount = countChars(message, encoding);
    const smsParts = calculateParts(charCount, encoding);
    const validNumbers = getValidNumbers(mobileNumbers);
    const totalSMS = smsParts * validNumbers.length;

    let charsPerSMS, remaining;
    if (encoding === "GSM") {
      charsPerSMS = smsParts <= 1 ? 160 : 153;
      remaining = smsParts <= 1 ? 160 - charCount : 153 * smsParts - charCount;
    } else {
      charsPerSMS = smsParts <= 1 ? 70 : 67;
      remaining = smsParts <= 1 ? 70 - charCount : 67 * smsParts - charCount;
    }

    setStats({
      encoding,
      charCount,
      smsParts,
      totalSMS,
      charsPerSMS,
      remaining,
    });
  }, [message, mobileNumbers]);

  // Handle template selection
  const handleTemplateChange = (e: any) => {
    const id = e.target.value;
    setTemplateId(id);

    const template = templates.find((t) => t.id.toString() === id);
    if (template) {
      setMessage(template.content);
    }
  };

  // Validate form
  const validate = () => {
    const newErrors: any = {};

    if (!senderId) newErrors.senderId = "Please select a sender ID";
    if (!templateId) newErrors.templateId = "Please select a template";

    if (!mobileNumbers.trim()) {
      newErrors.mobileNumbers = "Please enter mobile numbers";
    } else {
      const valid = getValidNumbers(mobileNumbers);
      if (valid.length === 0) {
        newErrors.mobileNumbers =
          "No valid numbers found (10 digits, starts with 6-9)";
      }
    }

    if (!message.trim()) {
      newErrors.message = "Message cannot be empty";
    } else if (message.length > 1000) {
      newErrors.message = "Message too long (max 1000 characters)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const validNumbers = getValidNumbers(mobileNumbers);
    console.log("SMS Sent:", {
      sender: senderId,
      recipients: validNumbers,
      message,
      stats,
    });

    // Reset form
    setSenderId("");
    setTemplateId("");
    setMobileNumbers("");
    setMessage("");
    setErrors({});
    setIsSubmitting(false);
    setShowSuccess(true);

    setTimeout(() => setShowSuccess(false), 5000);
  };

  const validNumbers = getValidNumbers(mobileNumbers);

  return (
    <div className="app-container">
      <div className="app-header">
        <h1>📱 SMS Platform</h1>
        <p>Send bulk SMS messages efficiently and reliably</p>
      </div>

      <div className="main-card">
        <div className="card-header">
          <h2>
            <span>✉️</span>
            Compose & Send SMS
          </h2>
        </div>

        <div className="card-body">
          {showSuccess && (
            <div className="success-alert">
              <span style={{ fontSize: "1.5rem" }}>✓</span>
              <div>
                <strong>Success!</strong> SMS sent to {validNumbers.length}{" "}
                recipient(s).
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-row two-columns">
              {/* Sender ID */}
              <div className="form-group">
                <label className="form-label">
                  <span>📤</span>
                  Sender ID
                  <span className="required">*</span>
                </label>
                <select
                  className={`form-control ${errors.senderId ? "error" : ""}`}
                  value={senderId}
                  onChange={(e) => setSenderId(e.target.value)}
                >
                  <option value="">Choose sender ID...</option>
                  {senderIds.map((sender) => (
                    <option key={sender.id} value={sender.value}>
                      {sender.label}
                    </option>
                  ))}
                </select>
                {errors.senderId && (
                  <div className="error-message">
                    <span>⚠️</span> {errors.senderId}
                  </div>
                )}
              </div>

              {/* Template */}
              <div className="form-group">
                <label className="form-label">
                  <span>📄</span>
                  Message Template
                  <span className="required">*</span>
                </label>
                <select
                  className={`form-control ${errors.templateId ? "error" : ""}`}
                  value={templateId}
                  onChange={handleTemplateChange}
                >
                  <option value="">Select a template...</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
                {errors.templateId && (
                  <div className="error-message">
                    <span>⚠️</span> {errors.templateId}
                  </div>
                )}
                {templateId && (
                  <div className="helper-text">
                    <span>ℹ️</span>
                    Category:{" "}
                    {
                      templates.find((t) => t.id.toString() === templateId)
                        ?.category
                    }
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Numbers */}
            <div className="form-group">
              <label className="form-label">
                <span>👥</span>
                Mobile Numbers
                <span className="required">*</span>
              </label>
              <textarea
                className={`form-control ${
                  errors.mobileNumbers ? "error" : ""
                }`}
                rows={5}
                placeholder="Enter mobile numbers separated by comma, space, or newline&#10;&#10;Example:&#10;9876543210, 8765432109&#10;7654321098"
                value={mobileNumbers}
                onChange={(e) => setMobileNumbers(e.target.value)}
              />
              {errors.mobileNumbers && (
                <div className="error-message">
                  <span>⚠️</span> {errors.mobileNumbers}
                </div>
              )}
              <div className="number-counter">
                <span>Valid Recipients:</span>
                <span className="badge">{validNumbers.length}</span>
                {validNumbers.length > 0 && (
                  <span style={{ color: "#48bb78" }}>✓</span>
                )}
              </div>
            </div>

            {/* Message */}
            <div className="form-group">
              <label className="form-label">
                <span>💬</span>
                Message Content
                <span className="required">*</span>
              </label>
              <textarea
                className={`form-control ${errors.message ? "error" : ""}`}
                rows={6}
                placeholder="Select a template or type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              {errors.message && (
                <div className="error-message">
                  <span>⚠️</span> {errors.message}
                </div>
              )}
            </div>

            {/* SMS Statistics */}
            <div className="stats-container">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="label">Encoding</div>
                  <div className="value">
                    <span
                      className={`badge ${
                        stats.encoding === "GSM" ? "gsm" : "unicode"
                      }`}
                    >
                      {stats.encoding}
                    </span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="label">Characters</div>
                  <div className="value primary">{stats.charCount}</div>
                  <div className="sub-text">
                    {stats.remaining > 0
                      ? `${stats.remaining} left`
                      : "New part started"}
                  </div>
                </div>

                <div className="stat-card">
                  <div className="label">SMS Parts</div>
                  <div className="value info">{stats.smsParts}</div>
                  <div className="sub-text">{stats.charsPerSMS} chars/part</div>
                </div>

                <div className="stat-card">
                  <div className="label">Total SMS</div>
                  <div className="value danger">{stats.totalSMS}</div>
                  <div className="sub-text">Will be sent</div>
                </div>
              </div>

              <div className="stats-info">
                <div className="info-item">
                  <span>📊</span>
                  <strong>Settings:</strong> {stats.encoding} encoding,
                  {stats.smsParts === 0
                    ? " No message"
                    : stats.smsParts === 1
                    ? ` Single SMS (${stats.charsPerSMS} chars max)`
                    : ` ${stats.smsParts} parts (${stats.charsPerSMS} chars each)`}
                </div>
                {stats.encoding === "GSM" && message && (
                  <div className="info-item">
                    <span>💡</span>
                    Extended characters ( | ^ € {} [ ~ ] \ ) count as 2
                    characters
                  </div>
                )}
                {stats.encoding === "Unicode" && message && (
                  <div className="info-item">
                    <span>🌐</span>
                    Unicode mode - supports emojis and special characters
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: "1.3rem" }}>🚀</span>
                  <span>Send SMS Now</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Info Card */}
      <div className="info-card">
        <h3>
          <span>ℹ️</span>
          Important Information
        </h3>
        <ul>
          <li>Mobile numbers must be 10 digits starting with 6, 7, 8, or 9</li>
          <li>Duplicate numbers are automatically removed</li>
          <li>
            GSM encoding: 160 chars (single) / 153 chars per part (multiple)
          </li>
          <li>
            Unicode encoding: 70 chars (single) / 67 chars per part (multiple)
          </li>
          <li>
            Extended GSM characters ( | ^ € {} [ ~ ] \ ) count as 2 characters
          </li>
          <li>Total SMS = (Parts per message) × (Number of recipients)</li>
        </ul>
      </div>
    </div>
  );
};

export default SMSPlatform;
