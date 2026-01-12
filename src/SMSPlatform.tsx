import React, { useState, useEffect } from "react";

// Mock data
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

// GSM 7-bit character set
const GSM_CHARSET =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
const GSM_EXTENDED = "|^€{}[~]\\";

interface SmsStats {
  encoding: "GSM" | "Unicode";
  charCount: number;
  smsPartsCount: number;
  totalSmsCount: number;
  charsPerSms: number;
  remainingChars: number;
}

interface FormValues {
  senderId: string;
  templateId: string;
  mobileNumbers: string;
  message: string;
}

interface FormErrors {
  senderId?: string;
  templateId?: string;
  mobileNumbers?: string;
  message?: string;
}

const SMSPlatform: React.FC = () => {
  const [formValues, setFormValues] = useState<FormValues>({
    senderId: "",
    templateId: "",
    mobileNumbers: "",
    message: "",
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [smsStats, setSmsStats] = useState<SmsStats>({
    encoding: "GSM",
    charCount: 0,
    smsPartsCount: 0,
    totalSmsCount: 0,
    charsPerSms: 160,
    remainingChars: 160,
  });

  // Detect encoding type
  const detectEncoding = (text: string): "GSM" | "Unicode" => {
    for (const char of text) {
      if (!GSM_CHARSET.includes(char) && !GSM_EXTENDED.includes(char)) {
        return "Unicode";
      }
    }
    return "GSM";
  };


  const calculateCharCount = (
    text: string,
    encoding: "GSM" | "Unicode"
  ): number => {
    if (encoding === "Unicode") {
      return text.length;
    }

    let count = 0;
    for (const char of text) {
      count += GSM_EXTENDED.includes(char) ? 2 : 1;
    }
    return count;
  };

  const calculateSmsParts = (
    charCount: number,
    encoding: "GSM" | "Unicode"
  ): number => {
    if (charCount === 0) return 0;

    if (encoding === "GSM") {
      if (charCount <= 160) return 1;
      return Math.ceil(charCount / 153);
    } else {
      if (charCount <= 70) return 1;
      return Math.ceil(charCount / 67);
    }
  };

  const getUniqueValidNumbers = (numbersText: string): string[] => {
    const numbers = numbersText.split(/[,\n\s]+/).filter((n) => n.trim());
    const uniqueSet = new Set(numbers.map((n) => n.trim()));
    const uniqueNumbers = Array.from(uniqueSet);
    return uniqueNumbers.filter((num) => /^[6-9]\d{9}$/.test(num));
  };

  // Validate form
  const validateForm = (values: FormValues): FormErrors => {
    const errors: FormErrors = {};

    if (!values.senderId) {
      errors.senderId = "Please select a sender ID";
    }

    if (!values.templateId) {
      errors.templateId = "Please select a template";
    }

    if (!values.mobileNumbers.trim()) {
      errors.mobileNumbers = "Please enter at least one mobile number";
    } else {
      const numbers = values.mobileNumbers
        .split(/[,\n\s]+/)
        .filter((n) => n.trim());
      if (numbers.length === 0) {
        errors.mobileNumbers = "Please enter at least one mobile number";
      } else {
        const validNumbers = getUniqueValidNumbers(values.mobileNumbers);
        if (validNumbers.length === 0) {
          errors.mobileNumbers =
            "No valid mobile numbers found. Numbers must be 10 digits starting with 6-9";
        }
      }
    }

    if (!values.message.trim()) {
      errors.message = "Message cannot be empty";
    } else if (values.message.length > 1000) {
      errors.message = "Message is too long (max 1000 characters)";
    }

    return errors;
  };


  useEffect(() => {
    const message = formValues.message;
    const encoding = detectEncoding(message);
    const charCount = calculateCharCount(message, encoding);
    const smsPartsCount = calculateSmsParts(charCount, encoding);
    const uniqueNumbers = getUniqueValidNumbers(formValues.mobileNumbers);
    const totalSmsCount = smsPartsCount * uniqueNumbers.length;

    let charsPerSms: number;
    let remainingChars: number;

    if (encoding === "GSM") {
      charsPerSms = smsPartsCount <= 1 ? 160 : 153;
      remainingChars =
        smsPartsCount <= 1 ? 160 - charCount : 153 * smsPartsCount - charCount;
    } else {
      charsPerSms = smsPartsCount <= 1 ? 70 : 67;
      remainingChars =
        smsPartsCount <= 1 ? 70 - charCount : 67 * smsPartsCount - charCount;
    }

    setSmsStats({
      encoding,
      charCount,
      smsPartsCount,
      totalSmsCount,
      charsPerSms,
      remainingChars,
    });
  }, [formValues.message, formValues.mobileNumbers]);

  const handleChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      const newErrors = { ...formErrors };
      delete newErrors[name as keyof FormErrors];
      setFormErrors(newErrors);
    }
  };


  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value;
    setFormValues((prev) => ({ ...prev, templateId }));

    const template = templates.find((t) => t.id.toString() === templateId);
    if (template) {
      setFormValues((prev) => ({ ...prev, message: template.content }));
      // Clear message error if exists
      if (formErrors.message) {
        const newErrors = { ...formErrors };
        delete newErrors.message;
        setFormErrors(newErrors);
      }
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errors = validateForm(formValues);
    setFormErrors(errors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateForm(formValues);
    setFormErrors(errors);
    setTouched({
      senderId: true,
      templateId: true,
      mobileNumbers: true,
      message: true,
    });

    if (Object.keys(errors).length === 0) {
      setIsSubmitting(true);

      await new Promise((resolve) => setTimeout(resolve, 1500));

      const uniqueNumbers = getUniqueValidNumbers(formValues.mobileNumbers);

      console.log("SMS Send Request:", {
        sender: formValues.senderId,
        template: templates.find(
          (t) => t.id.toString() === formValues.templateId
        )?.name,
        recipients: uniqueNumbers,
        recipientCount: uniqueNumbers.length,
        encoding: smsStats.encoding,
        charCount: smsStats.charCount,
        smsParts: smsStats.smsPartsCount,
        totalSms: smsStats.totalSmsCount,
        message: formValues.message,
      });

      setIsSubmitting(false);
      setShowSuccess(true);

      // Reset form after success
      setFormValues({
        senderId: "",
        templateId: "",
        mobileNumbers: "",
        message: "",
      });

      setFormErrors({});
      setTouched({});

      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000);
    }
  };

  const isFormValid = Object.keys(validateForm(formValues)).length === 0;
  const uniqueValidNumbers = getUniqueValidNumbers(formValues.mobileNumbers);

  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 20px;
        }

        .app-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .app-header {
          text-align: center;
          color: white;
          margin-bottom: 30px;
          animation: fadeInDown 0.6s ease-out;
        }

        .app-header h1 {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 10px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }

        .app-header p {
          font-size: 1.1rem;
          opacity: 0.95;
        }

        .main-card {
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          overflow: hidden;
          animation: fadeInUp 0.6s ease-out;
        }

        .card-header-custom {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 25px 30px;
          border-bottom: 3px solid rgba(255,255,255,0.2);
        }

        .card-header-custom h2 {
          font-size: 1.75rem;
          font-weight: 600;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .icon {
          font-size: 1.5rem;
        }

        .card-body-custom {
          padding: 35px;
        }

        .form-section {
          margin-bottom: 25px;
        }

        .form-label-custom {
          display: block;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 8px;
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .required-star {
          color: #e53e3e;
        }

        .form-control-custom {
          width: 100%;
          padding: 12px 16px;
          font-size: 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          transition: all 0.3s ease;
          background: #f7fafc;
        }

        .form-control-custom:focus {
          outline: none;
          border-color: #667eea;
          background: white;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-control-custom.error {
          border-color: #fc8181;
          background: #fff5f5;
        }

        textarea.form-control-custom {
          resize: vertical;
          min-height: 100px;
          font-family: inherit;
        }

        .error-message {
          color: #e53e3e;
          font-size: 0.875rem;
          margin-top: 6px;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .helper-text {
          color: #718096;
          font-size: 0.875rem;
          margin-top: 6px;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .helper-text.success {
          color: #38a169;
        }

        .row-custom {
          display: grid;
          grid-template-columns: 1fr;
          gap: 25px;
        }

        @media (min-width: 768px) {
          .row-custom.two-col {
            grid-template-columns: 1fr 1fr;
          }
        }

        .stats-container {
          background: linear-gradient(135deg, #f6f8fb 0%, #e9ecef 100%);
          border-radius: 15px;
          padding: 25px;
          margin: 30px 0;
          border: 2px solid #e2e8f0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-bottom: 20px;
        }

        @media (min-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .stat-label {
          font-size: 0.85rem;
          color: #718096;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
          font-weight: 600;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: #2d3748;
          margin-bottom: 5px;
        }

        .stat-badge {
          display: inline-block;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          margin-top: 5px;
        }

        .badge-gsm {
          background: #c6f6d5;
          color: #22543d;
        }

        .badge-unicode {
          background: #feebc8;
          color: #7c2d12;
        }

        .stat-primary { color: #667eea; }
        .stat-success { color: #48bb78; }
        .stat-info { color: #4299e1; }
        .stat-danger { color: #f56565; }

        .stats-info {
          background: white;
          border-radius: 10px;
          padding: 15px;
          font-size: 0.9rem;
          color: #4a5568;
        }

        .stats-info-item {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .stats-info-item:last-child {
          margin-bottom: 0;
        }

        .submit-btn {
          width: 100%;
          padding: 16px 24px;
          font-size: 1.1rem;
          font-weight: 600;
          color: white;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
        }

        .submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .info-card {
          background: white;
          border-radius: 15px;
          padding: 25px;
          margin-top: 25px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          border-left: 4px solid #4299e1;
          animation: fadeInUp 0.6s ease-out 0.2s backwards;
        }

        .info-card h3 {
          color: #2d3748;
          font-size: 1.2rem;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .info-list {
          list-style: none;
          padding: 0;
        }

        .info-list li {
          padding: 10px 0;
          border-bottom: 1px solid #e2e8f0;
          color: #4a5568;
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .info-list li:last-child {
          border-bottom: none;
        }

        .info-list li:before {
          content: "✓";
          color: #48bb78;
          font-weight: bold;
          flex-shrink: 0;
        }

        .success-alert {
          background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
          color: white;
          padding: 18px 24px;
          border-radius: 12px;
          margin-bottom: 25px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 4px 15px rgba(72, 187, 120, 0.3);
          animation: slideInDown 0.5s ease-out;
        }

        .spinner {
          border: 3px solid rgba(255,255,255,0.3);
          border-top: 3px solid white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .template-badge {
          display: inline-block;
          background: #edf2f7;
          color: #4a5568;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.75rem;
          margin-left: 8px;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          body {
            padding: 10px;
          }

          .app-header h1 {
            font-size: 1.8rem;
          }

          .app-header p {
            font-size: 0.95rem;
          }

          .card-body-custom {
            padding: 20px;
          }

          .stats-container {
            padding: 20px;
          }

          .stat-value {
            font-size: 1.5rem;
          }

          .submit-btn {
            padding: 14px 20px;
            font-size: 1rem;
          }
        }

        select.form-control-custom {
          cursor: pointer;
          background-color: #f7fafc;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23667eea' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 40px;
          appearance: none;
        }

        .number-counter {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px 15px;
          margin-top: 10px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 0.9rem;
        }

        .counter-badge {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-weight: 600;
        }
      `}</style>

      <div className="app-container">
        <div className="app-header">
          <h1>📱 SMS Platform</h1>
          <p>Send bulk SMS messages efficiently and reliably</p>
        </div>

        <div className="main-card">
          <div className="card-header-custom">
            <h2>
              <span className="icon">✉️</span>
              Compose & Send SMS
            </h2>
          </div>

          <div className="card-body-custom">
            {showSuccess && (
              <div className="success-alert">
                <span style={{ fontSize: "1.5rem" }}>✓</span>
                <div>
                  <strong>Success!</strong> Your SMS has been queued for
                  delivery to {uniqueValidNumbers.length} recipient(s).
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="row-custom two-col">
                {/* Sender ID */}
                <div className="form-section">
                  <label className="form-label-custom">
                    <span>📤</span>
                    Sender ID <span className="required-star">*</span>
                  </label>
                  <select
                    className={`form-control-custom ${
                      touched.senderId && formErrors.senderId ? "error" : ""
                    }`}
                    name="senderId"
                    value={formValues.senderId}
                    onChange={handleChange}
                    onBlur={() => handleBlur("senderId")}
                  >
                    <option value="">Choose sender ID...</option>
                    {senderIds.map((sender) => (
                      <option key={sender.id} value={sender.value}>
                        {sender.label}
                      </option>
                    ))}
                  </select>
                  {touched.senderId && formErrors.senderId && (
                    <div className="error-message">
                      <span>⚠️</span>
                      {formErrors.senderId}
                    </div>
                  )}
                </div>

                {/* Template */}
                <div className="form-section">
                  <label className="form-label-custom">
                    <span>📄</span>
                    Message Template <span className="required-star">*</span>
                  </label>
                  <select
                    className={`form-control-custom ${
                      touched.templateId && formErrors.templateId ? "error" : ""
                    }`}
                    name="templateId"
                    value={formValues.templateId}
                    onChange={handleTemplateChange}
                    onBlur={() => handleBlur("templateId")}
                  >
                    <option value="">Select a template...</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                  {touched.templateId && formErrors.templateId && (
                    <div className="error-message">
                      <span>⚠️</span>
                      {formErrors.templateId}
                    </div>
                  )}
                  {formValues.templateId && (
                    <div className="helper-text">
                      <span>ℹ️</span>
                      Category:{" "}
                      {
                        templates.find(
                          (t) => t.id.toString() === formValues.templateId
                        )?.category
                      }
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile Numbers */}
              <div className="form-section">
                <label className="form-label-custom">
                  <span>👥</span>
                  Mobile Numbers <span className="required-star">*</span>
                </label>
                <textarea
                  className={`form-control-custom ${
                    touched.mobileNumbers && formErrors.mobileNumbers
                      ? "error"
                      : ""
                  }`}
                  name="mobileNumbers"
                  rows={5}
                  placeholder="Enter mobile numbers separated by comma, space, or newline&#10;&#10;Example:&#10;9876543210, 8765432109&#10;7654321098&#10;9123456789"
                  value={formValues.mobileNumbers}
                  onChange={handleChange}
                  onBlur={() => handleBlur("mobileNumbers")}
                />
                {touched.mobileNumbers && formErrors.mobileNumbers && (
                  <div className="error-message">
                    <span>⚠️</span>
                    {formErrors.mobileNumbers}
                  </div>
                )}
                <div className="number-counter">
                  <span>Valid Recipients:</span>
                  <span className="counter-badge">
                    {uniqueValidNumbers.length}
                  </span>
                  {uniqueValidNumbers.length > 0 && (
                    <span style={{ color: "#48bb78", marginLeft: "5px" }}>
                      ✓
                    </span>
                  )}
                </div>
              </div>

              {/* Message */}
              <div className="form-section">
                <label className="form-label-custom">
                  <span>💬</span>
                  Message Content <span className="required-star">*</span>
                </label>
                <textarea
                  className={`form-control-custom ${
                    touched.message && formErrors.message ? "error" : ""
                  }`}
                  name="message"
                  rows={6}
                  placeholder="Your message will appear here when you select a template, or you can type your own message..."
                  value={formValues.message}
                  onChange={handleChange}
                  onBlur={() => handleBlur("message")}
                />
                {touched.message && formErrors.message && (
                  <div className="error-message">
                    <span>⚠️</span>
                    {formErrors.message}
                  </div>
                )}
              </div>

              {/* SMS Statistics */}
              <div className="stats-container">
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-label">Encoding</div>
                    <div className="stat-value" style={{ fontSize: "1.3rem" }}>
                      <span
                        className={`stat-badge ${
                          smsStats.encoding === "GSM"
                            ? "badge-gsm"
                            : "badge-unicode"
                        }`}
                      >
                        {smsStats.encoding}
                      </span>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-label">Characters</div>
                    <div className="stat-value stat-primary">
                      {smsStats.charCount}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#a0aec0" }}>
                      {smsStats.remainingChars > 0
                        ? `${smsStats.remainingChars} left`
                        : "New part started"}
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-label">SMS Parts</div>
                    <div className="stat-value stat-info">
                      {smsStats.smsPartsCount}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#a0aec0" }}>
                      {smsStats.charsPerSms} chars/part
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-label">Total SMS</div>
                    <div className="stat-value stat-danger">
                      {smsStats.totalSmsCount}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#a0aec0" }}>
                      Will be sent
                    </div>
                  </div>
                </div>

                <div className="stats-info">
                  <div className="stats-info-item">
                    <span>📊</span>
                    <strong>Current Settings:</strong> {smsStats.encoding}{" "}
                    encoding,
                    {smsStats.smsPartsCount === 0
                      ? " No message"
                      : smsStats.smsPartsCount === 1
                      ? ` Single SMS (${smsStats.charsPerSms} chars max)`
                      : ` Concatenated (${smsStats.charsPerSms} chars per part)`}
                  </div>
                  {smsStats.encoding === "GSM" && formValues.message && (
                    <div className="stats-info-item">
                      <span>💡</span>
                      <span>
                        Extended characters ( | ^ € {} [ ~ ] \ ) count as 2
                        characters in GSM encoding
                      </span>
                    </div>
                  )}
                  {smsStats.encoding === "Unicode" && formValues.message && (
                    <div className="stats-info-item">
                      <span>🌐</span>
                      <span>
                        Unicode encoding detected - supports emojis and special
                        characters
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="submit-btn"
                disabled={!isFormValid || isSubmitting}
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

        {/* Information Card */}
        <div className="info-card">
          <h3>
            <span>ℹ️</span>
            Important Information
          </h3>
          <ul className="info-list">
            <li>
              Mobile numbers must be exactly 10 digits and start with 6, 7, 8,
              or 9
            </li>
            <li>Duplicate numbers are automatically detected and removed</li>
            <li>
              GSM encoding supports standard English characters and common
              symbols
            </li>
            <li>
              Unicode encoding is automatically used for emojis, non-English
              characters, and special symbols
            </li>
            <li>
              Extended GSM characters ( | ^ € {} [ ~ ] \ ) count as 2 characters
            </li>
            <li>Single SMS: GSM allows 160 chars, Unicode allows 70 chars</li>
            <li>
              Concatenated SMS: GSM uses 153 chars/part, Unicode uses 67
              chars/part
            </li>
            <li>
              Total SMS count is calculated as: (SMS parts) × (number of
              recipients)
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default SMSPlatform;
