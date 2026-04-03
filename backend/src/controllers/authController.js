import { getConnection } from "../../connections.js";
import { signToken } from "../middleware/auth.js";

const db = getConnection();

export const login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({
        status: "error",
        message: "Email e senha sao obrigatorios",
      });
    }

    const [rows] = await db.query(
      "SELECT id, nome, email, senha, tipo_usuario, categoria_funcionario, ativo FROM usuarios WHERE email = ? LIMIT 1",
      [email]
    );

    if (rows.length === 0 || rows[0].senha !== senha) {
      return res.status(401).json({
        status: "error",
        message: "Credenciais invalidas",
      });
    }

    if (!rows[0].ativo) {
      return res.status(403).json({
        status: "error",
        message: "Usuario inativo",
      });
    }

    const user = rows[0];
    const token = signToken(user);

    return res.json({
      status: "success",
      data: {
        token,
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          tipo_usuario: user.tipo_usuario,
          categoria_funcionario: user.categoria_funcionario,
        },
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      message: "Erro ao realizar login",
    });
  }
};
