import fs from "fs";
import path from "path";
import tls from "tls";

export interface SmtpConfigState {
  smtpUser: string; // e.g. "nguyentanhao125@gmail.com"
  smtpPass: string; // 16-char Google App Password e.g. "abcd efgh ijkl mnop"
  senderName: string;
  enabled: boolean;
}

const SMTP_CONFIG_PATH = path.join(process.cwd(), ".smtp-config.json");

const globalForSmtp = globalThis as unknown as {
  smtpState: SmtpConfigState | undefined;
};

function loadInitialSmtpState(): SmtpConfigState {
  try {
    if (fs.existsSync(SMTP_CONFIG_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(SMTP_CONFIG_PATH, "utf-8"));
      return {
        smtpUser: parsed.smtpUser || process.env.SMTP_USER || "nguyentanhao125@gmail.com",
        smtpPass: parsed.smtpPass || process.env.SMTP_PASS || "",
        senderName: parsed.senderName || "Hệ Thống Khảo Thí BluePass IELTS",
        enabled: parsed.enabled ?? Boolean(parsed.smtpPass || process.env.SMTP_PASS),
      };
    }
  } catch {
    // Fallback
  }

  return {
    smtpUser: process.env.SMTP_USER || "nguyentanhao125@gmail.com",
    smtpPass: process.env.SMTP_PASS || "",
    senderName: "Hệ Thống Khảo Thí BluePass IELTS",
    enabled: Boolean(process.env.SMTP_PASS),
  };
}

export function getSmtpState(): SmtpConfigState {
  if (!globalForSmtp.smtpState) {
    globalForSmtp.smtpState = loadInitialSmtpState();
  }
  return globalForSmtp.smtpState;
}

export function saveSmtpState(state: SmtpConfigState) {
  globalForSmtp.smtpState = state;
  try {
    fs.writeFileSync(SMTP_CONFIG_PATH, JSON.stringify(state, null, 2), "utf-8");
  } catch {
    // Ignore write error
  }
}

/**
 * Native TLS SMTP Client for smtp.gmail.com:465 (Zero external dependencies)
 */
export async function sendGmailHtmlEmail(params: {
  to: string;
  subject: string;
  html: string;
  overrideUser?: string;
  overridePass?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const state = getSmtpState();
  const user = (params.overrideUser ?? state.smtpUser).trim();
  // Strip spaces from 16-char Google App Password (e.g. "xxxx xxxx xxxx xxxx" -> "xxxxxxxxxxxxxxxx")
  const pass = (params.overridePass ?? state.smtpPass).replace(/\s+/g, "").trim();

  if (!user || !pass) {
    return {
      ok: false,
      error: "Chưa cấu hình Mật khẩu ứng dụng Gmail (16 ký tự Google App Password).",
    };
  }

  return new Promise((resolve) => {
    const socket = tls.connect({
      host: "smtp.gmail.com",
      port: 465,
      servername: "smtp.gmail.com",
      timeout: 12000,
    });

    let step = 0;
    let buffer = "";
    let settled = false;

    const finish = (result: { ok: boolean; error?: string }) => {
      if (settled) return;
      settled = true;
      try {
        socket.end();
      } catch {
        // Ignore
      }
      resolve(result);
    };

    socket.on("timeout", () => {
      finish({ ok: false, error: "Kết nối tới smtp.gmail.com:465 bị quá thời gian (Timeout)." });
    });

    socket.on("error", (err) => {
      finish({ ok: false, error: `Lỗi kết nối SMTP Gmail: ${err.message}` });
    });

    const sendLine = (line: string) => {
      socket.write(line + "\r\n");
    };

    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf-8");
      const lines = buffer.split("\r\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line) continue;
        // Multi-line SMTP response continues if 4th char is '-'
        if (line.length >= 4 && line[3] === "-") continue;

        const code = parseInt(line.slice(0, 3), 10);

        if (step === 0 && code === 220) {
          step = 1;
          sendLine("EHLO bluepass.edu.vn");
        } else if (step === 1 && code === 250) {
          step = 2;
          sendLine("AUTH LOGIN");
        } else if (step === 2 && code === 334) {
          step = 3;
          sendLine(Buffer.from(user, "utf-8").toString("base64"));
        } else if (step === 3 && code === 334) {
          step = 4;
          sendLine(Buffer.from(pass, "utf-8").toString("base64"));
        } else if (step === 4) {
          if (code === 235) {
            step = 5;
            sendLine(`MAIL FROM:<${user}>`);
          } else {
            finish({
              ok: false,
              error:
                "Xác thực Gmail thất bại (Mã 535): Hãy chắc chắn bạn nhập đúng Mật Khẩu Ứng Dụng 16 ký tự của Google (App Password), không phải mật khẩu đăng nhập Gmail thông thường.",
            });
          }
        } else if (step === 5 && code === 250) {
          step = 6;
          sendLine(`RCPT TO:<${params.to.trim()}>`);
        } else if (step === 6 && code === 250) {
          step = 7;
          sendLine("DATA");
        } else if (step === 7 && code === 354) {
          step = 8;
          const encodedSubject = `=?UTF-8?B?${Buffer.from(params.subject, "utf-8").toString(
            "base64"
          )}?=`;
          const encodedSender = `=?UTF-8?B?${Buffer.from(state.senderName, "utf-8").toString(
            "base64"
          )}?=`;
          const bodyBase64 = Buffer.from(params.html, "utf-8").toString("base64");

          const mimeMessage = [
            `From: ${encodedSender} <${user}>`,
            `To: <${params.to.trim()}>`,
            `Subject: ${encodedSubject}`,
            `MIME-Version: 1.0`,
            `Content-Type: text/html; charset="UTF-8"`,
            `Content-Transfer-Encoding: base64`,
            ``,
            bodyBase64,
            `.`,
          ].join("\r\n");

          sendLine(mimeMessage);
        } else if (step === 8 && code === 250) {
          step = 9;
          sendLine("QUIT");
          finish({ ok: true });
        } else if (code >= 400) {
          finish({ ok: false, error: `Máy chủ Gmail từ chối (${code}): ${line}` });
        }
      }
    });
  });
}

export async function sendOtpVerificationEmail(params: {
  toEmail: string;
  fullName: string;
  otpCode: string;
}): Promise<{ sentRealEmail: boolean; error?: string }> {
  const state = getSmtpState();
  if (!state.enabled || !state.smtpUser || !state.smtpPass) {
    return { sentRealEmail: false };
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #bae6fd; border-radius: 16px; overflow: hidden; background: #ffffff;">
      <div style="background: linear-gradient(90deg, #0284c7, #1d4ed8); padding: 24px; color: #ffffff; text-align: center;">
        <div style="font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #e0f2fe;">
          HỆ THỐNG KHẢO THÍ & LUYỆN ĐỀ BLUEPASS IELTS
        </div>
        <h2 style="margin: 8px 0 0 0; font-size: 22px;">Mã Xác Thực Tài Khoản Học Viên (OTP)</h2>
      </div>
      <div style="padding: 28px 24px; color: #1e293b; line-height: 1.6;">
        <p style="margin-top: 0;">Xin chào <strong>${params.fullName}</strong>,</p>
        <p>Bạn vừa yêu cầu đăng ký tài khoản Học viên trên hệ thống <strong>BluePass IELTS</strong> bằng địa chỉ Gmail <strong>${params.toEmail}</strong>.</p>
        <p>Vui lòng nhập mã OTP gồm 6 chữ số dưới đây vào màn hình xác thực trên trang web (Mã có hiệu lực trong vòng <strong>10 phút</strong>):</p>
        <div style="margin: 24px 0; padding: 20px; background: #eff6ff; border: 2px dashed #0284c7; border-radius: 12px; text-align: center;">
          <span style="font-family: monospace; font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #1d4ed8;">
            ${params.otpCode}
          </span>
        </div>
        <p style="font-size: 13px; color: #64748b;">
          * Lưu ý bảo mật: Tuyệt đối không chia sẻ mã này cho người khác. Nếu không phải bạn thực hiện đăng ký, vui lòng bỏ qua email này.
        </p>
      </div>
      <div style="background: #f8fafc; padding: 14px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
        © 2026 BluePass English Testing & Placement Platform
      </div>
    </div>
  `;

  const res = await sendGmailHtmlEmail({
    to: params.toEmail,
    subject: `[BluePass IELTS] Mã xác thực OTP của bạn là: ${params.otpCode}`,
    html,
  });

  return {
    sentRealEmail: res.ok,
    error: res.error,
  };
}
