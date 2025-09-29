export type AnalysisRecord = {
  id: string;
  input: string;
  analysis: string;
  post?: string;
};

type StoreShape = {
  data: Map<string, AnalysisRecord>;
  get: (id: string) => AnalysisRecord | undefined;
  save: (r: AnalysisRecord) => void;
  setPost: (id: string, post: string) => void;
};

const globalKey = "__MVP_MEMORY_STORE__" as const;

function getGlobalStore(): StoreShape {
  const g = globalThis as any;
  if (!g[globalKey]) {
    const data = new Map<string, AnalysisRecord>();
    g[globalKey] = {
      data,
      get: (id: string) => data.get(id),
      save: (r: AnalysisRecord) => data.set(r.id, r),
      setPost: (id: string, post: string) => {
        const rec = data.get(id);
        if (rec) {
          rec.post = post;
          data.set(id, rec);
        }
      },
    } satisfies StoreShape;
  }
  return g[globalKey] as StoreShape;
}

export const store = getGlobalStore();
