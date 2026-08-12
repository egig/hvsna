import type { IReminderRegistryRepository } from "@/domain/task/IReminderRegistryRepository";
import { useRepositories } from "../repositories-context";

export function useReminderRegistryRepository(): IReminderRegistryRepository {
  return useRepositories().reminderRegistryRepository;
}
