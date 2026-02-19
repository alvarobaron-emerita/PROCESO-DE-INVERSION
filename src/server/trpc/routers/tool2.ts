/**
 * tRPC Router para Tool 2 (Data Viewer)
 * Actúa como proxy hacia el backend FastAPI
 */
import { z } from "zod";
import { createTRPCRouter, baseProcedure } from "~/server/trpc/main";
import { fastApiClient } from "./fastapi-client";

export const tool2Router = createTRPCRouter({
  // ============================================================================
  // PROYECTOS
  // ============================================================================

  listProjects: baseProcedure.query(async () => {
    return fastApiClient.get("/api/tool2/projects");
  }),

  createProject: baseProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input }) => {
      return fastApiClient.post("/api/tool2/projects", input);
    }),

  deleteProject: baseProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ input }) => {
      return fastApiClient.delete(`/api/tool2/projects/${input.projectId}`);
    }),

  // Nota: el upload de archivos se hace directamente al backend FastAPI desde el
  // cliente (fetch + FormData) porque tRPC usa JSON y File no es serializable.

  // ============================================================================
  // VISTAS
  // ============================================================================

  listViews: baseProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      return fastApiClient.get(`/api/tool2/projects/${input.projectId}/views`);
    }),

  createView: baseProcedure
    .input(
      z.object({
        projectId: z.string(),
        name: z.string(),
        icon: z.string(),
        visibleColumns: z.array(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      const { projectId, ...viewData } = input;
      return fastApiClient.post(
        `/api/tool2/projects/${projectId}/views`,
        viewData
      );
    }),

  deleteView: baseProcedure
    .input(
      z.object({
        projectId: z.string(),
        viewId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return fastApiClient.delete(
        `/api/tool2/projects/${input.projectId}/views/${input.viewId}`
      );
    }),

  // ============================================================================
  // DATOS
  // ============================================================================

  getViewData: baseProcedure
    .input(
      z.object({
        projectId: z.string(),
        viewId: z.string(),
      })
    )
    .query(async ({ input }) => {
      return fastApiClient.get(
        `/api/tool2/projects/${input.projectId}/views/${input.viewId}/data`
      );
    }),

  moveRows: baseProcedure
    .input(
      z.object({
        projectId: z.string(),
        viewId: z.string(),
        rowUids: z.array(z.string()),
        targetViewId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { projectId, viewId, ...moveData } = input;
      return fastApiClient.post(
        `/api/tool2/projects/${projectId}/views/${viewId}/rows/move`,
        moveData
      );
    }),

  copyRows: baseProcedure
    .input(
      z.object({
        projectId: z.string(),
        viewId: z.string(),
        rowUids: z.array(z.string()),
        targetViewId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { projectId, viewId, ...moveData } = input;
      return fastApiClient.post(
        `/api/tool2/projects/${projectId}/views/${viewId}/rows/copy`,
        moveData
      );
    }),

  deleteRows: baseProcedure
    .input(
      z.object({
        projectId: z.string(),
        rowUids: z.array(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      return fastApiClient.delete(
        `/api/tool2/projects/${input.projectId}/rows?row_uids=${input.rowUids.join(",")}`
      );
    }),

  updateRow: baseProcedure
    .input(
      z.object({
        projectId: z.string(),
        rowUid: z.string(),
        updates: z.record(z.unknown()),
      })
    )
    .mutation(async ({ input }) => {
      const { projectId, rowUid, updates } = input;
      return fastApiClient.put(
        `/api/tool2/projects/${projectId}/rows/${rowUid}`,
        updates
      );
    }),

  // ============================================================================
  // COLUMNAS
  // ============================================================================

  listColumns: baseProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      return fastApiClient.get(
        `/api/tool2/projects/${input.projectId}/columns`
      );
    }),

  createColumn: baseProcedure
    .input(
      z.object({
        projectId: z.string(),
        name: z.string(),
        definition: z.object({
          type: z.string(),
          label: z.string().optional(),
          options: z.array(z.string()).optional(),
          prompt: z.string().optional(),
          modelSelected: z.string().optional(),
          smartContext: z.boolean().optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const { projectId, ...columnData } = input;
      return fastApiClient.post(
        `/api/tool2/projects/${projectId}/columns`,
        columnData
      );
    }),

  enrichColumn: baseProcedure
    .input(
      z.object({
        projectId: z.string(),
        columnName: z.string(),
        rowUids: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { projectId, ...body } = input;
      return fastApiClient.post(
        `/api/tool2/projects/${projectId}/enrich`,
        body
      );
    }),
});
