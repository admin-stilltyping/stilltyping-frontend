import { useEffect, useState } from "react";
import { BookOpen, Save } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Spinner } from "@nivaso/ui";
import { useBusinessSession } from "@/components/auth/BusinessSession";
import { knowledgeDocumentApi, knowledgeError } from "./api";

const MAX_LENGTH = 60_000;

export function KnowledgeBasePage() {
  const { business } = useBusinessSession();
  const queryClient = useQueryClient();
  const queryKey = ["knowledge-document", business._id];
  const document = useQuery({ queryKey, queryFn: knowledgeDocumentApi.get });
  const [draft, setDraft] = useState<{
    content: string;
    revision: string;
  } | null>(null);
  const [saved, setSaved] = useState(false);
  const text = draft?.content ?? document.data?.content ?? "";
  const dirty = draft !== null && text !== document.data?.content;
  const save = useMutation({
    mutationFn: ({
      content,
      revision,
    }: {
      content: string;
      revision: string;
    }) => knowledgeDocumentApi.save(content, revision),
    onMutate: () => queryClient.cancelQueries({ queryKey }),
    onSuccess: (response) => {
      queryClient.setQueryData(queryKey, response);
      setDraft(null);
      setSaved(true);
    },
  });

  useEffect(() => {
    if (!dirty) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [dirty]);

  const loadSaved = async () => {
    const result = await document.refetch();
    if (result.isSuccess) {
      setDraft(null);
      setSaved(false);
      save.reset();
    }
  };

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-blue-50 p-2">
          <BookOpen className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Knowledge Base
          </h2>
          <p id="knowledge-description" className="text-sm text-gray-500">
            Add the business facts your assistant should know, such as services,
            opening hours, policies and frequently asked questions. Keep these
            details up to date so it can answer customers accurately.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        {document.isPending ? (
          <div role="status" aria-label="Loading knowledge base">
            <Spinner />
          </div>
        ) : !document.data ? (
          <div role="alert" className="space-y-3 text-sm text-red-700">
            <p>
              {knowledgeError(
                document.error,
                "Unable to load your knowledge base. Please try again.",
              )}
            </p>
            <Button
              variant="secondary"
              onClick={() => void document.refetch()}
              loading={document.isFetching}
            >
              Try again
            </Button>
          </div>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (
                draft &&
                dirty &&
                text.trim() &&
                text.length <= MAX_LENGTH &&
                !save.isPending
              ) {
                setSaved(false);
                save.mutate(draft);
              }
            }}
          >
            {document.data.reconstructed && (
              <p className="mb-3 text-sm text-gray-600">
                This editor contains your current saved knowledge, combined into
                one document.
              </p>
            )}
            <label htmlFor="business-knowledge" className="sr-only">
              Business knowledge
            </label>
            <textarea
              id="business-knowledge"
              aria-describedby="knowledge-description knowledge-count"
              value={text}
              onChange={(event) => {
                setDraft({
                  content: event.target.value,
                  revision: draft?.revision ?? document.data!.revision,
                });
                setSaved(false);
                save.reset();
              }}
              disabled={save.isPending}
              rows={18}
              maxLength={MAX_LENGTH}
              placeholder={
                "e.g. About our business\nDescribe your business and the services you offer.\n\nOpening hours\nList your working days and hours.\n\nPolicies and FAQs\nAdd booking, cancellation and other details customers often ask about."
              }
              className="w-full resize-y rounded-lg border border-gray-300 p-3 font-mono text-sm leading-relaxed focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
            />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button
                type="submit"
                loading={save.isPending}
                disabled={!dirty || !text.trim() || text.length > MAX_LENGTH}
              >
                <Save className="h-4 w-4" />
                {save.isPending ? "Saving knowledge…" : "Save Knowledge Base"}
              </Button>
              <span id="knowledge-count" className="text-xs text-gray-500">
                {text.length.toLocaleString()} / {MAX_LENGTH.toLocaleString()}{" "}
                chars
              </span>
              <span
                role="status"
                className="text-sm font-medium text-green-700"
              >
                {saved ? "Saved!" : ""}
              </span>
            </div>
            {dirty && !text.trim() && (
              <p className="mt-3 text-sm text-gray-600">
                Enter business knowledge before saving.
              </p>
            )}
            {text.length > MAX_LENGTH && (
              <p role="alert" className="mt-3 text-sm text-red-700">
                Shorten this document to 60,000 characters before saving.
              </p>
            )}
            {save.isPending && (
              <p role="status" className="mt-3 text-sm text-gray-500">
                Preparing your knowledge for the assistant. This may take a
                moment.
              </p>
            )}
            {(save.isError || document.isError) && (
              <div role="alert" className="mt-3 space-y-2 text-sm text-red-700">
                <p>
                  {knowledgeError(
                    save.error ?? document.error,
                    "Unable to save or refresh your knowledge base. Please check the connection and try again.",
                  )}
                </p>
                <p>
                  Your text is still in the editor. Copy any changes you want to
                  keep before loading the saved version.
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void loadSaved()}
                  loading={document.isFetching}
                  disabled={save.isPending}
                >
                  Load saved version
                </Button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
