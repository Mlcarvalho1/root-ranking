// Roda em um runner self-hosted com Ollama servindo qwen2.5:14b localmente.
// Gera o diff do PR, revisa com o modelo usando o checklist do projeto e
// posta (ou atualiza) um único comentário no PR.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const {
  GITHUB_TOKEN,
  OLLAMA_HOST = "http://localhost:11434",
  OLLAMA_MODEL = "qwen2.5:14b",
  PR_NUMBER,
  BASE_SHA,
  HEAD_SHA,
  REPO,
} = process.env;

const MARKER = "<!-- ai-review-bot:root-ranking -->";
const MAX_DIFF_CHARS = 24000;
const SKILL_PATH = ".claude/skills/root-ranking-review/SKILL.md";

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!GITHUB_TOKEN || !PR_NUMBER || !BASE_SHA || !HEAD_SHA || !REPO) {
  fail("Faltam variáveis de ambiente obrigatórias (GITHUB_TOKEN, PR_NUMBER, BASE_SHA, HEAD_SHA, REPO).");
}

function readSkillChecklist() {
  const raw = readFileSync(SKILL_PATH, "utf8");
  // remove o frontmatter YAML (--- ... ---) e mantém só o corpo da skill
  return raw.replace(/^---\n[\s\S]*?\n---\n/, "").trim();
}

function getDiff() {
  const diff = execFileSync(
    "git",
    [
      "diff",
      "--unified=3",
      `${BASE_SHA}`,
      `${HEAD_SHA}`,
      "--",
      ".",
      ":(exclude)pnpm-lock.yaml",
    ],
    { maxBuffer: 1024 * 1024 * 20 }
  ).toString();

  if (diff.length > MAX_DIFF_CHARS) {
    return diff.slice(0, MAX_DIFF_CHARS) + "\n\n[...diff truncado por tamanho...]";
  }
  return diff;
}

async function callOllama(systemPrompt, diff) {
  const res = await fetch(`${OLLAMA_HOST}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Revise o diff abaixo deste pull request:\n\n\`\`\`diff\n${diff}\n\`\`\``,
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Ollama respondeu ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const content = data?.message?.content?.trim();
  if (!content) throw new Error("Resposta do Ollama sem conteúdo.");
  return content;
}

async function githubRequest(path, options = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "root-ranking-ai-review",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`GitHub API ${options.method || "GET"} ${path} -> ${res.status}: ${await res.text()}`);
  }
  return res.status === 204 ? null : res.json();
}

async function upsertComment(body) {
  const fullBody = `${MARKER}\n\n${body}`;
  const comments = await githubRequest(`/repos/${REPO}/issues/${PR_NUMBER}/comments?per_page=100`);
  const existing = comments.find((c) => c.body?.includes(MARKER));

  if (existing) {
    await githubRequest(`/repos/${REPO}/issues/comments/${existing.id}`, {
      method: "PATCH",
      body: JSON.stringify({ body: fullBody }),
    });
    console.log(`Comentário atualizado (id ${existing.id}).`);
  } else {
    await githubRequest(`/repos/${REPO}/issues/${PR_NUMBER}/comments`, {
      method: "POST",
      body: JSON.stringify({ body: fullBody }),
    });
    console.log("Comentário criado.");
  }
}

async function main() {
  const diff = getDiff();
  if (!diff.trim()) {
    console.log("Diff vazio, nada a revisar.");
    return;
  }

  const systemPrompt = readSkillChecklist();
  let review;
  try {
    review = await callOllama(systemPrompt, diff);
  } catch (err) {
    fail(`Falha ao chamar o Ollama em ${OLLAMA_HOST}: ${err.message}`);
    return;
  }

  const header = `### 🤖 Review automático (${OLLAMA_MODEL})`;
  await upsertComment(`${header}\n\n${review}`);
}

main().catch((err) => fail(err.stack || String(err)));
