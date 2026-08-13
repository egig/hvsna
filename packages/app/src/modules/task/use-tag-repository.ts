import type { ITagRepository } from "@/domain/tag/ITagRepository";
import { useRepositories } from "../repositories-context";

export function useTagRepository(): ITagRepository {
  return useRepositories().tagRepository;
}
