import { asNullableTrimmedString } from "@/lib/parsing/coerce";

export function readRowRefIds(record: Record<string, unknown>) {
  return {
    clusterId: asNullableTrimmedString(record.clusterId),
    patternId: asNullableTrimmedString(record.patternId),
    createdAt: asNullableTrimmedString(record.createdAt),
    updatedAt: asNullableTrimmedString(record.updatedAt),
  };
}
