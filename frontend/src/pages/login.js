import { login } from "../api/auth.js";

export const renderLogin = () => `
  <div class="auth-wrap">
    <div class="auth-hero">
      <div class="brand d-flex align-items-center gap-2 mb-4">
        <span class="brand-mark">
          <i class="bi bi-grid-1x2-fill"></i>
        </span>
        <span class="brand-name">CRM PDV</span>
      </div>
      <h1>Controle total do negocio em um so lugar.</h1>
      <p>
        Acompanhe vendas, estoque, caixa e clientes em tempo real com um painel
        administrativo simples e direto.
      </p>
      <div class="grid two mt-4">
        <div class="card">
          <div class="metric">
            <div class="metric-icon"><i class="bi bi-graph-up-arrow"></i></div>
            <div>
              <p class="metric-label">Performance</p>
              <p class="metric-value">+18%</p>
              <p class="metric-note">Ultimos 30 dias</p>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="metric">
            <div class="metric-icon"><i class="bi bi-shield-check"></i></div>
            <div>
              <p class="metric-label">Operacao segura</p>
              <p class="metric-value">100%</p>
              <p class="metric-note">Confianca e auditabilidade</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card auth-card">
      <h2>Entrar no painel</h2>
      <p class="page-subtitle">Use seu email e senha cadastrados.</p>
      <form id="login-form" class="mt-4">
        <div class="mb-3">
          <label class="form-label" for="login-email">Email</label>
          <input
            id="login-email"
            name="email"
            type="email"
            class="form-control"
            placeholder="seu@email.com"
            required
          />
        </div>
        <div class="mb-3">
          <label class="form-label" for="login-senha">Senha</label>
          <div class="input-group">
            <input
              id="login-senha"
              name="senha"
              type="password"
              class="form-control"
              placeholder="********"
              required
            />
            <button
              class="btn btn-outline-secondary"
              type="button"
              id="toggle-password"
              aria-label="Mostrar senha"
            >
              <i class="bi bi-eye"></i>
            </button>
          </div>
        </div>
        <div class="d-flex align-items-center justify-content-between mb-3">
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="remember" />
            <label class="form-check-label" for="remember">Manter conectado</label>
          </div>
          <button type="button" class="btn btn-link p-0" id="forgot-password">
            Esqueci minha senha
          </button>
        </div>
        <div id="forgot-feedback" class="alert alert-info d-none mb-3" role="alert">
          Funcionalidade em desenvolvimento. Fale com o administrador para redefinir sua senha.
        </div>
        <button class="btn btn-primary w-100" type="submit">
          <i class="bi bi-box-arrow-in-right"></i>
          Entrar
        </button>
        <p id="login-feedback" class="auth-footnote mt-3 mb-0"></p>
      </form>
      <div class="auth-meta mt-4">
        <i class="bi bi-info-circle"></i>
        Ambiente administrativo do CRM PDV.
      </div>
    </div>
  </div>
`;

export const initLogin = ({ navigate, setUser } = {}) => {
  const form = document.getElementById("login-form");
  const feedback = document.getElementById("login-feedback");
  const togglePasswordButton = document.getElementById("toggle-password");
  const passwordInput = document.getElementById("login-senha");
  const forgotButton = document.getElementById("forgot-password");
  const forgotFeedback = document.getElementById("forgot-feedback");

  if (!form) return;

  if (togglePasswordButton && passwordInput) {
    togglePasswordButton.addEventListener("click", () => {
      const isPassword = passwordInput.type === "password";
      passwordInput.type = isPassword ? "text" : "password";
      togglePasswordButton.innerHTML = isPassword
        ? '<i class="bi bi-eye-slash"></i>'
        : '<i class="bi bi-eye"></i>';
      togglePasswordButton.setAttribute(
        "aria-label",
        isPassword ? "Ocultar senha" : "Mostrar senha"
      );
    });
  }

  if (forgotButton && forgotFeedback) {
    forgotButton.addEventListener("click", () => {
      forgotFeedback.classList.toggle("d-none");
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (forgotFeedback) {
      forgotFeedback.classList.add("d-none");
    }
    const email = form.email.value.trim();
    const senha = form.senha.value;

    if (!email || !senha) {
      if (feedback) {
        feedback.textContent = "Informe email e senha para continuar.";
      }
      return;
    }

    if (feedback) {
      feedback.textContent = "Autenticando...";
    }

    try {
      const response = await login({ email, senha });

      const token = response?.data?.token ?? response?.token ?? null;
      const user = response?.data?.user ?? response?.user ?? null;

      if (token) {
        localStorage.setItem("auth_token", token);
      }
      if (user) {
        localStorage.setItem("auth_user", JSON.stringify(user));
      }
      if (typeof setUser === "function") {
        setUser(user);
      }
      if (typeof navigate === "function") {
        navigate("dashboard");
      }
    } catch (error) {
      console.warn("Falha no login.", error);
      if (feedback) {
        feedback.textContent =
          "Nao foi possivel autenticar agora. Verifique os dados ou tente mais tarde.";
      }
    }
  });
};
