// src/ai/flows/ai-chat-assistant.ts
'use server';
/**
 * @fileOverview An AI assistant flow to answer user fitness and nutrition questions based on their profile, logs, chat history, and optional multimodal input (voice/image).
 *
 * - askAIChatAssistant - Function to interact with the AI assistant.
 * - AskAIChatInput - Input type for the function.
 * - AskAIChatOutput - Return type for the function.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';
import { getUserProfile } from '@/services/firestore/profileService';
import { getFoodLogs, getExerciseLogs } from '@/services/firestore/logService';
// import { getChatMessages, getOrCreateChatRoom } from '@/services/firestore/chatService'; // Not used in this flow directly for history

import { subDays, startOfDay, endOfDay, format, parseISO } from 'date-fns';
import type { StoredUserProfile, StoredFoodLogEntry, StoredExerciseLogEntry, ChatMessage, TranslatePreference } from '@/app/dashboard/types';
import { AI_ASSISTANT_ID } from '@/app/dashboard/types';

const ChatMessageSchema = z.object({
  senderId: z.string(),
  text: z.string().optional(), 
  timestamp: z.string(), 
  isAI: z.boolean().optional(),
});

const AskAIChatInputSchema = z.object({
  userId: z.string().min(1, "User ID is required."),
  message: z.string().max(500, "Message is too long.").optional(),
  voiceRecordingDataUri: z.string().optional().describe("A voice recording data URI (e.g., 'data:audio/webm;codecs=opus;base64,...')."),
  imageDataUri: z.string().optional().describe("An image data URI (e.g., 'data:image/png;base64,...')."),
  chatHistory: z.array(ChatMessageSchema).optional().describe("Up to 10 previous messages in the conversation (user and AI) for context."),
}).refine(data => data.message || data.voiceRecordingDataUri || data.imageDataUri, {
    message: "At least one input (message, voice, or image) is required.",
}); 

export type AskAIChatInput = z.infer<typeof AskAIChatInputSchema>;

const AskAIChatOutputSchema = z.object({
  response: z.string().describe("The AI assistant's helpful and moderately detailed response to the user's input (text, voice, or image), potentially using markdown for lists or emphasis, based on their profile, recent logs, and chat history. Aim for 2-5 sentences unless more detail is needed."),
});
export type AskAIChatOutput = z.infer<typeof AskAIChatOutputSchema>;

const FormattedFoodLogEntrySchema = z.object({
    foodItem: z.string(), calories: z.number().optional(), protein: z.number().optional(),
    carbohydrates: z.number().optional(), fat: z.number().optional(),
    formattedTimestamp: z.string().describe("Timestamp formatted as MM/dd HH:mm"),
});
const FormattedExerciseLogEntrySchema = z.object({
    exerciseName: z.string(), duration: z.number().optional(), estimatedCaloriesBurned: z.number().optional(),
    formattedTimestamp: z.string().describe("Timestamp formatted as MM/dd HH:mm"),
});

// Update PromptContextSchema to include translatePreference from StoredUserProfile
const PromptContextSchema = z.object({
    userMessage: z.string().optional().describe("The user's current text message/question (if provided)."),
    voiceInputUri: z.string().optional().describe("Data URI of the user's voice input (if provided)."),
    imageInputUri: z.string().optional().describe("Data URI of the user's image input (if provided)."),
    profile: z.custom<StoredUserProfile | null>().describe("User's full profile data (may be null)."), // StoredUserProfile includes translatePreference
    recentFoodLogs: z.array(FormattedFoodLogEntrySchema).describe("User's food logs from the last 3 days."),
    recentExerciseLogs: z.array(FormattedExerciseLogEntrySchema).describe("User's exercise logs from the last 3 days."),
    chatHistory: z.array(ChatMessageSchema).optional().describe("The last few messages in this conversation for context."),
});

export async function askAIChatAssistant(input: AskAIChatInput): Promise<AskAIChatOutput> {
    const { userId, message, chatHistory, voiceRecordingDataUri, imageDataUri } = input;

    console.log(`[AI Chat Assistant] Processing request for user: ${userId}`);
    if (message) console.log(`[AI Chat Assistant] Current message: "${message}"`);
    if (voiceRecordingDataUri) console.log(`[AI Chat Assistant] Voice input provided.`);
    if (imageDataUri) console.log(`[AI Chat Assistant] Image input provided.`);
    console.log(`[AI Chat Assistant] Chat history length: ${chatHistory?.length ?? 0}`);

    const today = new Date();
    const startDate = startOfDay(subDays(today, 2));
    const endDate = endOfDay(today);

    const [profileResult, foodLogsResult, exerciseLogsResult] = await Promise.allSettled([
        getUserProfile(userId),
        getFoodLogs(userId, startDate, endDate),
        getExerciseLogs(userId, startDate, endDate)
    ]);

    const profile = profileResult.status === 'fulfilled' ? profileResult.value : null;
    const rawFoodLogs = foodLogsResult.status === 'fulfilled' ? foodLogsResult.value : [];
    const rawExerciseLogs = exerciseLogsResult.status === 'fulfilled' ? exerciseLogsResult.value : [];

    if (!profile) {
         console.error("[AI Chat Assistant] User profile not found or failed to load. Cannot proceed.");
         return { response: "Sorry, I couldn't access your profile information. Please ensure your profile is set up correctly." };
    }

    const formatTimestamp = (timestamp: string | undefined): string => {
        if (!timestamp) return "Unknown time";
        try { return format(parseISO(timestamp), 'MM/dd HH:mm'); } catch { return "Invalid time"; }
    };

    const recentFoodLogs = rawFoodLogs.map(log => ({
        foodItem: log.foodItem, calories: log.calories, protein: log.protein,
        carbohydrates: log.carbohydrates, fat: log.fat,
        formattedTimestamp: formatTimestamp(log.timestamp),
    }));

    const recentExerciseLogs = rawExerciseLogs.map(log => ({
        exerciseName: log.exerciseName, 
        duration: log.duration !== null ? log.duration : undefined,
        estimatedCaloriesBurned: log.estimatedCaloriesBurned,
        formattedTimestamp: formatTimestamp(log.timestamp),
    }));

     console.log("[AI Chat Assistant] Fetched Context:", {
         profileLoaded: !!profile, foodLogCount: recentFoodLogs.length, exerciseLogCount: recentExerciseLogs.length,
         localFoodStyle: profile?.localFoodStyle, historyProvided: !!chatHistory,
         translatePreference: profile?.translatePreference // Log the translate preference
     });

    const promptContext: z.infer<typeof PromptContextSchema> = {
        userMessage: message,
        voiceInputUri: voiceRecordingDataUri, 
        imageInputUri: imageDataUri,       
        profile, // This now includes translatePreference
        recentFoodLogs,
        recentExerciseLogs,
        chatHistory: chatHistory,
    };

    return aiChatAssistantFlow(promptContext);
}

const aiChatPrompt = ai.definePrompt({
    name: 'aiChatAssistantPrompt',
    model: 'googleai/gemini-2.5-flash-preview-04-17', 
    input: { schema: PromptContextSchema },
    output: { schema: AskAIChatOutputSchema },
    prompt: `You are Bago, a friendly, knowledgeable, and supportive AI fitness and nutrition assistant. Your primary goal is to provide helpful, personalized, moderately detailed, and safe advice to the user based on their FULL profile, recent activity logs, the ongoing conversation history, and any provided multimodal input (voice recording or image).

**User's Preferred Language for AI Responses:** {{#if profile.translatePreference}}{{profile.translatePreference}} (Use this for your response. 'en' for English, 'ta-Latn' for Tamil in English script, 'ta' for Tamil script). If not specified or 'en', respond in English.{{else}}English{{/if}}
If the user explicitly asks you to respond in a different language (e.g., "Can you reply in Tamil script?"), prioritize that request for the current response.

**User Profile (Utilize ALL relevant details):**
{{#if profile}}
- Goal: {{profile.fitnessGoal}}
- Activity Level: {{profile.activityLevel}}
- Weight: {{profile.weight}} kg | Height: {{profile.height}} cm | Age: {{profile.age}} | Gender: {{profile.gender}}
- Dietary Style(s): {{#if profile.dietaryStyles}}{{profile.dietaryStyles}}{{else}}Not specified{{/if}}
- Allergies: {{#if profile.allergies}}{{profile.allergies}}{{else}}None specified{{/if}}{{#if profile.otherAllergies}} (Other: {{profile.otherAllergies}}){{/if}}
- Local Cuisine Preference: {{#if profile.localFoodStyle}}{{profile.localFoodStyle}}{{else}}Not specified{{/if}} (Strongly consider this for food suggestions)
- Food Dislikes: {{#if profile.foodDislikes}}{{profile.foodDislikes}}{{else}}None specified{{/if}}
- General Prefs: {{#if profile.foodPreferences}}{{profile.foodPreferences}}{{else}}None{{/if}}
- AI Targets Active: {{profile.useAiTargets}}
{{#if profile.useAiTargets}} - Target Calories: {{profile.targetCalories}} kcal | Target Protein: {{profile.targetProtein}} g | Target Carbs: {{profile.targetCarbs}} g | Target Fat: {{profile.targetFat}} g
{{else}} - Manual Target Calories: {{profile.manualTargetCalories}} kcal | Manual Target Protein: {{profile.manualTargetProtein}} g | Manual Target Carbs: {{profile.manualTargetCarbs}} g | Manual Target Fat: {{profile.manualTargetFat}} g
{{/if}}
{{else}}
- Profile not fully loaded or available. Cannot personalize response effectively.
{{/if}}

**Recent Food Logs (Last 3 Days):**
{{#if recentFoodLogs.length}} {{#each recentFoodLogs}} - {{this.foodItem}} ({{this.calories}} kcal, P:{{this.protein}}g, C:{{this.carbohydrates}}g, F:{{this.fat}}g) on {{this.formattedTimestamp}} {{/each}} {{else}} - No recent food logs found. {{/if}}

**Recent Exercise Logs (Last 3 Days):**
{{#if recentExerciseLogs.length}} {{#each recentExerciseLogs}} - {{this.exerciseName}} ({{#if this.duration}}{{this.duration}} min{{else}}Sets/Reps{{/if}}{{#if this.estimatedCaloriesBurned}}, ~{{this.estimatedCaloriesBurned}} kcal{{/if}}) on {{this.formattedTimestamp}} {{/each}} {{else}} - No recent exercise logs found. {{/if}}

**Recent Conversation History (Oldest to Newest):**
{{#if chatHistory}} {{#each chatHistory}} - {{#if this.isAI}}Bago:{{else}}User:{{/if}} {{this.text}} {{/each}} {{else}} - No previous messages in this session. {{/if}}

**User's Current Input:**
{{#if userMessage}} - Text: "{{userMessage}}"{{/if}}
{{#if voiceInputUri}} - Voice Recording: {{media url=voiceInputUri}}{{/if}}
{{#if imageInputUri}} - Image: {{media url=imageInputUri}}{{/if}}

**Your Task:**
Analyze the user's current input (text, voice, and/or image) considering their FULL profile, recent logs, and chat history. Provide a helpful, supportive, and clear response in the user's preferred language (see "User's Preferred Language" above).
- **Address Multimodal Input:** If voice or image is provided, analyze its content and incorporate it into your response (e.g., identify food in image, transcribe and understand voice message).
- **Use Markdown:** Enhance clarity with lists (* or -), bold (**text**), italics (*text*).
- **Personalize:** REFER EXPLICITLY to goals, preferences (especially local cuisine), allergies, etc., when relevant.
- **Context is Key:** Use chat history to maintain conversation flow.
- **Safety First:** NEVER give medical advice. Advise consulting doctors/physios.
- **Encouragement:** Maintain a positive tone.
- **Handling Missing Data:** Acknowledge limitations if profile/log data is missing.
- **Response Length:** Aim for 2-5 concise sentences, but elaborate if necessary. Avoid rambling.

**Output:** Generate ONLY the JSON object containing the 'response' field with your helpful, personalized, and Markdown-formatted answer in the requested language.
`,
});

const aiChatAssistantFlow = ai.defineFlow<
    typeof PromptContextSchema,
    typeof AskAIChatOutputSchema
>(
    {
        name: 'aiChatAssistantFlow',
        inputSchema: PromptContextSchema,
        outputSchema: AskAIChatOutputSchema,
    },
    async (context) => {
        console.log("[AI Chat Assistant Flow] Received context - User Message:", context.userMessage);
        console.log("[AI Chat Assistant Flow] Voice Input Provided:", !!context.voiceInputUri);
        console.log("[AI Chat Assistant Flow] Image Input Provided:", !!context.imageInputUri);
        console.log("[AI Chat Assistant Flow] Profile Goal:", context.profile?.fitnessGoal);
        console.log("[AI Chat Assistant Flow] Profile Translate Pref:", context.profile?.translatePreference); // Log translate preference
        console.log("[AI Chat Assistant Flow] History Length:", context.chatHistory?.length ?? 0);

        if (!context.profile) {
            console.error("[AI Chat Assistant Flow] Profile is null in the received context. Aborting AI call.");
            return { response: "I seem to be missing your profile details right now. Please try again after ensuring your profile is loaded." };
        }

        const { output } = await aiChatPrompt(context);

        if (!output || !output.response) {
            console.error("[AI Chat Assistant Flow] AI failed to generate a response.");
             return { response: "Sorry, I couldn't process that request right now. Please try asking in a different way." };
        }

        console.log("[AI Chat Assistant Flow] Generated raw response:", output.response);
        return output;
    }
);
    
