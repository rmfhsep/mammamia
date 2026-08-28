import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export type Summary = { title: string; summary: string };

const PROVIDE_SUMMARY_TOOL: Anthropic.Tool = {
  name: "provide_summary",
  description: "새로 작성한 한국어 제목과 브리핑 요약을 제출한다.",
  input_schema: {
    type: "object",
    properties: {
      title: { type: "string", description: "원문 제목의 번역이 아니라 새로 지은 한국어 제목" },
      summary: { type: "string", description: "6~10문장 분량의 한국어 브리핑" },
    },
    required: ["title", "summary"],
  },
};

/**
 * 해외 소스 전용. 원문을 번역하지 않는다 — RSS가 제공하는 짧은 공식 요약(원문 본문 전체가 아님)에서
 * 사실관계만 추출해, 문장·구조를 완전히 새로 쓴 한국어 제목/요약을 만든다.
 *
 * 프롬프트로 JSON 형식을 지키게 하는 대신 tool_choice로 강제한다 — 모델이 자유 텍스트에 JSON을 섞어
 * 쓰면 title/summary 중 하나가 누락되는 경우가 잦았다(prisma "Argument is missing" 에러로 드러남).
 */
export async function summarizeInKorean(input: {
  sourceName: string;
  originalTitle: string;
  rawContent: string;
}): Promise<Summary> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1500,
    system:
      "너는 IT/데이터 전문 매체의 한국어 에디터다. 아래에 주어진 해외 소식에서 사실관계(누가, 무엇을, " +
      "왜 중요한지)만 참고해서, 독자가 흥미를 느낄 만한 분량의 한국어 브리핑 기사를 새로 쓴다. " +
      "번역이 절대 아니다 — 원문 문장 구조나 표현을 따라가지 말고, 네가 이해한 사실을 바탕으로 " +
      "리드 문장(무슨 일이 있었는지) + 배경/맥락 + 왜 중요한지를 담아 처음부터 새로 구성해서 써라. " +
      "분량은 6~10문장 정도로, 국내 IT/데이터 종사자가 흥미를 느낄 수 있게 구체적으로 쓴다.",
    tools: [PROVIDE_SUMMARY_TOOL],
    tool_choice: { type: "tool", name: "provide_summary" },
    messages: [
      {
        role: "user",
        content: `매체: ${input.sourceName}\n원문 제목(참고용, 그대로 쓰지 말 것): ${input.originalTitle}\n원문 요약(참고용 사실관계만 추출):\n${input.rawContent}`,
      },
    ],
  });

  if (message.stop_reason === "max_tokens") {
    throw new Error("summarize response truncated at max_tokens");
  }

  const toolUse = message.content.find((block) => block.type === "tool_use");
  if (!toolUse) {
    throw new Error("no tool_use block in summarize response");
  }

  const parsed = toolUse.input as Partial<Summary>;
  if (!parsed.title || !parsed.summary) {
    throw new Error(`summarize response missing fields: ${JSON.stringify(parsed)}`);
  }

  return { title: parsed.title, summary: parsed.summary };
}
