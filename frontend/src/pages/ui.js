export const renderTable = (headers, rows, emptyMessage = "Sem dados") => `
  <div class="table-responsive">
    <table class="table table-sm table-dashboard align-middle">
      <thead>
        <tr>
          ${headers.map((header) => `<th>${header}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${
          rows.length
            ? rows
                .map(
                  (row) => `<tr>${row.map((col) => `<td>${col}</td>`).join("")}</tr>`
                )
                .join("")
            : `<tr><td colspan="${headers.length}" class="text-muted">${emptyMessage}</td></tr>`
        }
      </tbody>
    </table>
  </div>
`;

export const renderStatus = (label, variant = "neutral") =>
  `<span class="status-pill ${variant}">${label}</span>`;

export const renderBadge = (label) => `<span class="badge text-bg-light">${label}</span>`;

export const renderAlert = (type, message) => `
  <div class="alert alert-${type} d-flex align-items-center gap-2" role="alert">
    <i class="bi ${type === "success" ? "bi-check-circle" : "bi-exclamation-circle"}"></i>
    <span>${message}</span>
  </div>
`;

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem("auth_user");
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
};

export const isAdminUser = (user) => user?.tipo_usuario === "admin";

export const hasCategoria = (user, categoria) =>
  isAdminUser(user) || Number(user?.categoria_funcionario) === Number(categoria);
