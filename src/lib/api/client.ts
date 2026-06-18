import { GraphQLClient } from "graphql-request";
import { useServerStore } from "../store/serverStore";
import { invoke } from "@tauri-apps/api/core";

let client: GraphQLClient | null = null;
let clientUrl: string = "";

export function getClient(): GraphQLClient {
  let url = useServerStore.getState().url;
  url = url.replace("localhost", "127.0.0.1");
  const endpoint = `${url}/api/graphql`;
  if (!client || clientUrl !== endpoint) {
    client = new GraphQLClient(endpoint, {
      headers: {
        "Content-Type": "application/json",
      },
      fetch: async (input, init) => {
        try {
          const body = init?.body ? JSON.parse(init.body as string) : {};
          const result = await invoke<string>("graphql_request", { 
            query: body.query, 
            variables: body.variables ? JSON.stringify(body.variables) : null 
          });
          
          return new Response(result, {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } catch (e: any) {
          return new Response(JSON.stringify({ errors: [{ message: e.toString() }] }), { status: 500 });
        }
      }
    });
    clientUrl = endpoint;
  }
  return client;
}

export function getServerUrl(): string {
  let url = useServerStore.getState().url;
  return url.replace("localhost", "127.0.0.1");
}

export async function checkServerHealth(): Promise<boolean> {
  try {
    const result = await invoke<string>("graphql_request", {
      query: "{ aboutServer { name version } }",
      variables: null
    });
    const data = JSON.parse(result);
    return !!data.data?.aboutServer?.name;
  } catch {
    return false;
  }
}

export function getThumbnailUrl(mangaId: number): string {
  let url = useServerStore.getState().url;
  url = url.replace("localhost", "127.0.0.1");
  return `${url}/api/v1/manga/${mangaId}/thumbnail`;
}

export function getChapterPageUrl(
  mangaId: number,
  chapterIndex: number,
  pageIndex: number
): string {
  let url = useServerStore.getState().url;
  url = url.replace("localhost", "127.0.0.1");
  return `${url}/api/v1/manga/${mangaId}/chapter/${chapterIndex}/page/${pageIndex}`;
}
