const $ = (sel) => document.querySelector(sel);

const USERS_KEY = "mithaq_users";
const SESSION_KEY = "mithaq_session";

let mode = "signin"; // "signin" أو "signup"

// --- مساعدات التخزين ---
function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || {};
  } catch (e) {
    return {};
  }
}
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}
function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch (e) {
    return null;
  }
}
function setSession(email) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email: email, at: Date.now() }));
}
function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// --- التشفير ---
function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
function randomSalt() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return toHex(arr.buffer);
}
async function hashPassword(password, salt) {
  const data = new TextEncoder().encode(salt + ":" + password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(digest);
}

// --- مساعدات الواجهة ---
function showMessage(text, type) {
  const el = $("#message");
  el.textContent = text;
  el.className = "message " + (type || "error");
}
function clearMessage() {
  const el = $("#message");
  el.textContent = "";
  el.className = "message";
}
function formatDate(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("ar", { dateStyle: "medium", timeStyle: "short" });
}

// --- تبديل الوضع ---
function setMode(newMode) {
  mode = newMode;
  const isSignup = mode === "signup";
  $("#nameField").hidden = !isSignup;
  $("#authTitle").textContent = isSignup ? "أنشئ حسابك" : "مرحبًا بعودتك";
  $("#authSubtitle").textContent = isSignup
    ? "ابدأ في ثوانٍ معدودة"
    : "سجّل الدخول للمتابعة إلى حسابك";
  $("#submitBtn").textContent = isSignup ? "إنشاء حساب" : "تسجيل الدخول";
  $("#password").setAttribute("autocomplete", isSignup ? "new-password" : "current-password");
  document.querySelectorAll(".tab").forEach((t) => {
    t.classList.toggle("active", t.dataset.mode === mode);
  });
  clearMessage();
}

// --- التحقق ---
function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// --- العمليات ---
async function handleSubmit(e) {
  e.preventDefault();
  clearMessage();
  const name = $("#name").value.trim();
  const email = $("#email").value.trim().toLowerCase();
  const password = $("#password").value;

  if (!validEmail(email)) return showMessage("البريد الإلكتروني غير صالح.");
  if (password.length < 6) return showMessage("كلمة المرور يجب أن تكون 6 أحرف على الأقل.");

  const submitBtn = $("#submitBtn");
  submitBtn.disabled = true;
  try {
    const users = getUsers();
    if (mode === "signup") {
      if (!name) return showMessage("الرجاء إدخال الاسم.");
      if (users[email]) return showMessage("هذا البريد مسجّل بالفعل. جرّب تسجيل الدخول.");
      const salt = randomSalt();
      const hash = await hashPassword(password, salt);
      users[email] = {
        name: name,
        email: email,
        salt: salt,
        hash: hash,
        createdAt: Date.now(),
        lastLogin: Date.now(),
      };
      saveUsers(users);
      setSession(email);
      render();
    } else {
      const user = users[email];
      if (!user) return showMessage("لا يوجد حساب بهذا البريد.");
      const hash = await hashPassword(password, user.salt);
      if (hash !== user.hash) return showMessage("كلمة المرور غير صحيحة.");
      user.lastLogin = Date.now();
      saveUsers(users);
      setSession(email);
      render();
    }
  } finally {
    submitBtn.disabled = false;
  }
}

function handleLogout() {
  clearSession();
  $("#authForm").reset();
  setMode("signin");
  render();
}

// --- العرض ---
function render() {
  const session = getSession();
  const users = getUsers();
  const user = session ? users[session.email] : null;

  if (user) {
    $("#authView").hidden = true;
    $("#dashView").hidden = false;
    $("#avatar").textContent = (user.name || user.email).charAt(0).toUpperCase();
    $("#welcome").textContent = "أهلاً، " + (user.name || "مستخدم");
    $("#dashEmail").textContent = user.email;
    $("#createdAt").textContent = formatDate(user.createdAt);
    $("#lastLogin").textContent = formatDate(user.lastLogin);
    $("#navStatus").innerHTML = '<span class="badge">متصل</span>';
  } else {
    $("#authView").hidden = false;
    $("#dashView").hidden = true;
    $("#navStatus").innerHTML = "";
  }
}

// --- التهيئة ---
document.querySelectorAll(".tab").forEach((t) => {
  t.addEventListener("click", () => setMode(t.dataset.mode));
});
$("#authForm").addEventListener("submit", handleSubmit);
$("#logoutBtn").addEventListener("click", handleLogout);
render();
