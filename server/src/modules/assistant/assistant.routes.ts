import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { ChatResponse } from "@agrointel/shared";
import { env } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";
import { HttpError, notFound } from "../../lib/http-error.js";
import { currentUser, requireAuth } from "../../middleware/auth.js";
import { buildFarmerContext } from "./context.js";

const router = Router();
router.use(requireAuth);

const client = env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }) : null;

const SYSTEM_PROMPT = `You are AgroIntel, an agricultural advisor for smallholder and commercial farmers in Africa.

Give practical, specific advice the farmer can act on this week. Use simple words and short paragraphs; avoid jargon, or explain it when needed. When a farmer writes in Yoruba, Hausa, Igbo or Nigerian Pidgin, reply in that language.

Use the farmer context below (location, weather, farms, crops, recent scans) to tailor answers. When weather matters, turn it into a decision — for example, advise delaying fertilizer before heavy rain.

Be honest about uncertainty. You cannot see the farmer's plants: for diagnosis questions, suggest using the Scan Plant feature or contacting an extension officer. When recommending chemicals, name the active ingredient, tell them to follow the label rate, and mention protective equipment. Never recommend banned or highly hazardous pesticides.`;

const chatSchema = z.object({
  message: z.string().trim().min(1).max(4000),
  conversationId: z.string().optional(),
});

router.post("/chat", async (req, res) => {
  if (!client) throw new HttpError(503, "The assistant is not configured yet.");
  const userId = currentUser(req).id;
  const { message, conversationId } = chatSchema.parse(req.body);

  const conversation = conversationId
    ? await prisma.conversation.findFirst({ where: { id: conversationId, userId }, include: { messages: { orderBy: { createdAt: "asc" } } } })
    : await prisma.conversation.create({ data: { userId }, include: { messages: true } });
  if (!conversation) throw notFound("Conversation");

  const history: Anthropic.MessageParam[] = conversation.messages.slice(-20).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const response = await client.beta.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 16000,
    output_config: { effort: "low" },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: [
      { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
      { type: "text", text: `Farmer context:\n${await buildFarmerContext(userId)}` },
    ],
    messages: [...history, { role: "user", content: message }],
  });

  if (response.stop_reason === "refusal") {
    throw new HttpError(422, "I can't help with that request. Try asking about your crops, soil, weather or farm.");
  }
  const reply = response.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("")
    .trim();

  await prisma.message.createMany({
    data: [
      { conversationId: conversation.id, role: "user", content: message },
      { conversationId: conversation.id, role: "assistant", content: reply },
    ],
  });

  const body: ChatResponse = { conversationId: conversation.id, reply };
  res.json(body);
});

export default router;
