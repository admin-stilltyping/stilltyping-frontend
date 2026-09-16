import axios from "axios";
import apiClient from "@/api/client";

export interface KnowledgeDocument {
  content: string;
  revision: string;
  reconstructed: boolean;
}

export const knowledgeDocumentApi = {
  get: () =>
    apiClient
      .get<KnowledgeDocument>("/admin/knowledge-base")
      .then((r) => r.data),
  save: (content: string, expectedRevision: string) =>
    apiClient
      .put<KnowledgeDocument>("/admin/knowledge-base", {
        content,
        expected_revision: expectedRevision,
      })
      .then((r) => r.data),
};

export function knowledgeError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.error?.message;
    if (typeof message === "string") return message;
  }
  return fallback;
}
