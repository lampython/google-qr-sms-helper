(() => {
  // 只在 Cloud Shell 页面或二维码页面挂载面板，进入选择框/验证码输入页后完全不干预页面，防止任何误跳转
  const isCloudConsole = location.hostname === "console.cloud.google.com";
  const isQrPage = location.pathname.includes("/challenge/iap/qrcode");
  if (!isCloudConsole && !isQrPage) {
    return;
  }

  const panel = document.createElement("div");
  panel.style.cssText = "position:fixed;bottom:20px;right:20px;z-index:999999;background:#1a73e8;color:#fff;padding:12px 16px;border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,0.25);font-family:system-ui,sans-serif;font-size:13px;display:flex;flex-direction:column;gap:8px;min-width:240px;max-width:320px;";
  
  const title = document.createElement("div");
  title.style.cssText = "font-weight:600;font-size:14px;display:flex;justify-content:space-between;align-items:center;";
  title.textContent = "⚡ Trợ lý Chuyển QR Google sang SMS v1.1";
  panel.appendChild(title);

  const statusEl = document.createElement("div");
  statusEl.style.cssText = "font-size:12px;color:#e8f0fe;word-break:break-word;line-height:1.4;";
  panel.appendChild(statusEl);

  const btn = document.createElement("button");
  btn.style.cssText = "background:#fff;color:#1a73e8;border:none;padding:8px 12px;border-radius:6px;font-weight:600;cursor:pointer;font-size:13px;";
  panel.appendChild(btn);

  document.body.appendChild(panel);

  if (isCloudConsole) {
    statusEl.textContent = "Bước 1: Click biểu tượng terminal [>_] góc trên phải để mở Verify, hoặc bấm nút dưới để tự động mở";
    btn.textContent = "1. Tự động click Cloud Shell";
    btn.onclick = () => {
      // Tìm chính xác theo data-icon-name="devshellIcon"
      function getDevShellTarget() {
        // 1. Quét thông thường
        const directSvg = document.querySelector('[data-icon-name="devshellIcon"]');
        if (directSvg) {
          return directSvg.closest('button, [role="button"], a, cfc-icon-button') || directSvg.parentElement || directSvg;
        }

        // 2. Quét xuyên Shadow DOM
        const stack = [document.body];
        while (stack.length > 0) {
          const node = stack.pop();
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.getAttribute && node.getAttribute('data-icon-name') === 'devshellIcon') {
              return node.closest('button, [role="button"], a, cfc-icon-button') || node.parentElement || node;
            }
            if (node.querySelector) {
              const inside = node.querySelector('[data-icon-name="devshellIcon"]');
              if (inside) {
                return inside.closest('button, [role="button"], a, cfc-icon-button') || inside.parentElement || inside;
              }
            }
            if (node.shadowRoot) stack.push(node.shadowRoot);
          }
          const children = node.children || node.childNodes;
          if (children) {
            for (let i = children.length - 1; i >= 0; i--) {
              const c = children[i];
              if (c.nodeType === Node.ELEMENT_NODE) stack.push(c);
            }
          }
        }

        // 3. Dự phòng theo nhãn
        const allClickable = Array.from(document.querySelectorAll('button, [role="button"], a, cfc-icon-button, [tabindex="0"]'));
        for (const el of allClickable) {
          const label = ((el.getAttribute('aria-label') || '') + ' ' + (el.getAttribute('title') || '') + ' ' + (el.getAttribute('mattooltip') || '')).toLowerCase();
          if (label.includes('cloud shell') || label.includes('terminal') || label.includes('devshell')) {
            return el;
          }
        }
        return null;
      }

      const shellBtn = getDevShellTarget();
      if (shellBtn) {
        const events = ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'];
        for (const evt of events) {
          shellBtn.dispatchEvent(new MouseEvent(evt, { bubbles: true, cancelable: true, view: window, composed: true }));
        }
        if (typeof shellBtn.click === 'function') shellBtn.click();

        statusEl.textContent = "✅ Đã click biểu tượng terminal (devshellIcon), đang đợi nút Verify xuất hiện...";
        
        let checkCount = 0;
        const interval = setInterval(() => {
          checkCount++;
          const allBtns = Array.from(document.querySelectorAll("button, a, [role='button']"));
          const verifyBtn = allBtns.find(b => {
            const t = (b.textContent || '').trim().toLowerCase();
            const aria = (b.getAttribute('aria-label') || '').toLowerCase();
            return (t === 'verify' || t.includes('vérif') || t.includes('xác minh') || aria.includes('verify') || aria.includes('vérif'));
          });
          if (verifyBtn) {
            clearInterval(interval);
            verifyBtn.click();
            statusEl.textContent = "✅ Đã tự động click nút Verify!";
          } else if (checkCount >= 10) {
            clearInterval(interval);
            statusEl.textContent = "ℹ️ Đã mở terminal, nếu có nút Verify/Vérifier hãy click vào đó.";
          }
        }, 500);
      } else {
        statusEl.textContent = "⚠️ Không tìm thấy nút terminal, vui lòng tự click biểu tượng [>_] ở thanh trên";
      }
    };
  } else if (isQrPage) {
    statusEl.textContent = "Đã phát hiện trang mã QR, click nút bên dưới để hạ cấp về nhận OTP SMS";
    btn.textContent = "⚡ Hạ cấp sang nhận SMS";
    btn.onclick = runDowngrade;
  }

  async function extractQrUrlFromPage() {
    if ("BarcodeDetector" in window) {
      const detector = new BarcodeDetector({ formats: ["qr_code"] });
      const mediaEls = Array.from(document.querySelectorAll("img, canvas"));
      for (const el of mediaEls) {
        try {
          if (el.clientWidth > 80 && el.clientHeight > 80) {
            const c = document.createElement("canvas");
            c.width = el.naturalWidth || el.clientWidth || 300;
            c.height = el.naturalHeight || el.clientHeight || 300;
            const ctx = c.getContext("2d");
            ctx.fillStyle = "#fff";
            ctx.fillRect(0, 0, c.width, c.height);
            ctx.drawImage(el, 0, 0, c.width, c.height);
            const codes = await detector.detect(c);
            if (codes && codes.length > 0 && codes[0].rawValue) {
              return codes[0].rawValue;
            }
          }
        } catch (e) {}
      }
    }
    const bodyText = document.body.innerText || "";
    const shortMatch = bodyText.match(/g\.co\/verify\/[A-Za-z0-9_-]+/);
    if (shortMatch) {
      return "https://" + shortMatch[0];
    }
    const html = document.documentElement.innerHTML;
    const m = html.match(/https:\/\/accounts\.google\.com\/devicephoneverification\/begin\?[^"'\s<>]+/);
    if (m) return m[0].replace(/\\u003d/g, "=").replace(/\\u0026/g, "&");
    throw new Error("Không thể nhận diện mã QR trên trang, vui lòng đảm bảo ảnh QR đã tải xong");
  }

  async function runDowngrade() {
    try {
      btn.disabled = true;
      btn.textContent = "Đang nhận diện mã QR...";
      const qrUrl = await extractQrUrlFromPage();
      statusEl.textContent = "Đã lấy mã QR, đang gửi payload [3,null,4]...";

      const res = await chrome.runtime.sendMessage({ action: "downgradeQr", qrUrl });
      if (!res || !res.ok) {
        throw new Error(res ? res.error : "Gửi yêu cầu nền thất bại");
      }
      if (!res.ydResp.includes("[3,null,4]")) {
        statusEl.textContent = "⚠️ Máy chủ Google phản hồi: " + res.ydResp.slice(0, 80);
        btn.disabled = false;
        btn.textContent = "Thử lại hạ cấp";
        return;
      }

      statusEl.textContent = "✅ Kích hoạt [3,null,4] thành công! Đang chuyển hướng sang trang SMS...";
      const params = new URLSearchParams(location.search);
      let cont = params.get("continue") || "";
      let targetUrl = "";

      if (cont && cont.startsWith("https://accounts.google.com/uplevelingstep/")) {
        cont = cont.replace(/&idv_xdevice=[^&]*/g, "");
        cont = cont.replace(/([?&])authuser(&|$)/, "$1authuser=0$2");
        targetUrl = cont + "&idv_xdevice=1";
      } else {
        // 普通登录入口：去掉 /qrcode，保留并清洗当前参数后追加 &idv_xdevice=1
        targetUrl = location.href.replace("/challenge/iap/qrcode", "/challenge/iap");
        targetUrl = targetUrl.replace(/&idv_xdevice=[^&]*/g, "") + "&idv_xdevice=1";
      }
      location.replace(targetUrl);
    } catch (e) {
      statusEl.textContent = "❌ " + e.message;
      btn.disabled = false;
      btn.textContent = "Thử lại hạ cấp";
    }
  }
})();
