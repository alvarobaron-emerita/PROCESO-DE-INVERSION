/**
 * tRPC Router para Tool 1 (Discovery Engine)
 * Actúa como proxy hacia el backend FastAPI
 */
import { z } from "zod";
import { createTRPCRouter, baseProcedure } from "~/server/trpc/main";
import { fastApiClient } from "./fastapi-client";

export const tool1Router = createTRPCRouter({
  // ============================================================================
  // CLASIFICACIÓN CNAE
  // ============================================================================

  classifySector: baseProcedure
    .input(
      z.object({
        sectorName: z.string(),
        additionalContext: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return fastApiClient.post("/api/tool1/classify", {
        sector_name: input.sectorName,
        additional_context: input.additionalContext,
      });
    }),

  // ============================================================================
  // INVESTIGACIÓN
  // ============================================================================

  researchSector: baseProcedure
    .input(
      z.object({
        sectorName: z.string(),
        cnaeCodes: z.array(z.string()).optional(),
        maxResultsPerQuery: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return fastApiClient.post("/api/tool1/research", {
        sector_name: input.sectorName,
        cnae_codes: input.cnaeCodes,
        max_results_per_query: input.maxResultsPerQuery,
      });
    }),

  // ============================================================================
  // GENERACIÓN DE REPORTES
  // ============================================================================

  generateReport: baseProcedure
    .input(
      z.object({
        sectorName: z.string(),
        cnaeCodes: z.array(z.string()),
        researchData: z.string(),
        emeritaThesis: z.record(z.unknown()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      return fastApiClient.post("/api/tool1/generate-report", {
        sector_name: input.sectorName,
        cnae_codes: input.cnaeCodes,
        research_data: input.researchData,
        emerita_thesis: input.emeritaThesis,
      });
    }),

  // ============================================================================
  // EVALUACIÓN
  // ============================================================================

  evaluateSector: baseProcedure
    .input(
      z.object({
        marginsData: z.record(z.unknown()).optional(),
        marketData: z.record(z.unknown()).optional(),
        reportContent: z.string().optional(),
        emeritaThesis: z.record(z.unknown()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      return fastApiClient.post("/api/tool1/evaluate", input);
    }),

  // ============================================================================
  // CHAT INTERACTIVO
  // ============================================================================

  chat: baseProcedure
    .input(
      z.object({
        message: z.string(),
        sectionKey: z.string().optional(),
        report: z.record(z.unknown()),
      })
    )
    .mutation(async ({ input }) => {
      return fastApiClient.post("/api/tool1/chat", {
        message: input.message,
        section_key: input.sectionKey,
        report: input.report,
      });
    }),

  // ============================================================================
  // ACTUALIZACIÓN DE SECCIONES
  // ============================================================================

  updateSection: baseProcedure
    .input(
      z.object({
        sectionKey: z.string(),
        userInstruction: z.string(),
        report: z.record(z.unknown()),
      })
    )
    .mutation(async ({ input }) => {
      return fastApiClient.post("/api/tool1/update-section", {
        section_key: input.sectionKey,
        user_instruction: input.userInstruction,
        report: input.report,
      });
    }),
});
